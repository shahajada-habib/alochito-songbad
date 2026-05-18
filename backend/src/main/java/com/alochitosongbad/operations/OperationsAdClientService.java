package com.alochitosongbad.operations;

import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsAdClientService {

    private final OperationsAdClientRepository adClientRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAdClientService(
            OperationsAdClientRepository adClientRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.adClientRepository = adClientRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsAdClientResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations ad clients");
        return adClientRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsAdClientResponseDto create(OperationsAdClientRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations ad clients");

        OperationsAdClient adClient = new OperationsAdClient();
        applyRequest(adClient, request);
        OperationsAdClient saved = adClientRepository.save(adClient);
        activityLogService.record("Ad Clients", saved.getId(), OperationsActivityActionType.CREATED, saved.getClientName(), "Advertisement client created");
        return toResponse(saved);
    }

    public Optional<OperationsAdClientResponseDto> update(Long id, OperationsAdClientRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations ad clients");

        return adClientRepository.findById(id)
                .map((adClient) -> {
                    applyRequest(adClient, request);
                    OperationsAdClient saved = adClientRepository.save(adClient);
                    activityLogService.record("Ad Clients", saved.getId(), OperationsActivityActionType.UPDATED, saved.getClientName(), "Advertisement client updated");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsAdClientResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations ad clients");

        return adClientRepository.findById(id)
                .map((adClient) -> {
                    adClient.setStatus(OperationsAdClientStatus.INACTIVE);
                    OperationsAdClient saved = adClientRepository.save(adClient);
                    activityLogService.record("Ad Clients", saved.getId(), OperationsActivityActionType.ARCHIVED, saved.getClientName(), "Advertisement client marked inactive");
                    return toResponse(saved);
                });
    }

    private void applyRequest(OperationsAdClient adClient, OperationsAdClientRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }

        adClient.setClientName(inputValidator.required(request.getClientName(), "clientName", 150));
        adClient.setCompanyName(inputValidator.optional(request.getCompanyName(), 180));
        adClient.setContactPerson(inputValidator.optional(request.getContactPerson(), 150));
        adClient.setPhone(inputValidator.optional(request.getPhone(), 50));
        adClient.setEmail(inputValidator.optional(request.getEmail(), 200));
        adClient.setAddress(inputValidator.optional(request.getAddress(), 2000));
        adClient.setIndustry(inputValidator.optional(request.getIndustry(), 120));
        adClient.setStatus(request.getStatus() == null ? OperationsAdClientStatus.ACTIVE : request.getStatus());
        adClient.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsAdClientResponseDto toResponse(OperationsAdClient adClient) {
        OperationsAdClientResponseDto response = new OperationsAdClientResponseDto();
        response.setId(adClient.getId());
        response.setClientName(adClient.getClientName());
        response.setCompanyName(adClient.getCompanyName());
        response.setContactPerson(adClient.getContactPerson());
        response.setPhone(adClient.getPhone());
        response.setEmail(adClient.getEmail());
        response.setAddress(adClient.getAddress());
        response.setIndustry(adClient.getIndustry());
        response.setStatus(adClient.getStatus());
        response.setNotes(adClient.getNotes());
        response.setCreatedAt(adClient.getCreatedAt());
        response.setUpdatedAt(adClient.getUpdatedAt());
        return response;
    }
}
