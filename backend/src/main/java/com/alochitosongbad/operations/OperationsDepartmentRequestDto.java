package com.alochitosongbad.operations;

public class OperationsDepartmentRequestDto {
    private String name;
    private String code;
    private String description;
    private OperationsDepartmentStatus status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OperationsDepartmentStatus getStatus() { return status; }
    public void setStatus(OperationsDepartmentStatus status) { this.status = status; }
}
