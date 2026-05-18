package com.alochitosongbad.operations;

public class OperationsStaffDocumentRequestDto {
    private Long staffId;
    private String title;
    private OperationsStaffDocumentType documentType;
    private String fileUrl;
    private String note;
    private OperationsStaffDocumentStatus status;

    public Long getStaffId() { return staffId; }
    public void setStaffId(Long staffId) { this.staffId = staffId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public OperationsStaffDocumentType getDocumentType() { return documentType; }
    public void setDocumentType(OperationsStaffDocumentType documentType) { this.documentType = documentType; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public OperationsStaffDocumentStatus getStatus() { return status; }
    public void setStatus(OperationsStaffDocumentStatus status) { this.status = status; }
}
