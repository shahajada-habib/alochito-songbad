package com.alochitosongbad.operations;

import java.time.LocalDate;

public class OperationsStaffRequestDto {
    private String name;
    private String designation;
    private String department;
    private String phone;
    private String email;
    private LocalDate joiningDate;
    private OperationsStaffStatus status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDate getJoiningDate() {
        return joiningDate;
    }

    public void setJoiningDate(LocalDate joiningDate) {
        this.joiningDate = joiningDate;
    }

    public OperationsStaffStatus getStatus() {
        return status;
    }

    public void setStatus(OperationsStaffStatus status) {
        this.status = status;
    }
}
