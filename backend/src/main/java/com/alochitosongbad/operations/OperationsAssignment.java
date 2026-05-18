package com.alochitosongbad.operations;

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
@Table(name = "operations_assignments")
public class OperationsAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "assigned_staff_id", nullable = false)
    private Long assignedStaffId;

    @Column(length = 120)
    private String category;

    @Column(length = 180)
    private String location;

    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationsAssignmentPriority priority = OperationsAssignmentPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OperationsAssignmentStatus status = OperationsAssignmentStatus.DRAFT;

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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getAssignedStaffId() {
        return assignedStaffId;
    }

    public void setAssignedStaffId(Long assignedStaffId) {
        this.assignedStaffId = assignedStaffId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public OperationsAssignmentPriority getPriority() {
        return priority;
    }

    public void setPriority(OperationsAssignmentPriority priority) {
        this.priority = priority;
    }

    public OperationsAssignmentStatus getStatus() {
        return status;
    }

    public void setStatus(OperationsAssignmentStatus status) {
        this.status = status;
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
        if (priority == null) {
            priority = OperationsAssignmentPriority.MEDIUM;
        }
        if (status == null) {
            status = OperationsAssignmentStatus.DRAFT;
        }
    }
}
