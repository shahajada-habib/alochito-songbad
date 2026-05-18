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
@RequestMapping("/api/admin/operations/expenses")
public class OperationsExpenseController {

    private final OperationsExpenseService expenseService;

    public OperationsExpenseController(OperationsExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<OperationsExpenseResponseDto> getAll() {
        return expenseService.getAll();
    }

    @PostMapping
    public OperationsExpenseResponseDto create(@RequestBody OperationsExpenseRequestDto request) {
        return expenseService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsExpenseResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsExpenseRequestDto request) {
        return expenseService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsExpenseResponseDto> archive(@PathVariable Long id) {
        return expenseService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
