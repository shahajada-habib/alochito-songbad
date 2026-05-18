package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class OperationsPurchaseOrderResponseDto {
    private Long id;
    private Long purchaseRequestId;
    private Long vendorId;
    private String orderNumber;
    private String title;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private BigDecimal totalAmount;
    private OperationsPurchaseOrderPaymentStatus paymentStatus;
    private OperationsPurchaseOrderStatus orderStatus;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPurchaseRequestId() { return purchaseRequestId; }
    public void setPurchaseRequestId(Long purchaseRequestId) { this.purchaseRequestId = purchaseRequestId; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }
    public LocalDate getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public OperationsPurchaseOrderPaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(OperationsPurchaseOrderPaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public OperationsPurchaseOrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OperationsPurchaseOrderStatus orderStatus) { this.orderStatus = orderStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
