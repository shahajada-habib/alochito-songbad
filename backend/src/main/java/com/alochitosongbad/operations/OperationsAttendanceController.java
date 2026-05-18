package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/operations/attendance")
public class OperationsAttendanceController {

    private final OperationsAttendanceService attendanceService;

    public OperationsAttendanceController(OperationsAttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public List<OperationsAttendanceResponseDto> getAll() {
        return attendanceService.getAll();
    }

    @PostMapping
    public OperationsAttendanceResponseDto create(@RequestBody OperationsAttendanceRequestDto request) {
        return attendanceService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsAttendanceResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsAttendanceRequestDto request) {
        return attendanceService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsAttendanceResponseDto> archive(@PathVariable Long id) {
        return attendanceService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
