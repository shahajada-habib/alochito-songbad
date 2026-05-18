package com.alochitosongbad.operations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class OperationsAttendanceResponseDto {
    private Long id;
    private Long staffId;
    private LocalDate dutyDate;
    private OperationsAttendanceShift shift;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private OperationsAttendanceStatus status;
    private String dutyNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStaffId() { return staffId; }
    public void setStaffId(Long staffId) { this.staffId = staffId; }
    public LocalDate getDutyDate() { return dutyDate; }
    public void setDutyDate(LocalDate dutyDate) { this.dutyDate = dutyDate; }
    public OperationsAttendanceShift getShift() { return shift; }
    public void setShift(OperationsAttendanceShift shift) { this.shift = shift; }
    public LocalTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalTime checkInTime) { this.checkInTime = checkInTime; }
    public LocalTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalTime checkOutTime) { this.checkOutTime = checkOutTime; }
    public OperationsAttendanceStatus getStatus() { return status; }
    public void setStatus(OperationsAttendanceStatus status) { this.status = status; }
    public String getDutyNote() { return dutyNote; }
    public void setDutyNote(String dutyNote) { this.dutyNote = dutyNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
