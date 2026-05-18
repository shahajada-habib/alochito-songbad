package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "operations_ad_bookings")
public class OperationsAdBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ad_client_id", nullable = false)
    private Long adClientId;

    @Column(nullable = false, length = 180)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OperationsAdPlacement placement = OperationsAdPlacement.HOME_TOP;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private OperationsAdPaymentStatus paymentStatus = OperationsAdPaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_status", nullable = false, length = 30)
    private OperationsAdPublishStatus publishStatus = OperationsAdPublishStatus.DRAFT;

    @Column(name = "sales_owner", length = 150)
    private String salesOwner;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        normalizeDefaults();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        normalizeDefaults();
    }

    private void normalizeDefaults() {
        if (placement == null) {
            placement = OperationsAdPlacement.HOME_TOP;
        }
        if (price == null) {
            price = BigDecimal.ZERO;
        }
        if (paymentStatus == null) {
            paymentStatus = OperationsAdPaymentStatus.UNPAID;
        }
        if (publishStatus == null) {
            publishStatus = OperationsAdPublishStatus.DRAFT;
        }
    }
}
