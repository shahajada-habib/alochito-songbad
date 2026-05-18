package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OperationsAdBookingRequestDto {
    private Long adClientId;
    private String title;
    private OperationsAdPlacement placement;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal price;
    private OperationsAdPaymentStatus paymentStatus;
    private OperationsAdPublishStatus publishStatus;
    private String salesOwner;
    private String notes;

    public Long getAdClientId() {
        return adClientId;
    }

    public void setAdClientId(Long adClientId) {
        this.adClientId = adClientId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public OperationsAdPlacement getPlacement() {
        return placement;
    }

    public void setPlacement(OperationsAdPlacement placement) {
        this.placement = placement;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public OperationsAdPaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(OperationsAdPaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public OperationsAdPublishStatus getPublishStatus() {
        return publishStatus;
    }

    public void setPublishStatus(OperationsAdPublishStatus publishStatus) {
        this.publishStatus = publishStatus;
    }

    public String getSalesOwner() {
        return salesOwner;
    }

    public void setSalesOwner(String salesOwner) {
        this.salesOwner = salesOwner;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
