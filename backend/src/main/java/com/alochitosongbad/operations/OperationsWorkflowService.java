package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import com.alochitosongbad.security.CurrentUserService;

import org.springframework.stereotype.Service;

@Service
public class OperationsWorkflowService {

    private final OperationsLeaveRequestRepository leaveRequestRepository;
    private final OperationsPurchaseRequestRepository purchaseRequestRepository;
    private final OperationsInvoiceRepository invoiceRepository;
    private final OperationsExpenseRepository expenseRepository;
    private final OperationsAdBookingRepository adBookingRepository;
    private final OperationsPurchaseOrderRepository purchaseOrderRepository;
    private final OperationsAssignmentRepository assignmentRepository;
    private final CurrentUserService currentUserService;

    public OperationsWorkflowService(
            OperationsLeaveRequestRepository leaveRequestRepository,
            OperationsPurchaseRequestRepository purchaseRequestRepository,
            OperationsInvoiceRepository invoiceRepository,
            OperationsExpenseRepository expenseRepository,
            OperationsAdBookingRepository adBookingRepository,
            OperationsPurchaseOrderRepository purchaseOrderRepository,
            OperationsAssignmentRepository assignmentRepository,
            CurrentUserService currentUserService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.adBookingRepository = adBookingRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.assignmentRepository = assignmentRepository;
        this.currentUserService = currentUserService;
    }

    public List<OperationsApprovalQueueItemDto> approvalQueue() {
        currentUserService.requireEditorOrAdmin("view operations approval queue");
        return Stream.of(
                leaveApprovals(),
                purchaseApprovals(),
                paymentFollowUps(),
                expenseFollowUps(),
                campaignFollowUps())
                .flatMap((items) -> items)
                .sorted(Comparator.comparing(OperationsApprovalQueueItemDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    public List<OperationsReminderResponseDto> reminders() {
        currentUserService.requireEditorOrAdmin("view operations reminders");
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        LocalDate soon = today.plusDays(7);
        return Stream.of(
                invoiceReminders(today, soon),
                purchaseOrderReminders(today, soon),
                assignmentReminders(today, soon),
                leaveReminders(today),
                adBookingReminders(today, soon))
                .flatMap((items) -> items)
                .sorted(Comparator.comparing(OperationsReminderResponseDto::getDueDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    private Stream<OperationsApprovalQueueItemDto> leaveApprovals() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getStatus() == OperationsLeaveStatus.PENDING)
                .map((item) -> approval("leave-" + item.getId(), "Leave Requests", item.getId(), "Leave request " + item.getStartDate(), item.getStatus().name(), null, null, item.getStartDate(), item.getCreatedAt(), "Review leave request"));
    }

    private Stream<OperationsApprovalQueueItemDto> purchaseApprovals() {
        return purchaseRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getStatus() == OperationsPurchaseRequestStatus.SUBMITTED)
                .map((item) -> approval("purchase-request-" + item.getId(), "Purchase Requests", item.getId(), item.getTitle(), item.getStatus().name(), item.getPriority().name(), item.getEstimatedAmount(), item.getNeededByDate(), item.getCreatedAt(), "Review purchase request"));
    }

    private Stream<OperationsApprovalQueueItemDto> paymentFollowUps() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getPaymentStatus() == OperationsInvoicePaymentStatus.UNPAID || item.getPaymentStatus() == OperationsInvoicePaymentStatus.PARTIAL)
                .map((item) -> approval("invoice-" + item.getId(), "Invoices", item.getId(), item.getInvoiceNumber() + " - " + item.getTitle(), item.getPaymentStatus().name(), null, item.getAmount(), item.getDueDate(), item.getCreatedAt(), "Follow up payment"));
    }

    private Stream<OperationsApprovalQueueItemDto> expenseFollowUps() {
        return expenseRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getStatus() == OperationsExpenseStatus.DRAFT || item.getStatus() == OperationsExpenseStatus.APPROVED)
                .map((item) -> approval("expense-" + item.getId(), "Expenses", item.getId(), item.getTitle(), item.getStatus().name(), null, item.getAmount(), item.getExpenseDate(), item.getCreatedAt(), "Review expense"));
    }

