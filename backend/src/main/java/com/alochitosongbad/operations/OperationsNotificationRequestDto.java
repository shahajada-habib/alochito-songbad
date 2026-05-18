package com.alochitosongbad.operations;

import java.time.LocalDateTime;

public class OperationsNotificationRequestDto {
    private String title;
    private String message;
    private OperationsNotificationType notificationType;
    private String sourceModule;
    private Long sourceEntityId;
    private LocalDateTime dueAt;

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
    public LocalDateTime getDueAt() { return dueAt; }
    public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
}
