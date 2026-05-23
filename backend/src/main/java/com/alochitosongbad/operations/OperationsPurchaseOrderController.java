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
@RequestMapping("/api/admin/operations/purchase-orders")
public class OperationsPurchaseOrderController {

    private final OperationsPurchaseOrderService purchaseOrderService;

    public OperationsPurchaseOrderController(OperationsPurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public List<OperationsPurchaseOrderResponseDto> getAll() {
        return purchaseOrderService.getAll();
    }

    @PostMapping
    public OperationsPurchaseOrderResponseDto create(@RequestBody OperationsPurchaseOrderRequestDto request) {
        return purchaseOrderService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsPurchaseOrderResponseDto> update(@PathVariable Long id, @RequestBody OperationsPurchaseOrderRequestDto request) {
        return purchaseOrderService.update(id, request).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsPurchaseOrderResponseDto> archive(@PathVariable Long id) {
        return purchaseOrderService.archive(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-placed")
    public ResponseEntity<OperationsPurchaseOrderResponseDto> markPlaced(@PathVariable Long id) {
        return purchaseOrderService.markPlaced(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-received")
    public ResponseEntity<OperationsPurchaseOrderResponseDto> markReceived(@PathVariable Long id) {
        return purchaseOrderService.markReceived(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<OperationsPurchaseOrderResponseDto> markPaid(@PathVariable Long id) {
        return purchaseOrderService.markPaid(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
