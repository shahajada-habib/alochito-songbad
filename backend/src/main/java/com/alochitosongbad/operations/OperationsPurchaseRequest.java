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
@Table(name = "operations_purchase_requests")
public class OperationsPurchaseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(name = "requested_by_staff_id")
    private Long requestedByStaffId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "item_description", nullable = false, columnDefinition = "TEXT")
    private String itemDescription;

    @Column(name = "estimated_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal estimatedAmount = BigDecimal.ZERO;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @Column(name = "needed_by_date")
    private LocalDate neededByDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationsPurchaseRequestPriority priority = OperationsPurchaseRequestPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationsPurchaseRequestStatus status = OperationsPurchaseRequestStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
        if (estimatedAmount == null) {
            estimatedAmount = BigDecimal.ZERO;
        }
        if (priority == null) {
            priority = OperationsPurchaseRequestPriority.MEDIUM;
        }
        if (status == null) {
            status = OperationsPurchaseRequestStatus.DRAFT;
        }
    }
}
