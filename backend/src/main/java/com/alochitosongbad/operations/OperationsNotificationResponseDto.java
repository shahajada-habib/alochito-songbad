package com.alochitosongbad.operations;

import java.time.LocalDateTime;

public class OperationsNotificationResponseDto {
    private Long id;
    private String title;
    private String message;
    private OperationsNotificationType notificationType;
    private String sourceModule;
    private Long sourceEntityId;
    private OperationsNotificationReadStatus readStatus;
    private LocalDateTime dueAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public OperationsNotificationType getNotificationType() { return notificationType; }
    public void setNotificationType(OperationsNotificationType notificationType) { this.notificationType = notificationType; }
    public String getSourceModule() { return sourceModule; }
    public void setSourceModule(String sourceModule) { this.sourceModule = sourceModule; }
    public Long getSourceEntityId() { return sourceEntityId; }
    public void setSourceEntityId(Long sourceEntityId) { this.sourceEntityId = sourceEntityId; }
    public OperationsNotificationReadStatus getReadStatus() { return readStatus; }
    public void setReadStatus(OperationsNotificationReadStatus readStatus) { this.readStatus = readStatus; }
    public LocalDateTime getDueAt() { return dueAt; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
