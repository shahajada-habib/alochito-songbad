package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class OperationsExpenseResponseDto {
    private Long id;
    private String title;
    private OperationsExpenseCategory category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String paidBy;
    private OperationsPaymentMethod paymentMethod;
    private OperationsExpenseStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public OperationsExpenseCategory getCategory() { return category; }
    public void setCategory(OperationsExpenseCategory category) { this.category = category; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }
    public OperationsPaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(OperationsPaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public OperationsExpenseStatus getStatus() { return status; }
    public void setStatus(OperationsExpenseStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
