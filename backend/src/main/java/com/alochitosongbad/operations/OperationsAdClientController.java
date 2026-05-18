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
@RequestMapping("/api/admin/operations/ad-clients")
public class OperationsAdClientController {

    private final OperationsAdClientService adClientService;

    public OperationsAdClientController(OperationsAdClientService adClientService) {
        this.adClientService = adClientService;
    }

    @GetMapping
    public List<OperationsAdClientResponseDto> getAll() {
        return adClientService.getAll();
    }

    @PostMapping
    public OperationsAdClientResponseDto create(@RequestBody OperationsAdClientRequestDto request) {
        return adClientService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsAdClientResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsAdClientRequestDto request) {
        return adClientService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsAdClientResponseDto> archive(@PathVariable Long id) {
        return adClientService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
