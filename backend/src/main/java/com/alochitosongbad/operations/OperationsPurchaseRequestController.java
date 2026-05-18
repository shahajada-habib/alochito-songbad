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
@RequestMapping("/api/admin/operations/purchase-requests")
public class OperationsPurchaseRequestController {

    private final OperationsPurchaseRequestService purchaseRequestService;

    public OperationsPurchaseRequestController(OperationsPurchaseRequestService purchaseRequestService) {
        this.purchaseRequestService = purchaseRequestService;
    }

    @GetMapping
    public List<OperationsPurchaseRequestResponseDto> getAll() {
        return purchaseRequestService.getAll();
    }

    @PostMapping
    public OperationsPurchaseRequestResponseDto create(@RequestBody OperationsPurchaseRequestRequestDto request) {
        return purchaseRequestService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsPurchaseRequestResponseDto> update(@PathVariable Long id, @RequestBody OperationsPurchaseRequestRequestDto request) {
        return purchaseRequestService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsPurchaseRequestResponseDto> archive(@PathVariable Long id) {
        return purchaseRequestService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
