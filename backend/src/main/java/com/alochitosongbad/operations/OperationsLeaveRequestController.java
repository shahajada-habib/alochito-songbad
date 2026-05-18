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
@RequestMapping("/api/admin/operations/leave-requests")
public class OperationsLeaveRequestController {

    private final OperationsLeaveRequestService leaveRequestService;

    public OperationsLeaveRequestController(OperationsLeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    @GetMapping
    public List<OperationsLeaveRequestResponseDto> getAll() {
        return leaveRequestService.getAll();
    }

    @PostMapping
    public OperationsLeaveRequestResponseDto create(@RequestBody OperationsLeaveRequestRequestDto request) {
        return leaveRequestService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsLeaveRequestResponseDto> update(@PathVariable Long id, @RequestBody OperationsLeaveRequestRequestDto request) {
        return leaveRequestService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsLeaveRequestResponseDto> archive(@PathVariable Long id) {
        return leaveRequestService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
