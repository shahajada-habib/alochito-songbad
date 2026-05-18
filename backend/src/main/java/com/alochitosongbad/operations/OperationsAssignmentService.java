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
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAssignmentService(
            OperationsAssignmentRepository assignmentRepository,
            OperationsStaffRepository staffRepository,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.assignmentRepository = assignmentRepository;
        this.staffRepository = staffRepository;
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
        return toResponse(assignmentRepository.save(assignment));
    }

    public Optional<OperationsAssignmentResponseDto> update(Long id, OperationsAssignmentRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations assignments");

        return assignmentRepository.findById(id)
                .map((assignment) -> {
                    applyRequest(assignment, request);
                    return toResponse(assignmentRepository.save(assignment));
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
}
