package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsStaffDocumentService {

    private final OperationsStaffDocumentRepository documentRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsStaffDocumentService(
            OperationsStaffDocumentRepository documentRepository,
            OperationsStaffRepository staffRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.documentRepository = documentRepository;
        this.staffRepository = staffRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsStaffDocumentResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations staff documents");
        return documentRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toResponse).toList();
    }

    public OperationsStaffDocumentResponseDto create(OperationsStaffDocumentRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations staff documents");
        OperationsStaffDocument document = new OperationsStaffDocument();
        applyRequest(document, request);
        OperationsStaffDocument saved = documentRepository.save(document);
        record(saved, OperationsActivityActionType.CREATED, "Staff document created");
        return toResponse(saved);
    }

    public Optional<OperationsStaffDocumentResponseDto> update(Long id, OperationsStaffDocumentRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations staff documents");
        return documentRepository.findById(id).map((document) -> {
            applyRequest(document, request);
            OperationsStaffDocument saved = documentRepository.save(document);
            record(saved, OperationsActivityActionType.UPDATED, "Staff document updated");
            return toResponse(saved);
        });
    }

    public Optional<OperationsStaffDocumentResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations staff documents");
        return documentRepository.findById(id).map((document) -> {
            document.setStatus(OperationsStaffDocumentStatus.ARCHIVED);
            OperationsStaffDocument saved = documentRepository.save(document);
            record(saved, OperationsActivityActionType.ARCHIVED, "Staff document archived");
            return toResponse(saved);
        });
    }

    private void applyRequest(OperationsStaffDocument document, OperationsStaffDocumentRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (request.getStaffId() == null || !staffRepository.existsById(request.getStaffId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "staff must exist");
        }
        document.setStaffId(request.getStaffId());
        document.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        document.setDocumentType(request.getDocumentType() == null ? OperationsStaffDocumentType.NOTE : request.getDocumentType());
        document.setFileUrl(inputValidator.optional(request.getFileUrl(), 500));
        document.setNote(inputValidator.optional(request.getNote(), 2000));
        document.setStatus(request.getStatus() == null ? OperationsStaffDocumentStatus.ACTIVE : request.getStatus());
    }

    private OperationsStaffDocumentResponseDto toResponse(OperationsStaffDocument document) {
        OperationsStaffDocumentResponseDto response = new OperationsStaffDocumentResponseDto();
        response.setId(document.getId());
        response.setStaffId(document.getStaffId());
        response.setTitle(document.getTitle());
        response.setDocumentType(document.getDocumentType());
        response.setFileUrl(document.getFileUrl());
        response.setNote(document.getNote());
        response.setStatus(document.getStatus());
        response.setCreatedAt(document.getCreatedAt());
        response.setUpdatedAt(document.getUpdatedAt());
        return response;
    }

    private void record(OperationsStaffDocument document, OperationsActivityActionType action, String description) {
        try {
            activityLogService.record("Staff Documents", document.getId(), action, document.getTitle(), description);
        } catch (RuntimeException ignored) {
            // Activity logging must not block the operational workflow.
        }
    }
}
