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
@RequestMapping("/api/admin/operations/assets")
public class OperationsAssetController {

    private final OperationsAssetService assetService;

    public OperationsAssetController(OperationsAssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public List<OperationsAssetResponseDto> getAll() {
        return assetService.getAll();
    }

    @PostMapping
    public OperationsAssetResponseDto create(@RequestBody OperationsAssetRequestDto request) {
        return assetService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsAssetResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsAssetRequestDto request) {
        return assetService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsAssetResponseDto> archive(@PathVariable Long id) {
        return assetService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-available")
    public ResponseEntity<OperationsAssetResponseDto> markAvailable(@PathVariable Long id) {
        return assetService.markAvailable(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-assigned")
    public ResponseEntity<OperationsAssetResponseDto> markAssigned(@PathVariable Long id) {
        return assetService.markAssigned(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-maintenance")
    public ResponseEntity<OperationsAssetResponseDto> markMaintenance(@PathVariable Long id) {
        return assetService.markMaintenance(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
