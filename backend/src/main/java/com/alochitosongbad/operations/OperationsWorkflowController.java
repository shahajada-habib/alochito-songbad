package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/operations")
public class OperationsWorkflowController {

    private final OperationsWorkflowService workflowService;

    public OperationsWorkflowController(OperationsWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @GetMapping("/approval-queue")
    public List<OperationsApprovalQueueItemDto> approvalQueue() {
        return workflowService.approvalQueue();
    }

    @GetMapping("/reminders")
    public List<OperationsReminderResponseDto> reminders() {
        return workflowService.reminders();
    }
}
