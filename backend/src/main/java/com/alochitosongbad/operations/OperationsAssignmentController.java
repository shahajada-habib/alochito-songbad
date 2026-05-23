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
@RequestMapping("/api/admin/operations/assignments")
public class OperationsAssignmentController {

    private final OperationsAssignmentService assignmentService;

    public OperationsAssignmentController(OperationsAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping
    public List<OperationsAssignmentResponseDto> getAll() {
        return assignmentService.getAll();
    }

    @PostMapping
    public OperationsAssignmentResponseDto create(@RequestBody OperationsAssignmentRequestDto request) {
        return assignmentService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsAssignmentResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsAssignmentRequestDto request) {
        return assignmentService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsAssignmentResponseDto> archive(@PathVariable Long id) {
        return assignmentService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-assigned")
    public ResponseEntity<OperationsAssignmentResponseDto> markAssigned(@PathVariable Long id) {
        return assignmentService.markAssigned(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-in-progress")
    public ResponseEntity<OperationsAssignmentResponseDto> markInProgress(@PathVariable Long id) {
        return assignmentService.markInProgress(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-completed")
    public ResponseEntity<OperationsAssignmentResponseDto> markCompleted(@PathVariable Long id) {
        return assignmentService.markCompleted(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
