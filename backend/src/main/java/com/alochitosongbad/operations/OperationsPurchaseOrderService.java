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
public class OperationsPurchaseOrderService {

    private final OperationsPurchaseOrderRepository purchaseOrderRepository;
    private final OperationsPurchaseRequestRepository purchaseRequestRepository;
    private final OperationsVendorRepository vendorRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsPurchaseOrderService(
            OperationsPurchaseOrderRepository purchaseOrderRepository,
            OperationsPurchaseRequestRepository purchaseRequestRepository,
            OperationsVendorRepository vendorRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.vendorRepository = vendorRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsPurchaseOrderResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations purchase orders");
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsPurchaseOrderResponseDto create(OperationsPurchaseOrderRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations purchase orders");
        OperationsPurchaseOrder purchaseOrder = new OperationsPurchaseOrder();
        applyRequest(purchaseOrder, request, null);
        OperationsPurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
        record(saved, OperationsActivityActionType.CREATED, "Purchase order created");
        return toResponse(saved);
    }

    public Optional<OperationsPurchaseOrderResponseDto> update(Long id, OperationsPurchaseOrderRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations purchase orders");
        return purchaseOrderRepository.findById(id).map((purchaseOrder) -> {
            applyRequest(purchaseOrder, request, id);
            OperationsPurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
            record(saved, OperationsActivityActionType.UPDATED, "Purchase order updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsPurchaseOrderResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("cancel operations purchase orders");
        return purchaseOrderRepository.findById(id).map((purchaseOrder) -> {
            purchaseOrder.setPaymentStatus(OperationsPurchaseOrderPaymentStatus.CANCELLED);
            purchaseOrder.setOrderStatus(OperationsPurchaseOrderStatus.CANCELLED);
            OperationsPurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);
            record(saved, OperationsActivityActionType.CANCELLED, "Purchase order cancelled");
            return toResponse(saved);
        });
    }

    private void applyRequest(OperationsPurchaseOrder purchaseOrder, OperationsPurchaseOrderRequestDto request, Long currentId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (request.getVendorId() == null || !vendorRepository.existsById(request.getVendorId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "vendor must exist");
        }
        if (request.getPurchaseRequestId() != null && !purchaseRequestRepository.existsById(request.getPurchaseRequestId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purchaseRequestId must exist");
        }
        if (request.getOrderDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderDate is required");
        }
        if (request.getExpectedDeliveryDate() != null && request.getExpectedDeliveryDate().isBefore(request.getOrderDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "expectedDeliveryDate must not be before orderDate");
        }
        BigDecimal totalAmount = request.getTotalAmount() == null ? BigDecimal.ZERO : request.getTotalAmount();
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "totalAmount must not be negative");
        }
        String orderNumber = inputValidator.required(request.getOrderNumber(), "orderNumber", 80);
        boolean duplicate = currentId == null
                ? purchaseOrderRepository.existsByOrderNumber(orderNumber)
                : purchaseOrderRepository.existsByOrderNumberAndIdNot(orderNumber, currentId);
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderNumber must be unique");
        }
        purchaseOrder.setPurchaseRequestId(request.getPurchaseRequestId());
        purchaseOrder.setVendorId(request.getVendorId());
        purchaseOrder.setOrderNumber(orderNumber);
        purchaseOrder.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        purchaseOrder.setOrderDate(request.getOrderDate());
        purchaseOrder.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        purchaseOrder.setTotalAmount(totalAmount);
        purchaseOrder.setPaymentStatus(request.getPaymentStatus() == null ? OperationsPurchaseOrderPaymentStatus.UNPAID : request.getPaymentStatus());
        purchaseOrder.setOrderStatus(request.getOrderStatus() == null ? OperationsPurchaseOrderStatus.DRAFT : request.getOrderStatus());
        purchaseOrder.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsPurchaseOrderResponseDto toResponse(OperationsPurchaseOrder purchaseOrder) {
        OperationsPurchaseOrderResponseDto response = new OperationsPurchaseOrderResponseDto();
        response.setId(purchaseOrder.getId());
        response.setPurchaseRequestId(purchaseOrder.getPurchaseRequestId());
        response.setVendorId(purchaseOrder.getVendorId());
        response.setOrderNumber(purchaseOrder.getOrderNumber());
        response.setTitle(purchaseOrder.getTitle());
        response.setOrderDate(purchaseOrder.getOrderDate());
        response.setExpectedDeliveryDate(purchaseOrder.getExpectedDeliveryDate());
        response.setTotalAmount(purchaseOrder.getTotalAmount());
        response.setPaymentStatus(purchaseOrder.getPaymentStatus());
        response.setOrderStatus(purchaseOrder.getOrderStatus());
        response.setNotes(purchaseOrder.getNotes());
        response.setCreatedAt(purchaseOrder.getCreatedAt());
        response.setUpdatedAt(purchaseOrder.getUpdatedAt());
        return response;
    }

    private void record(OperationsPurchaseOrder purchaseOrder, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Purchase Orders", purchaseOrder.getId(), action, purchaseOrder.getOrderNumber(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
