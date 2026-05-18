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
@RequestMapping("/api/admin/operations/vendors")
public class OperationsVendorController {

    private final OperationsVendorService vendorService;

    public OperationsVendorController(OperationsVendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public List<OperationsVendorResponseDto> getAll() {
        return vendorService.getAll();
    }

    @PostMapping
    public OperationsVendorResponseDto create(@RequestBody OperationsVendorRequestDto request) {
        return vendorService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsVendorResponseDto> update(@PathVariable Long id, @RequestBody OperationsVendorRequestDto request) {
        return vendorService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsVendorResponseDto> archive(@PathVariable Long id) {
        return vendorService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
