package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OperationsPurchaseRequestRequestDto {
    private String title;
    private Long requestedByStaffId;
    private Long departmentId;
    private String itemDescription;
    private BigDecimal estimatedAmount;
    private LocalDate requestDate;
    private LocalDate neededByDate;
    private OperationsPurchaseRequestPriority priority;
    private OperationsPurchaseRequestStatus status;
    private String notes;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getRequestedByStaffId() { return requestedByStaffId; }
    public void setRequestedByStaffId(Long requestedByStaffId) { this.requestedByStaffId = requestedByStaffId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    public BigDecimal getEstimatedAmount() { return estimatedAmount; }
    public void setEstimatedAmount(BigDecimal estimatedAmount) { this.estimatedAmount = estimatedAmount; }
    public LocalDate getRequestDate() { return requestDate; }
    public void setRequestDate(LocalDate requestDate) { this.requestDate = requestDate; }
    public LocalDate getNeededByDate() { return neededByDate; }
    public void setNeededByDate(LocalDate neededByDate) { this.neededByDate = neededByDate; }
    public OperationsPurchaseRequestPriority getPriority() { return priority; }
    public void setPriority(OperationsPurchaseRequestPriority priority) { this.priority = priority; }
    public OperationsPurchaseRequestStatus getStatus() { return status; }
    public void setStatus(OperationsPurchaseRequestStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