    private Stream<OperationsApprovalQueueItemDto> campaignFollowUps() {
        return adBookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getPublishStatus() == OperationsAdPublishStatus.DRAFT || item.getPublishStatus() == OperationsAdPublishStatus.SCHEDULED)
                .map((item) -> approval("ad-booking-" + item.getId(), "Ad Bookings", item.getId(), item.getTitle(), item.getPublishStatus().name(), null, item.getPrice(), item.getEndDate(), item.getCreatedAt(), "Check campaign status"));
    }

    private Stream<OperationsReminderResponseDto> invoiceReminders(LocalDate today, LocalDate soon) {
        return invoiceRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getPaymentStatus() == OperationsInvoicePaymentStatus.UNPAID || item.getPaymentStatus() == OperationsInvoicePaymentStatus.PARTIAL || item.getPaymentStatus() == OperationsInvoicePaymentStatus.OVERDUE)
                .filter((item) -> item.getDueDate() != null && !item.getDueDate().isAfter(soon))
                .map((item) -> reminder("invoice-" + item.getId(), "Invoices", item.getId(), item.getInvoiceNumber(), "Invoice due", item.getDueDate(), severity(item.getDueDate(), today), "Invoice payment is due soon or overdue."));
    }

    private Stream<OperationsReminderResponseDto> purchaseOrderReminders(LocalDate today, LocalDate soon) {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getOrderStatus() != OperationsPurchaseOrderStatus.CANCELLED && item.getOrderStatus() != OperationsPurchaseOrderStatus.RECEIVED)
                .filter((item) -> item.getExpectedDeliveryDate() != null && !item.getExpectedDeliveryDate().isAfter(soon))
                .map((item) -> reminder("purchase-order-" + item.getId(), "Purchase Orders", item.getId(), item.getOrderNumber(), "Expected delivery", item.getExpectedDeliveryDate(), severity(item.getExpectedDeliveryDate(), today), "Purchase order delivery is due soon or overdue."));
    }

    private Stream<OperationsReminderResponseDto> assignmentReminders(LocalDate today, LocalDate soon) {
        return assignmentRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getStatus() != OperationsAssignmentStatus.CANCELLED && item.getStatus() != OperationsAssignmentStatus.COMPLETED)
                .filter((item) -> item.getDeadline() != null)
                .filter((item) -> !item.getDeadline().toLocalDate().isAfter(soon))
                .map((item) -> reminder("assignment-" + item.getId(), "Assignments", item.getId(), item.getTitle(), "Assignment deadline", item.getDeadline().toLocalDate(), severity(item.getDeadline().toLocalDate(), today), "Assignment deadline is due soon or overdue."));
    }

    private Stream<OperationsReminderResponseDto> leaveReminders(LocalDate today) {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getStatus() == OperationsLeaveStatus.PENDING)
                .map((item) -> reminder("leave-" + item.getId(), "Leave Requests", item.getId(), "Leave request " + item.getStartDate(), "Pending leave request", item.getStartDate(), severity(item.getStartDate(), today), "Leave request is waiting for review."));
    }

    private Stream<OperationsReminderResponseDto> adBookingReminders(LocalDate today, LocalDate soon) {
        return adBookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter((item) -> item.getPublishStatus() == OperationsAdPublishStatus.SCHEDULED || item.getPublishStatus() == OperationsAdPublishStatus.RUNNING)
                .filter((item) -> item.getEndDate() != null && !item.getEndDate().isAfter(soon))
                .map((item) -> reminder("ad-booking-" + item.getId(), "Ad Bookings", item.getId(), item.getTitle(), "Campaign ending", item.getEndDate(), severity(item.getEndDate(), today), "Ad booking is scheduled or ending soon."));
    }

    private OperationsApprovalQueueItemDto approval(String id, String moduleName, Long entityId, String title, String status, String priority, BigDecimal amount, LocalDate dueDate, java.time.LocalDateTime createdAt, String actionLabel) {
        OperationsApprovalQueueItemDto item = new OperationsApprovalQueueItemDto();
        item.setId(id);
        item.setModuleName(moduleName);
        item.setEntityId(entityId);
        item.setTitle(title);
        item.setStatus(status);
        item.setPriority(priority);
        item.setAmount(amount);
        item.setDueDate(dueDate);
        item.setCreatedAt(createdAt);
        item.setActionLabel(actionLabel);
        return item;
    }

    private OperationsReminderResponseDto reminder(String id, String moduleName, Long entityId, String title, String reminderType, LocalDate dueDate, OperationsReminderSeverity severity, String description) {
        OperationsReminderResponseDto item = new OperationsReminderResponseDto();
        item.setId(id);
        item.setModuleName(moduleName);
        item.setEntityId(entityId);
        item.setTitle(title);
        item.setReminderType(reminderType);
        item.setDueDate(dueDate);
        item.setSeverity(severity);
        item.setDescription(description);
        return item;
    }

    private OperationsReminderSeverity severity(LocalDate dueDate, LocalDate today) {
        if (dueDate == null) {
            return OperationsReminderSeverity.LOW;
        }
        if (dueDate.isBefore(today)) {
            return OperationsReminderSeverity.URGENT;
        }
        long days = java.time.temporal.ChronoUnit.DAYS.between(today, dueDate);
        if (days <= 1) {
            return OperationsReminderSeverity.HIGH;
        }
        if (days <= 3) {
            return OperationsReminderSeverity.MEDIUM;
        }
        return OperationsReminderSeverity.LOW;
    }
}
