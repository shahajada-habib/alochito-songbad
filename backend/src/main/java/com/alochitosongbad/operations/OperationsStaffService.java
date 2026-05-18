package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsStaffService {

    private final OperationsStaffRepository staffRepository;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsStaffService(
            OperationsStaffRepository staffRepository,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.staffRepository = staffRepository;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsStaffResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations staff");
        return staffRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsStaffResponseDto create(OperationsStaffRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations staff");

        OperationsStaff staff = new OperationsStaff();
        applyRequest(staff, request);
        return toResponse(staffRepository.save(staff));
    }

    public Optional<OperationsStaffResponseDto> update(Long id, OperationsStaffRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations staff");

        return staffRepository.findById(id)
                .map((staff) -> {
                    applyRequest(staff, request);
                    return toResponse(staffRepository.save(staff));
                });
    }

    private void applyRequest(OperationsStaff staff, OperationsStaffRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }

        staff.setName(inputValidator.required(request.getName(), "name", 150));
        staff.setDesignation(inputValidator.required(request.getDesignation(), "designation", 120));
        staff.setDepartment(inputValidator.optional(request.getDepartment(), 120));
        staff.setPhone(inputValidator.optional(request.getPhone(), 50));
        staff.setEmail(inputValidator.optional(request.getEmail(), 200));
        staff.setJoiningDate(request.getJoiningDate());
        staff.setStatus(request.getStatus() == null ? OperationsStaffStatus.ACTIVE : request.getStatus());
    }

    private OperationsStaffResponseDto toResponse(OperationsStaff staff) {
        OperationsStaffResponseDto response = new OperationsStaffResponseDto();
        response.setId(staff.getId());
        response.setName(staff.getName());
        response.setDesignation(staff.getDesignation());
        response.setDepartment(staff.getDepartment());
        response.setPhone(staff.getPhone());
        response.setEmail(staff.getEmail());
        response.setJoiningDate(staff.getJoiningDate());
        response.setStatus(staff.getStatus());
        response.setCreatedAt(staff.getCreatedAt());
        response.setUpdatedAt(staff.getUpdatedAt());
        return response;
    }
}
