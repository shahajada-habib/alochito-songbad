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
@Table(name = "operations_notifications")
public class OperationsNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 20)
    private OperationsNotificationType notificationType = OperationsNotificationType.INFO;

    @Column(name = "source_module", length = 80)
    private String sourceModule;

    @Column(name = "source_entity_id")
    private Long sourceEntityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "read_status", nullable = false, length = 20)
    private OperationsNotificationReadStatus readStatus = OperationsNotificationReadStatus.UNREAD;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
        if (notificationType == null) {
            notificationType = OperationsNotificationType.INFO;
        }
        if (readStatus == null) {
            readStatus = OperationsNotificationReadStatus.UNREAD;
        }
    }
}
