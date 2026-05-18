package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsVendorService {

    private final OperationsVendorRepository vendorRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsVendorService(
            OperationsVendorRepository vendorRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.vendorRepository = vendorRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsVendorResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations vendors");
        return vendorRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsVendorResponseDto create(OperationsVendorRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations vendors");
        OperationsVendor vendor = new OperationsVendor();
        applyRequest(vendor, request);
        OperationsVendor saved = vendorRepository.save(vendor);
        record(saved, OperationsActivityActionType.CREATED, "Vendor created");
        return toResponse(saved);
    }

    public Optional<OperationsVendorResponseDto> update(Long id, OperationsVendorRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations vendors");
        return vendorRepository.findById(id).map((vendor) -> {
            applyRequest(vendor, request);
            OperationsVendor saved = vendorRepository.save(vendor);
            record(saved, OperationsActivityActionType.UPDATED, "Vendor updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsVendorResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations vendors");
        return vendorRepository.findById(id).map((vendor) -> {
            vendor.setStatus(OperationsVendorStatus.INACTIVE);
            OperationsVendor saved = vendorRepository.save(vendor);
            record(saved, OperationsActivityActionType.ARCHIVED, "Vendor marked inactive");
            return toResponse(saved);
        });
    }

    private void applyRequest(OperationsVendor vendor, OperationsVendorRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        vendor.setVendorName(inputValidator.required(request.getVendorName(), "vendorName", 150));
        vendor.setCompanyName(inputValidator.optional(request.getCompanyName(), 180));
        vendor.setContactPerson(inputValidator.optional(request.getContactPerson(), 150));
        vendor.setPhone(inputValidator.optional(request.getPhone(), 50));
        vendor.setEmail(inputValidator.optional(request.getEmail(), 200));
        vendor.setAddress(inputValidator.optional(request.getAddress(), 2000));
        vendor.setVendorType(request.getVendorType() == null ? OperationsVendorType.OTHER : request.getVendorType());
        vendor.setStatus(request.getStatus() == null ? OperationsVendorStatus.ACTIVE : request.getStatus());
        vendor.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsVendorResponseDto toResponse(OperationsVendor vendor) {
        OperationsVendorResponseDto response = new OperationsVendorResponseDto();
        response.setId(vendor.getId());
        response.setVendorName(vendor.getVendorName());
        response.setCompanyName(vendor.getCompanyName());
        response.setContactPerson(vendor.getContactPerson());
        response.setPhone(vendor.getPhone());
        response.setEmail(vendor.getEmail());
        response.setAddress(vendor.getAddress());
        response.setVendorType(vendor.getVendorType());
        response.setStatus(vendor.getStatus());
        response.setNotes(vendor.getNotes());
        response.setCreatedAt(vendor.getCreatedAt());
        response.setUpdatedAt(vendor.getUpdatedAt());
        return response;
    }

    private void record(OperationsVendor vendor, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Vendors", vendor.getId(), action, vendor.getVendorName(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
