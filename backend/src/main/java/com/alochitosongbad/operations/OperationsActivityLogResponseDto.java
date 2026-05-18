package com.alochitosongbad.operations;

import java.time.LocalDateTime;

public class OperationsActivityLogResponseDto {
    private Long id;
    private String moduleName;
    private Long entityId;
    private OperationsActivityActionType actionType;
    private String title;
    private String description;
    private String actorName;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public OperationsActivityActionType getActionType() { return actionType; }
    public void setActionType(OperationsActivityActionType actionType) { this.actionType = actionType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
