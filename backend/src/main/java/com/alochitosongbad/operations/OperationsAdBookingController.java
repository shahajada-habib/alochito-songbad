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
@RequestMapping("/api/admin/operations/ad-bookings")
public class OperationsAdBookingController {

    private final OperationsAdBookingService adBookingService;

    public OperationsAdBookingController(OperationsAdBookingService adBookingService) {
        this.adBookingService = adBookingService;
    }

    @GetMapping
    public List<OperationsAdBookingResponseDto> getAll() {
        return adBookingService.getAll();
    }

    @PostMapping
    public OperationsAdBookingResponseDto create(@RequestBody OperationsAdBookingRequestDto request) {
        return adBookingService.create(request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<OperationsAdBookingResponseDto> update(
            @PathVariable Long id,
            @RequestBody OperationsAdBookingRequestDto request) {
        return adBookingService.update(id, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OperationsAdBookingResponseDto> archive(@PathVariable Long id) {
        return adBookingService.archive(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-running")
    public ResponseEntity<OperationsAdBookingResponseDto> markRunning(@PathVariable Long id) {
        return adBookingService.markRunning(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-completed")
    public ResponseEntity<OperationsAdBookingResponseDto> markCompleted(@PathVariable Long id) {
        return adBookingService.markCompleted(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<OperationsAdBookingResponseDto> markPaid(@PathVariable Long id) {
        return adBookingService.markPaid(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
