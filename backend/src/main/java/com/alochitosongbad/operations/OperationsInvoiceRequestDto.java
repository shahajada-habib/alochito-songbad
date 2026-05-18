package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OperationsInvoiceRequestDto {
    private Long adClientId;
    private Long adBookingId;
    private String invoiceNumber;
    private String title;
    private BigDecimal amount;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private OperationsInvoicePaymentStatus paymentStatus;
    private BigDecimal paidAmount;
    private String notes;

    public Long getAdClientId() { return adClientId; }
    public void setAdClientId(Long adClientId) { this.adClientId = adClientId; }
    public Long getAdBookingId() { return adBookingId; }
    public void setAdBookingId(Long adBookingId) { this.adBookingId = adBookingId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public OperationsInvoicePaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(OperationsInvoicePaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
