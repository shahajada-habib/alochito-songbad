package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsAttendanceService {

    private final OperationsAttendanceRepository attendanceRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAttendanceService(
            OperationsAttendanceRepository attendanceRepository,
            OperationsStaffRepository staffRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.attendanceRepository = attendanceRepository;
        this.staffRepository = staffRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsAttendanceResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations attendance");
        return attendanceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsAttendanceResponseDto create(OperationsAttendanceRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations attendance");

        OperationsAttendance attendance = new OperationsAttendance();
        applyRequest(attendance, request);
        OperationsAttendance saved = attendanceRepository.save(attendance);
        activityLogService.record("Attendance", saved.getId(), OperationsActivityActionType.CREATED, "Duty " + saved.getDutyDate(), "Attendance record created");
        return toResponse(saved);
    }

    public Optional<OperationsAttendanceResponseDto> update(Long id, OperationsAttendanceRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations attendance");

        return attendanceRepository.findById(id)
                .map((attendance) -> {
                    applyRequest(attendance, request);
                    OperationsAttendance saved = attendanceRepository.save(attendance);
                    activityLogService.record("Attendance", saved.getId(), OperationsActivityActionType.UPDATED, "Duty " + saved.getDutyDate(), "Attendance record updated");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsAttendanceResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations attendance");

        return attendanceRepository.findById(id)
                .map((attendance) -> {
                    attendance.setStatus(OperationsAttendanceStatus.CANCELLED);
                    OperationsAttendance saved = attendanceRepository.save(attendance);
                    activityLogService.record("Attendance", saved.getId(), OperationsActivityActionType.CANCELLED, "Duty " + saved.getDutyDate(), "Attendance record cancelled");
                    return toResponse(saved);
                });
    }

    private void applyRequest(OperationsAttendance attendance, OperationsAttendanceRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        Long staffId = request.getStaffId();
        if (staffId == null || !staffRepository.existsById(staffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "staff does not exist");
        }
        if (request.getDutyDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "dutyDate is required");
        }
        if (request.getCheckInTime() != null
                && request.getCheckOutTime() != null
                && request.getCheckOutTime().isBefore(request.getCheckInTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "checkOutTime must not be before checkInTime");
        }

        attendance.setStaffId(staffId);
        attendance.setDutyDate(request.getDutyDate());
        attendance.setShift(request.getShift() == null ? OperationsAttendanceShift.MORNING : request.getShift());
        attendance.setCheckInTime(request.getCheckInTime());
        attendance.setCheckOutTime(request.getCheckOutTime());
        attendance.setStatus(request.getStatus() == null ? OperationsAttendanceStatus.SCHEDULED : request.getStatus());
        attendance.setDutyNote(inputValidator.optional(request.getDutyNote(), 2000));
    }

    private OperationsAttendanceResponseDto toResponse(OperationsAttendance attendance) {
        OperationsAttendanceResponseDto response = new OperationsAttendanceResponseDto();
        response.setId(attendance.getId());
        response.setStaffId(attendance.getStaffId());
        response.setDutyDate(attendance.getDutyDate());
        response.setShift(attendance.getShift());
        response.setCheckInTime(attendance.getCheckInTime());
        response.setCheckOutTime(attendance.getCheckOutTime());
        response.setStatus(attendance.getStatus());
        response.setDutyNote(attendance.getDutyNote());
        response.setCreatedAt(attendance.getCreatedAt());
        response.setUpdatedAt(attendance.getUpdatedAt());
        return response;
    }
}
