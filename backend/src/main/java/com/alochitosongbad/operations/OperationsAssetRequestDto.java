package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OperationsAssetRequestDto {
    private String assetName;
    private OperationsAssetType assetType;
    private String serialNumber;
    private Long assignedStaffId;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private OperationsAssetConditionStatus conditionStatus;
    private OperationsAssetAvailabilityStatus availabilityStatus;
    private String notes;

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
}
