package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsNotificationService {

    private final OperationsNotificationRepository notificationRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsNotificationService(
            OperationsNotificationRepository notificationRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.notificationRepository = notificationRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsNotificationResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations notifications");
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsNotificationResponseDto create(OperationsNotificationRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations notifications");
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        OperationsNotification notification = new OperationsNotification();
        notification.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        notification.setMessage(inputValidator.required(request.getMessage(), "message", 3000));
        notification.setNotificationType(request.getNotificationType() == null ? OperationsNotificationType.INFO : request.getNotificationType());
        notification.setSourceModule(inputValidator.optional(request.getSourceModule(), 80));
        notification.setSourceEntityId(request.getSourceEntityId());
        notification.setDueAt(request.getDueAt());
        notification.setReadStatus(OperationsNotificationReadStatus.UNREAD);
        OperationsNotification saved = notificationRepository.save(notification);
        record(saved, OperationsActivityActionType.CREATED, "Notification created");
        return toResponse(saved);
    }

    public Optional<OperationsNotificationResponseDto> markRead(Long id) {
        currentUserService.requireEditorOrAdmin("mark operations notification read");
        return notificationRepository.findById(id).map((notification) -> {
            notification.setReadStatus(OperationsNotificationReadStatus.READ);
            OperationsNotification saved = notificationRepository.save(notification);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Notification marked read");
            return toResponse(saved);
        });
    }

    public List<OperationsNotificationResponseDto> markAllRead() {
        currentUserService.requireEditorOrAdmin("mark all operations notifications read");
        List<OperationsNotification> unread = notificationRepository.findByReadStatusOrderByCreatedAtDesc(OperationsNotificationReadStatus.UNREAD);
        unread.forEach((notification) -> notification.setReadStatus(OperationsNotificationReadStatus.READ));
        List<OperationsNotification> saved = notificationRepository.saveAll(unread);
        if (!saved.isEmpty()) {
            try {
                activityLogService.record("Notifications", null, OperationsActivityActionType.STATUS_CHANGED, "Notifications", "All notifications marked read");
            } catch (RuntimeException ignored) {
                // Activity logging must not block the operational workflow.
            }
        }
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    private OperationsNotificationResponseDto toResponse(OperationsNotification notification) {
        OperationsNotificationResponseDto response = new OperationsNotificationResponseDto();
        response.setId(notification.getId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setNotificationType(notification.getNotificationType());
        response.setSourceModule(notification.getSourceModule());
        response.setSourceEntityId(notification.getSourceEntityId());
        response.setReadStatus(notification.getReadStatus());
        response.setDueAt(notification.getDueAt());
        response.setCreatedAt(notification.getCreatedAt());
        response.setUpdatedAt(notification.getUpdatedAt());
        return response;
    }

    private void record(OperationsNotification notification, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Notifications", notification.getId(), action, notification.getTitle(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
