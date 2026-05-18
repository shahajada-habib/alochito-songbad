package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/operations/activity-log")
public class OperationsActivityLogController {

    private final OperationsActivityLogService activityLogService;

    public OperationsActivityLogController(OperationsActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public List<OperationsActivityLogResponseDto> getRecent() {
        return activityLogService.getRecent();
    }
}
