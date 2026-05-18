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
@RequestMapping("/api/admin/operations/departments")
public class OperationsDepartmentController {

    private final OperationsDepartmentService departmentService;

    public OperationsDepartmentController(OperationsDepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public List<OperationsDepartmentResponseDto> getAll() {
        return departmentService.getAll();
    }

    @PostMapping
    public OperationsDepartmentResponseDto create(@RequestBody OperationsDepartmentRequestDto request) {
        return departmentService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsDepartmentResponseDto> update(@PathVariable Long id, @RequestBody OperationsDepartmentRequestDto request) {
        return departmentService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsDepartmentResponseDto> archive(@PathVariable Long id) {
        return departmentService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
