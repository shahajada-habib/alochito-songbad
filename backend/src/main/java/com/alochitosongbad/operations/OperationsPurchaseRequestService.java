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
public class OperationsPurchaseRequestService {

    private final OperationsPurchaseRequestRepository purchaseRequestRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsDepartmentRepository departmentRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsPurchaseRequestService(
            OperationsPurchaseRequestRepository purchaseRequestRepository,
            OperationsStaffRepository staffRepository,
            OperationsDepartmentRepository departmentRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.staffRepository = staffRepository;
        this.departmentRepository = departmentRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsPurchaseRequestResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations purchase requests");
        return purchaseRequestRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsPurchaseRequestResponseDto create(OperationsPurchaseRequestRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations purchase requests");
        OperationsPurchaseRequest purchaseRequest = new OperationsPurchaseRequest();
        applyRequest(purchaseRequest, request);
        OperationsPurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
        record(saved, OperationsActivityActionType.CREATED, "Purchase request created");
        return toResponse(saved);
    }

    public Optional<OperationsPurchaseRequestResponseDto> update(Long id, OperationsPurchaseRequestRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations purchase requests");
        return purchaseRequestRepository.findById(id).map((purchaseRequest) -> {
            applyRequest(purchaseRequest, request);
            OperationsPurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
            record(saved, OperationsActivityActionType.UPDATED, "Purchase request updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsPurchaseRequestResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("cancel operations purchase requests");
        return purchaseRequestRepository.findById(id).map((purchaseRequest) -> {
            purchaseRequest.setStatus(OperationsPurchaseRequestStatus.CANCELLED);
            OperationsPurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
            record(saved, OperationsActivityActionType.CANCELLED, "Purchase request cancelled");
            return toResponse(saved);
        });
    }

    public Optional<OperationsPurchaseRequestResponseDto> approve(Long id) {
        currentUserService.requireEditorOrAdmin("approve operations purchase requests");
        return purchaseRequestRepository.findById(id).map((purchaseRequest) -> {
            requireReviewable(purchaseRequest, "Cancelled purchase requests cannot be approved");
            purchaseRequest.setStatus(OperationsPurchaseRequestStatus.APPROVED);
            OperationsPurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Purchase request approved");
            return toResponse(saved);
        });
    }

    public Optional<OperationsPurchaseRequestResponseDto> reject(Long id) {
        currentUserService.requireEditorOrAdmin("reject operations purchase requests");
        return purchaseRequestRepository.findById(id).map((purchaseRequest) -> {
            requireReviewable(purchaseRequest, "Cancelled purchase requests cannot be rejected");
            purchaseRequest.setStatus(OperationsPurchaseRequestStatus.REJECTED);
            OperationsPurchaseRequest saved = purchaseRequestRepository.save(purchaseRequest);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Purchase request rejected");
            return toResponse(saved);
        });
    }

    private void requireReviewable(OperationsPurchaseRequest purchaseRequest, String message) {
        if (purchaseRequest.getStatus() == OperationsPurchaseRequestStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void applyRequest(OperationsPurchaseRequest purchaseRequest, OperationsPurchaseRequestRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (request.getRequestedByStaffId() != null && !staffRepository.existsById(request.getRequestedByStaffId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requestedByStaffId must exist");
        }
        if (request.getDepartmentId() != null && !departmentRepository.existsById(request.getDepartmentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "departmentId must exist");
        }
        if (request.getRequestDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "requestDate is required");
        }
        if (request.getNeededByDate() != null && request.getNeededByDate().isBefore(request.getRequestDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "neededByDate must not be before requestDate");
        }
        BigDecimal estimatedAmount = request.getEstimatedAmount() == null ? BigDecimal.ZERO : request.getEstimatedAmount();
        if (estimatedAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "estimatedAmount must not be negative");
        }
        purchaseRequest.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        purchaseRequest.setRequestedByStaffId(request.getRequestedByStaffId());
        purchaseRequest.setDepartmentId(request.getDepartmentId());
        purchaseRequest.setItemDescription(inputValidator.required(request.getItemDescription(), "itemDescription", 3000));
        purchaseRequest.setEstimatedAmount(estimatedAmount);
        purchaseRequest.setRequestDate(request.getRequestDate());
        purchaseRequest.setNeededByDate(request.getNeededByDate());
        purchaseRequest.setPriority(request.getPriority() == null ? OperationsPurchaseRequestPriority.MEDIUM : request.getPriority());
        purchaseRequest.setStatus(request.getStatus() == null ? OperationsPurchaseRequestStatus.DRAFT : request.getStatus());
        purchaseRequest.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsPurchaseRequestResponseDto toResponse(OperationsPurchaseRequest purchaseRequest) {
        OperationsPurchaseRequestResponseDto response = new OperationsPurchaseRequestResponseDto();
        response.setId(purchaseRequest.getId());
        response.setTitle(purchaseRequest.getTitle());
        response.setRequestedByStaffId(purchaseRequest.getRequestedByStaffId());
        response.setDepartmentId(purchaseRequest.getDepartmentId());
        response.setItemDescription(purchaseRequest.getItemDescription());
        response.setEstimatedAmount(purchaseRequest.getEstimatedAmount());
        response.setRequestDate(purchaseRequest.getRequestDate());
        response.setNeededByDate(purchaseRequest.getNeededByDate());
        response.setPriority(purchaseRequest.getPriority());
        response.setStatus(purchaseRequest.getStatus());
        response.setNotes(purchaseRequest.getNotes());
        response.setCreatedAt(purchaseRequest.getCreatedAt());
        response.setUpdatedAt(purchaseRequest.getUpdatedAt());
        return response;
    }

    private void record(OperationsPurchaseRequest purchaseRequest, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Purchase Requests", purchaseRequest.getId(), action, purchaseRequest.getTitle(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
