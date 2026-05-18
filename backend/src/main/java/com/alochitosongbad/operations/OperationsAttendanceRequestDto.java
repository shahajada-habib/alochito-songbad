package com.alochitosongbad.operations;

import java.time.LocalDate;
import java.time.LocalTime;

public class OperationsAttendanceRequestDto {
    private Long staffId;
    private LocalDate dutyDate;
    private OperationsAttendanceShift shift;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private OperationsAttendanceStatus status;
    private String dutyNote;

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
}
