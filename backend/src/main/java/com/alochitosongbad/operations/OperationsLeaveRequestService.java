package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsLeaveRequestService {

    private final OperationsLeaveRequestRepository leaveRequestRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsLeaveRequestService(
            OperationsLeaveRequestRepository leaveRequestRepository,
            OperationsStaffRepository staffRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.staffRepository = staffRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsLeaveRequestResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations leave requests");
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsLeaveRequestResponseDto create(OperationsLeaveRequestRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations leave requests");
        OperationsLeaveRequest leaveRequest = new OperationsLeaveRequest();
        applyRequest(leaveRequest, request);
        OperationsLeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        record(saved, OperationsActivityActionType.CREATED, "Leave request created");
        return toResponse(saved);
    }

    public Optional<OperationsLeaveRequestResponseDto> update(Long id, OperationsLeaveRequestRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations leave requests");
        return leaveRequestRepository.findById(id).map((leaveRequest) -> {
            applyRequest(leaveRequest, request);
            OperationsLeaveRequest saved = leaveRequestRepository.save(leaveRequest);
            record(saved, OperationsActivityActionType.UPDATED, "Leave request updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsLeaveRequestResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("cancel operations leave requests");
        return leaveRequestRepository.findById(id).map((leaveRequest) -> {
            leaveRequest.setStatus(OperationsLeaveStatus.CANCELLED);
            OperationsLeaveRequest saved = leaveRequestRepository.save(leaveRequest);
            record(saved, OperationsActivityActionType.CANCELLED, "Leave request cancelled");
            return toResponse(saved);
        });
    }

    private void applyRequest(OperationsLeaveRequest leaveRequest, OperationsLeaveRequestRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (request.getStaffId() == null || !staffRepository.existsById(request.getStaffId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "staff must exist");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate and endDate are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must not be before startDate");
        }
        BigDecimal totalDays = request.getTotalDays() == null ? BigDecimal.ZERO : request.getTotalDays();
        if (totalDays.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "totalDays must not be negative");
        }
        leaveRequest.setStaffId(request.getStaffId());
        leaveRequest.setLeaveType(request.getLeaveType() == null ? OperationsLeaveType.CASUAL : request.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setTotalDays(totalDays);
        leaveRequest.setReason(inputValidator.optional(request.getReason(), 2000));
        leaveRequest.setStatus(request.getStatus() == null ? OperationsLeaveStatus.PENDING : request.getStatus());
        leaveRequest.setReviewerName(inputValidator.optional(request.getReviewerName(), 150));
        leaveRequest.setReviewNote(inputValidator.optional(request.getReviewNote(), 2000));
    }

    private OperationsLeaveRequestResponseDto toResponse(OperationsLeaveRequest leaveRequest) {
        OperationsLeaveRequestResponseDto response = new OperationsLeaveRequestResponseDto();
        response.setId(leaveRequest.getId());
        response.setStaffId(leaveRequest.getStaffId());
        response.setLeaveType(leaveRequest.getLeaveType());
        response.setStartDate(leaveRequest.getStartDate());
        response.setEndDate(leaveRequest.getEndDate());
        response.setTotalDays(leaveRequest.getTotalDays());
        response.setReason(leaveRequest.getReason());
        response.setStatus(leaveRequest.getStatus());
        response.setReviewerName(leaveRequest.getReviewerName());
        response.setReviewNote(leaveRequest.getReviewNote());
        response.setCreatedAt(leaveRequest.getCreatedAt());
        response.setUpdatedAt(leaveRequest.getUpdatedAt());
        return response;
    }

    private void record(OperationsLeaveRequest leaveRequest, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Leave Requests", leaveRequest.getId(), action, "Leave request " + leaveRequest.getStartDate(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
