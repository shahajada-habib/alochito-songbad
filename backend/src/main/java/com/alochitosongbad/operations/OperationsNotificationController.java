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
@RequestMapping("/api/admin/operations/notifications")
public class OperationsNotificationController {

    private final OperationsNotificationService notificationService;

    public OperationsNotificationController(OperationsNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<OperationsNotificationResponseDto> getAll() {
        return notificationService.getAll();
    }

    @PostMapping
    public OperationsNotificationResponseDto create(@RequestBody OperationsNotificationRequestDto request) {
        return notificationService.create(request);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<OperationsNotificationResponseDto> markRead(@PathVariable Long id) {
        return notificationService.markRead(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/mark-all-read")
    public List<OperationsNotificationResponseDto> markAllRead() {
        return notificationService.markAllRead();
    }
}
