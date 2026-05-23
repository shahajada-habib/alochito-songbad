package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsAssignmentService {

    private final OperationsAssignmentRepository assignmentRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAssignmentService(
            OperationsAssignmentRepository assignmentRepository,
            OperationsStaffRepository staffRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.assignmentRepository = assignmentRepository;
        this.staffRepository = staffRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsAssignmentResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations assignments");
        return assignmentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsAssignmentResponseDto create(OperationsAssignmentRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations assignments");

        OperationsAssignment assignment = new OperationsAssignment();
        applyRequest(assignment, request);
        OperationsAssignment saved = assignmentRepository.save(assignment);
        activityLogService.record("Assignments", saved.getId(), OperationsActivityActionType.CREATED, saved.getTitle(), "Assignment created");
        return toResponse(saved);
    }

    public Optional<OperationsAssignmentResponseDto> update(Long id, OperationsAssignmentRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations assignments");

        return assignmentRepository.findById(id)
                .map((assignment) -> {
                    applyRequest(assignment, request);
                    OperationsAssignment saved = assignmentRepository.save(assignment);
                    activityLogService.record("Assignments", saved.getId(), OperationsActivityActionType.UPDATED, saved.getTitle(), "Assignment updated");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsAssignmentResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations assignments");

        return assignmentRepository.findById(id)
                .map((assignment) -> {
                    assignment.setStatus(OperationsAssignmentStatus.CANCELLED);
                    OperationsAssignment saved = assignmentRepository.save(assignment);
                    activityLogService.record("Assignments", saved.getId(), OperationsActivityActionType.CANCELLED, saved.getTitle(), "Assignment cancelled");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsAssignmentResponseDto> markAssigned(Long id) {
        return updateStatus(id, OperationsAssignmentStatus.ASSIGNED, "mark operations assignment assigned", "Assignment marked assigned");
    }

    public Optional<OperationsAssignmentResponseDto> markInProgress(Long id) {
        return updateStatus(id, OperationsAssignmentStatus.IN_PROGRESS, "mark operations assignment in progress", "Assignment marked in progress");
    }

    public Optional<OperationsAssignmentResponseDto> markCompleted(Long id) {
        return updateStatus(id, OperationsAssignmentStatus.COMPLETED, "mark operations assignment completed", "Assignment marked completed");
    }

    private Optional<OperationsAssignmentResponseDto> updateStatus(Long id, OperationsAssignmentStatus status, String permission, String description) {
        currentUserService.requireEditorOrAdmin(permission);
        return assignmentRepository.findById(id)
                .map((assignment) -> {
                    if (assignment.getStatus() == OperationsAssignmentStatus.CANCELLED) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled assignments cannot be updated");
                    }
                    assignment.setStatus(status);
                    OperationsAssignment saved = assignmentRepository.save(assignment);
                    record(saved, OperationsActivityActionType.STATUS_CHANGED, description);
                    return toResponse(saved);
                });
    }

    private void applyRequest(OperationsAssignment assignment, OperationsAssignmentRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }

        Long assignedStaffId = request.getAssignedStaffId();
        if (assignedStaffId == null || !staffRepository.existsById(assignedStaffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assigned staff does not exist");
        }

        assignment.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        assignment.setDescription(inputValidator.optional(request.getDescription(), 2000));
        assignment.setAssignedStaffId(assignedStaffId);
        assignment.setCategory(inputValidator.optional(request.getCategory(), 120));
        assignment.setLocation(inputValidator.optional(request.getLocation(), 180));
        assignment.setDeadline(request.getDeadline());
        assignment.setPriority(request.getPriority() == null ? OperationsAssignmentPriority.MEDIUM : request.getPriority());
        assignment.setStatus(request.getStatus() == null ? OperationsAssignmentStatus.DRAFT : request.getStatus());
        assignment.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsAssignmentResponseDto toResponse(OperationsAssignment assignment) {
        OperationsAssignmentResponseDto response = new OperationsAssignmentResponseDto();
        response.setId(assignment.getId());
        response.setTitle(assignment.getTitle());
        response.setDescription(assignment.getDescription());
        response.setAssignedStaffId(assignment.getAssignedStaffId());
        response.setCategory(assignment.getCategory());
        response.setLocation(assignment.getLocation());
        response.setDeadline(assignment.getDeadline());
        response.setPriority(assignment.getPriority());
        response.setStatus(assignment.getStatus());
        response.setNotes(assignment.getNotes());
        response.setCreatedAt(assignment.getCreatedAt());
        response.setUpdatedAt(assignment.getUpdatedAt());
        return response;
    }

    private void record(OperationsAssignment assignment, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Assignments", assignment.getId(), action, assignment.getTitle(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
