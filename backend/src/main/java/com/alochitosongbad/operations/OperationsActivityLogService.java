package com.alochitosongbad.operations;

import java.util.List;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.stereotype.Service;

@Service
public class OperationsActivityLogService {

    private final OperationsActivityLogRepository activityLogRepository;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsActivityLogService(
            OperationsActivityLogRepository activityLogRepository,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.activityLogRepository = activityLogRepository;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsActivityLogResponseDto> getRecent() {
        currentUserService.requireEditorOrAdmin("view operations activity log");
        return activityLogRepository.findTop30ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public void record(String moduleName, Long entityId, OperationsActivityActionType actionType, String title, String description) {
        OperationsActivityLog log = new OperationsActivityLog();
        log.setModuleName(inputValidator.required(moduleName, "moduleName", 80));
        log.setEntityId(entityId);
        log.setActionType(actionType);
        log.setTitle(inputValidator.required(title, "title", 180));
        log.setDescription(inputValidator.optional(description, 2000));
        log.setActorName(inputValidator.optional(currentUserService.username(), 150));
        activityLogRepository.save(log);
    }

    private OperationsActivityLogResponseDto toResponse(OperationsActivityLog log) {
        OperationsActivityLogResponseDto response = new OperationsActivityLogResponseDto();
        response.setId(log.getId());
        response.setModuleName(log.getModuleName());
        response.setEntityId(log.getEntityId());
        response.setActionType(log.getActionType());
        response.setTitle(log.getTitle());
        response.setDescription(log.getDescription());
        response.setActorName(log.getActorName());
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }
}
