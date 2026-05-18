package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsDepartmentService {

    private final OperationsDepartmentRepository departmentRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsDepartmentService(
            OperationsDepartmentRepository departmentRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.departmentRepository = departmentRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsDepartmentResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations departments");
        return departmentRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsDepartmentResponseDto create(OperationsDepartmentRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations departments");
        OperationsDepartment department = new OperationsDepartment();
        applyRequest(department, request);
        OperationsDepartment saved = departmentRepository.save(department);
        record(saved, OperationsActivityActionType.CREATED, "Department created");
        return toResponse(saved);
    }

    public Optional<OperationsDepartmentResponseDto> update(Long id, OperationsDepartmentRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations departments");
        return departmentRepository.findById(id).map((department) -> {
            applyRequest(department, request);
            OperationsDepartment saved = departmentRepository.save(department);
            record(saved, OperationsActivityActionType.UPDATED, "Department updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsDepartmentResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations departments");
        return departmentRepository.findById(id).map((department) -> {
            department.setStatus(OperationsDepartmentStatus.INACTIVE);
            OperationsDepartment saved = departmentRepository.save(department);
            record(saved, OperationsActivityActionType.ARCHIVED, "Department marked inactive");
            return toResponse(saved);
        });
    }

    private void applyRequest(OperationsDepartment department, OperationsDepartmentRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        String name = inputValidator.required(request.getName(), "name", 150);
        String code = inputValidator.required(request.getCode(), "code", 50).toUpperCase();
        Long id = department.getId() == null ? -1L : department.getId();
        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "department name already exists");
        }
        if (departmentRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "department code already exists");
        }
        department.setName(name);
        department.setCode(code);
        department.setDescription(inputValidator.optional(request.getDescription(), 2000));
        department.setStatus(request.getStatus() == null ? OperationsDepartmentStatus.ACTIVE : request.getStatus());
    }

    private OperationsDepartmentResponseDto toResponse(OperationsDepartment department) {
        OperationsDepartmentResponseDto response = new OperationsDepartmentResponseDto();
        response.setId(department.getId());
        response.setName(department.getName());
        response.setCode(department.getCode());
        response.setDescription(department.getDescription());
        response.setStatus(department.getStatus());
        response.setCreatedAt(department.getCreatedAt());
        response.setUpdatedAt(department.getUpdatedAt());
        return response;
    }

    private void record(OperationsDepartment department, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Departments", department.getId(), action, department.getName(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
