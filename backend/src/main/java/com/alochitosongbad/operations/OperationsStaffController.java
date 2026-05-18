package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/operations/staff")
public class OperationsStaffController {

    private final OperationsStaffService staffService;

    public OperationsStaffController(OperationsStaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<OperationsStaffResponseDto> getAll() {
        return staffService.getAll();
    }

    @PostMapping
    public OperationsStaffResponseDto create(@RequestBody OperationsStaffRequestDto request) {
        return staffService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsStaffResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsStaffRequestDto request) {
        return staffService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
