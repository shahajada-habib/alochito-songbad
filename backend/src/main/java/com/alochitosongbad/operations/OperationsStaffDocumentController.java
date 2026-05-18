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
@RequestMapping("/api/admin/operations/staff-documents")
public class OperationsStaffDocumentController {

    private final OperationsStaffDocumentService documentService;

    public OperationsStaffDocumentController(OperationsStaffDocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<OperationsStaffDocumentResponseDto> getAll() {
        return documentService.getAll();
    }

    @PostMapping
    public OperationsStaffDocumentResponseDto create(@RequestBody OperationsStaffDocumentRequestDto request) {
        return documentService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsStaffDocumentResponseDto> update(@PathVariable Long id, @RequestBody OperationsStaffDocumentRequestDto request) {
        return documentService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsStaffDocumentResponseDto> archive(@PathVariable Long id) {
        return documentService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
