package com.alochitosongbad.operations;

import java.time.LocalDate;

public class OperationsReminderResponseDto {
    private String id;
    private String moduleName;
    private Long entityId;
    private String title;
    private String reminderType;
    private LocalDate dueDate;
    private OperationsReminderSeverity severity;
    private String description;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public OperationsReminderSeverity getSeverity() { return severity; }
    public void setSeverity(OperationsReminderSeverity severity) { this.severity = severity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
