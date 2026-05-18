package com.alochitosongbad.operations;

public class OperationsVendorRequestDto {
    private String vendorName;
    private String companyName;
    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private OperationsVendorType vendorType;
    private OperationsVendorStatus status;
    private String notes;

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public OperationsVendorType getVendorType() { return vendorType; }
    public void setVendorType(OperationsVendorType vendorType) { this.vendorType = vendorType; }
    public OperationsVendorStatus getStatus() { return status; }
    public void setStatus(OperationsVendorStatus status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
