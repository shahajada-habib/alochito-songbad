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
public class OperationsAdBookingService {

    private final OperationsAdBookingRepository adBookingRepository;
    private final OperationsAdClientRepository adClientRepository;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsAdBookingService(
            OperationsAdBookingRepository adBookingRepository,
            OperationsAdClientRepository adClientRepository,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.adBookingRepository = adBookingRepository;
        this.adClientRepository = adClientRepository;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsAdBookingResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations ad bookings");
        return adBookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsAdBookingResponseDto create(OperationsAdBookingRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations ad bookings");

        OperationsAdBooking adBooking = new OperationsAdBooking();
        applyRequest(adBooking, request);
        return toResponse(adBookingRepository.save(adBooking));
    }

    public Optional<OperationsAdBookingResponseDto> update(Long id, OperationsAdBookingRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations ad bookings");

        return adBookingRepository.findById(id)
                .map((adBooking) -> {
                    applyRequest(adBooking, request);
                    return toResponse(adBookingRepository.save(adBooking));
                });
    }

    public Optional<OperationsAdBookingResponseDto> archive(Long id) {
        currentUserService.requireEditorOrAdmin("archive operations ad bookings");

        return adBookingRepository.findById(id)
                .map((adBooking) -> {
                    adBooking.setPublishStatus(OperationsAdPublishStatus.CANCELLED);
                    return toResponse(adBookingRepository.save(adBooking));
                });
    }

    private void applyRequest(OperationsAdBooking adBooking, OperationsAdBookingRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }

        Long adClientId = request.getAdClientId();
        if (adClientId == null || !adClientRepository.existsById(adClientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ad client does not exist");
        }
        if (request.getStartDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "startDate is required");
        }
        if (request.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate is required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "endDate must not be before startDate");
        }

        BigDecimal price = request.getPrice() == null ? BigDecimal.ZERO : request.getPrice();
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "price must not be negative");
        }

        adBooking.setAdClientId(adClientId);
        adBooking.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        adBooking.setPlacement(request.getPlacement() == null ? OperationsAdPlacement.HOME_TOP : request.getPlacement());
        adBooking.setStartDate(request.getStartDate());
        adBooking.setEndDate(request.getEndDate());
        adBooking.setPrice(price);
        adBooking.setPaymentStatus(request.getPaymentStatus() == null
                ? OperationsAdPaymentStatus.UNPAID
                : request.getPaymentStatus());
        adBooking.setPublishStatus(request.getPublishStatus() == null
                ? OperationsAdPublishStatus.DRAFT
                : request.getPublishStatus());
        adBooking.setSalesOwner(inputValidator.optional(request.getSalesOwner(), 150));
        adBooking.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsAdBookingResponseDto toResponse(OperationsAdBooking adBooking) {
        OperationsAdBookingResponseDto response = new OperationsAdBookingResponseDto();
        response.setId(adBooking.getId());
        response.setAdClientId(adBooking.getAdClientId());
        response.setTitle(adBooking.getTitle());
        response.setPlacement(adBooking.getPlacement());
        response.setStartDate(adBooking.getStartDate());
        response.setEndDate(adBooking.getEndDate());
        response.setPrice(adBooking.getPrice());
        response.setPaymentStatus(adBooking.getPaymentStatus());
        response.setPublishStatus(adBooking.getPublishStatus());
        response.setSalesOwner(adBooking.getSalesOwner());
        response.setNotes(adBooking.getNotes());
        response.setCreatedAt(adBooking.getCreatedAt());
        response.setUpdatedAt(adBooking.getUpdatedAt());
        return response;
    }
}
