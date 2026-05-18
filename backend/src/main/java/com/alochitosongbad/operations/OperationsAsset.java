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
@Table(name = "operations_assets")
public class OperationsAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_name", nullable = false, length = 180)
    private String assetName;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 40)
    private OperationsAssetType assetType = OperationsAssetType.OTHER;

    @Column(name = "serial_number", length = 120)
    private String serialNumber;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 14, scale = 2)
    private BigDecimal purchasePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", nullable = false, length = 30)
    private OperationsAssetConditionStatus conditionStatus = OperationsAssetConditionStatus.GOOD;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false, length = 30)
    private OperationsAssetAvailabilityStatus availabilityStatus = OperationsAssetAvailabilityStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public OperationsAssetType getAssetType() { return assetType; }
    public void setAssetType(OperationsAssetType assetType) { this.assetType = assetType; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public Long getAssignedStaffId() { return assignedStaffId; }
    public void setAssignedStaffId(Long assignedStaffId) { this.assignedStaffId = assignedStaffId; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public OperationsAssetConditionStatus getConditionStatus() { return conditionStatus; }
    public void setConditionStatus(OperationsAssetConditionStatus conditionStatus) { this.conditionStatus = conditionStatus; }
    public OperationsAssetAvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(OperationsAssetAvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

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
        if (assetType == null) {
            assetType = OperationsAssetType.OTHER;
        }
        if (conditionStatus == null) {
            conditionStatus = OperationsAssetConditionStatus.GOOD;
        }
        if (availabilityStatus == null) {
            availabilityStatus = OperationsAssetAvailabilityStatus.AVAILABLE;
        }
    }
}
