package com.alochitosongbad.operations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.alochitosongbad.common.InputValidator;
import com.alochitosongbad.security.CurrentUserService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperationsAssetService {

    private final OperationsAssetRepository assetRepository;
    private final OperationsStaffRepository staffRepository;
    private final OperationsActivityLogService activityLogService;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAssetService(
            OperationsAssetRepository assetRepository,
            OperationsStaffRepository staffRepository,
            OperationsActivityLogService activityLogService,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.assetRepository = assetRepository;
        this.staffRepository = staffRepository;
        this.activityLogService = activityLogService;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsAssetResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations assets");
        return assetRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsAssetResponseDto create(OperationsAssetRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations assets");

        OperationsAsset asset = new OperationsAsset();
        applyRequest(asset, request, null);
        OperationsAsset saved = assetRepository.save(asset);
        activityLogService.record("Assets", saved.getId(), OperationsActivityActionType.CREATED, saved.getAssetName(), "Asset created");
        return toResponse(saved);
    }

    public Optional<OperationsAssetResponseDto> update(Long id, OperationsAssetRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations assets");

        return assetRepository.findById(id)
                .map((asset) -> {
                    applyRequest(asset, request, id);
                    OperationsAsset saved = assetRepository.save(asset);
                    activityLogService.record("Assets", saved.getId(), OperationsActivityActionType.UPDATED, saved.getAssetName(), "Asset updated");
                    return toResponse(saved);
                });
    }

    public Optional<OperationsAssetResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations assets");

        return assetRepository.findById(id)
                .map((asset) -> {
                    asset.setAvailabilityStatus(OperationsAssetAvailabilityStatus.RETIRED);
                    asset.setConditionStatus(OperationsAssetConditionStatus.RETIRED);
                    OperationsAsset saved = assetRepository.save(asset);
                    activityLogService.record("Assets", saved.getId(), OperationsActivityActionType.RETIRED, saved.getAssetName(), "Asset retired");
                    return toResponse(saved);
                });
    }

    private void applyRequest(OperationsAsset asset, OperationsAssetRequestDto request, Long currentId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        Long assignedStaffId = request.getAssignedStaffId();
        if (assignedStaffId != null && !staffRepository.existsById(assignedStaffId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "assigned staff does not exist");
        }
        BigDecimal purchasePrice = request.getPurchasePrice();
        if (purchasePrice != null && purchasePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "purchasePrice must not be negative");
        }

        String serialNumber = inputValidator.optional(request.getSerialNumber(), 120);
        if (serialNumber != null) {
            boolean duplicate = currentId == null
                    ? assetRepository.existsBySerialNumber(serialNumber)
                    : assetRepository.existsBySerialNumberAndIdNot(serialNumber, currentId);
            if (duplicate) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "serialNumber must be unique");
            }
        }

        asset.setAssetName(inputValidator.required(request.getAssetName(), "assetName", 180));
        asset.setAssetType(request.getAssetType() == null ? OperationsAssetType.OTHER : request.getAssetType());
        asset.setSerialNumber(serialNumber);
        asset.setAssignedStaffId(assignedStaffId);
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setPurchasePrice(purchasePrice);
        asset.setConditionStatus(request.getConditionStatus() == null
                ? OperationsAssetConditionStatus.GOOD
                : request.getConditionStatus());
        asset.setAvailabilityStatus(request.getAvailabilityStatus() == null
                ? OperationsAssetAvailabilityStatus.AVAILABLE
                : request.getAvailabilityStatus());
        asset.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsAssetResponseDto toResponse(OperationsAsset asset) {
        OperationsAssetResponseDto response = new OperationsAssetResponseDto();
        response.setId(asset.getId());
        response.setAssetName(asset.getAssetName());
        response.setAssetType(asset.getAssetType());
        response.setSerialNumber(asset.getSerialNumber());
        response.setAssignedStaffId(asset.getAssignedStaffId());
        response.setPurchaseDate(asset.getPurchaseDate());
        response.setPurchasePrice(asset.getPurchasePrice());
        response.setConditionStatus(asset.getConditionStatus());
        response.setAvailabilityStatus(asset.getAvailabilityStatus());
        response.setNotes(asset.getNotes());
        response.setCreatedAt(asset.getCreatedAt());
        response.setUpdatedAt(asset.getUpdatedAt());
        return response;
    }
}
