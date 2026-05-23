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
public class OperationsInvoiceService {

    private final OperationsInvoiceRepository invoiceRepository;
    private final OperationsAdClientRepository adClientRepository;
    private final OperationsAdBookingRepository adBookingRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsInvoiceService(
            OperationsInvoiceRepository invoiceRepository,
            OperationsAdClientRepository adClientRepository,
            OperationsAdBookingRepository adBookingRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.invoiceRepository = invoiceRepository;
        this.adClientRepository = adClientRepository;
        this.adBookingRepository = adBookingRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsInvoiceResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations invoices");
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsInvoiceResponseDto create(OperationsInvoiceRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations invoices");

        OperationsInvoice invoice = new OperationsInvoice();
        applyRequest(invoice, request, null);
        OperationsInvoice saved = invoiceRepository.save(invoice);
        activityLogService.record("Invoices", saved.getId(), OperationsActivityActionType.CREATED, saved.getInvoiceNumber(), "Invoice created");
        return toResponse(saved);
    }

    public Optional<OperationsInvoiceResponseDto> update(Long id, OperationsInvoiceRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations invoices");

        return invoiceRepository.findById(id)
                .map((invoice) -> {
                    applyRequest(invoice, request, id);
                    OperationsInvoice saved = invoiceRepository.save(invoice);
                    activityLogService.record("Invoices", saved.getId(), OperationsActivityActionType.UPDATED, saved.getInvoiceNumber(), "Invoice updated");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsInvoiceResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations invoices");

        return invoiceRepository.findById(id)
                .map((invoice) -> {
                    invoice.setPaymentStatus(OperationsInvoicePaymentStatus.CANCELLED);
                    OperationsInvoice saved = invoiceRepository.save(invoice);
                    activityLogService.record("Invoices", saved.getId(), OperationsActivityActionType.CANCELLED, saved.getInvoiceNumber(), "Invoice cancelled");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsInvoiceResponseDto> markPaid(Long id) {
        currentUserService.requireEditorOrAdmin("mark operations invoice paid");
        return invoiceRepository.findById(id).map((invoice) -> {
            requireActive(invoice, "Cancelled invoices cannot be marked paid");
            if (invoice.getAmount() == null || invoice.getAmount().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invoice amount must be valid");
            }
            invoice.setPaymentStatus(OperationsInvoicePaymentStatus.PAID);
            invoice.setPaidAmount(invoice.getAmount());
            OperationsInvoice saved = invoiceRepository.save(invoice);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Invoice marked paid");
            return toResponse(saved);
        });
    }

    public Optional<OperationsInvoiceResponseDto> markUnpaid(Long id) {
        currentUserService.requireEditorOrAdmin("mark operations invoice unpaid");
        return invoiceRepository.findById(id).map((invoice) -> {
            requireActive(invoice, "Cancelled invoices cannot be marked unpaid");
            invoice.setPaymentStatus(OperationsInvoicePaymentStatus.UNPAID);
            invoice.setPaidAmount(BigDecimal.ZERO);
            OperationsInvoice saved = invoiceRepository.save(invoice);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Invoice marked unpaid");
            return toResponse(saved);
        });
    }

    public Optional<OperationsInvoiceResponseDto> markPartial(Long id, OperationsInvoicePartialPaymentRequestDto request) {
        currentUserService.requireEditorOrAdmin("mark operations invoice partial");
        return invoiceRepository.findById(id).map((invoice) -> {
            requireActive(invoice, "Cancelled invoices cannot be marked partial");
            if (request == null || request.getPaidAmount() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paidAmount is required");
            }
            BigDecimal paidAmount = request.getPaidAmount();
            if (paidAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paidAmount must not be negative");
            }
            BigDecimal amount = invoice.getAmount() == null ? BigDecimal.ZERO : invoice.getAmount();
            if (paidAmount.compareTo(amount) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paidAmount must not be greater than amount");
            }
            invoice.setPaymentStatus(OperationsInvoicePaymentStatus.PARTIAL);
            invoice.setPaidAmount(paidAmount);
            OperationsInvoice saved = invoiceRepository.save(invoice);
            record(saved, OperationsActivityActionType.STATUS_CHANGED, "Invoice marked partial");
            return toResponse(saved);
        });
    }

    private void requireActive(OperationsInvoice invoice, String message) {
        if (invoice.getPaymentStatus() == OperationsInvoicePaymentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private void applyRequest(OperationsInvoice invoice, OperationsInvoiceRequestDto request, Long currentId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        Long adClientId = request.getAdClientId();
        if (adClientId == null || !adClientRepository.existsById(adClientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ad client does not exist");
        }
        Long adBookingId = request.getAdBookingId();
        if (adBookingId != null && !adBookingRepository.existsById(adBookingId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ad booking does not exist");
        }
        if (request.getIssueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "issueDate is required");
        }
        if (request.getDueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate is required");
        }
        if (request.getDueDate().isBefore(request.getIssueDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dueDate must not be before issueDate");
        }

        BigDecimal amount = request.getAmount() == null ? BigDecimal.ZERO : request.getAmount();
        BigDecimal paidAmount = request.getPaidAmount() == null ? BigDecimal.ZERO : request.getPaidAmount();
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must not be negative");
        }
        if (paidAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paidAmount must not be negative");
        }
        if (paidAmount.compareTo(amount) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "paidAmount must not be greater than amount");
        }

        String invoiceNumber = inputValidator.required(request.getInvoiceNumber(), "invoiceNumber", 80);
        boolean duplicate = currentId == null
                ? invoiceRepository.existsByInvoiceNumber(invoiceNumber)
                : invoiceRepository.existsByInvoiceNumberAndIdNot(invoiceNumber, currentId);
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invoiceNumber must be unique");
        }

        invoice.setAdClientId(adClientId);
        invoice.setAdBookingId(adBookingId);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        invoice.setAmount(amount);
        invoice.setIssueDate(request.getIssueDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setPaymentStatus(request.getPaymentStatus() == null
                ? OperationsInvoicePaymentStatus.UNPAID
                : request.getPaymentStatus());
        invoice.setPaidAmount(paidAmount);
        invoice.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsInvoiceResponseDto toResponse(OperationsInvoice invoice) {
        OperationsInvoiceResponseDto response = new OperationsInvoiceResponseDto();
        response.setId(invoice.getId());
        response.setAdClientId(invoice.getAdClientId());
        response.setAdBookingId(invoice.getAdBookingId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setTitle(invoice.getTitle());
        response.setAmount(invoice.getAmount());
        response.setIssueDate(invoice.getIssueDate());
        response.setDueDate(invoice.getDueDate());
        response.setPaymentStatus(invoice.getPaymentStatus());
        response.setPaidAmount(invoice.getPaidAmount());
        response.setNotes(invoice.getNotes());
        response.setCreatedAt(invoice.getCreatedAt());
        response.setUpdatedAt(invoice.getUpdatedAt());
        return response;
    }

    private void record(OperationsInvoice invoice, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Invoices", invoice.getId(), action, invoice.getInvoiceNumber(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
