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
@RequestMapping("/api/admin/operations/invoices")
public class OperationsInvoiceController {

    private final OperationsInvoiceService invoiceService;

    public OperationsInvoiceController(OperationsInvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<OperationsInvoiceResponseDto> getAll() {
        return invoiceService.getAll();
    }

    @PostMapping
    public OperationsInvoiceResponseDto create(@RequestBody OperationsInvoiceRequestDto request) {
        return invoiceService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsInvoiceResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsInvoiceRequestDto request) {
        return invoiceService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
