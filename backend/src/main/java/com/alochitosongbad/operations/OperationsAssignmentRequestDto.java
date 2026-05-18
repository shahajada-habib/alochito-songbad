package com.alochitosongbad.operations;

import java.time.LocalDateTime;

public class OperationsAssignmentRequestDto {
    private String title;
    private String description;
    private Long assignedStaffId;
    private String category;
    private String location;
    private LocalDateTime deadline;
    private OperationsAssignmentPriority priority;
    private OperationsAssignmentStatus status;
    private String notes;

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
}
