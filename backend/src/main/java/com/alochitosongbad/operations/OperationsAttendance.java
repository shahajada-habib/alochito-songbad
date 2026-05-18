package com.alochitosongbad.operations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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
@Table(name = "operations_attendance")
public class OperationsAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", nullable = false)
    private Long staffId;

    @Column(name = "duty_date", nullable = false)
    private LocalDate dutyDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationsAttendanceShift shift = OperationsAttendanceShift.MORNING;

    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OperationsAttendanceStatus status = OperationsAttendanceStatus.SCHEDULED;

    @Column(name = "duty_note", columnDefinition = "TEXT")
    private String dutyNote;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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
        if (shift == null) {
            shift = OperationsAttendanceShift.MORNING;
        }
        if (status == null) {
            status = OperationsAttendanceStatus.SCHEDULED;
        }
    }
}
