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
public class OperationsExpenseService {

    private final OperationsExpenseRepository expenseRepository;
    private final CurrentUserService currentUserService;
    private final InputValidator inputValidator;

    public OperationsExpenseService(
            OperationsExpenseRepository expenseRepository,
            CurrentUserService currentUserService,
            InputValidator inputValidator) {
        this.expenseRepository = expenseRepository;
        this.currentUserService = currentUserService;
        this.inputValidator = inputValidator;
    }

    public List<OperationsExpenseResponseDto> getAll() {
        currentUserService.requireEditorOrAdmin("view operations expenses");
        return expenseRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public OperationsExpenseResponseDto create(OperationsExpenseRequestDto request) {
        currentUserService.requireEditorOrAdmin("create operations expenses");

        OperationsExpense expense = new OperationsExpense();
        applyRequest(expense, request);
        return toResponse(expenseRepository.save(expense));
    }

    public Optional<OperationsExpenseResponseDto> update(Long id, OperationsExpenseRequestDto request) {
        currentUserService.requireEditorOrAdmin("update operations expenses");

        return expenseRepository.findById(id)
                .map((expense) -> {
                    applyRequest(expense, request);
                    return toResponse(expenseRepository.save(expense));
                });
    }

    private void applyRequest(OperationsExpense expense, OperationsExpenseRequestDto request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request body is required");
        }
        if (request.getExpenseDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "expenseDate is required");
        }

        BigDecimal amount = request.getAmount() == null ? BigDecimal.ZERO : request.getAmount();
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must not be negative");
        }

        expense.setTitle(inputValidator.required(request.getTitle(), "title", 180));
        expense.setCategory(request.getCategory() == null ? OperationsExpenseCategory.OTHER : request.getCategory());
        expense.setAmount(amount);
        expense.setExpenseDate(request.getExpenseDate());
        expense.setPaidBy(inputValidator.optional(request.getPaidBy(), 150));
        expense.setPaymentMethod(request.getPaymentMethod() == null ? OperationsPaymentMethod.CASH : request.getPaymentMethod());
        expense.setStatus(request.getStatus() == null ? OperationsExpenseStatus.DRAFT : request.getStatus());
        expense.setNotes(inputValidator.optional(request.getNotes(), 2000));
    }

    private OperationsExpenseResponseDto toResponse(OperationsExpense expense) {
        OperationsExpenseResponseDto response = new OperationsExpenseResponseDto();
        response.setId(expense.getId());
        response.setTitle(expense.getTitle());
        response.setCategory(expense.getCategory());
        response.setAmount(expense.getAmount());
        response.setExpenseDate(expense.getExpenseDate());
        response.setPaidBy(expense.getPaidBy());
        response.setPaymentMethod(expense.getPaymentMethod());
        response.setStatus(expense.getStatus());
        response.setNotes(expense.getNotes());
        response.setCreatedAt(expense.getCreatedAt());
        response.setUpdatedAt(expense.getUpdatedAt());
        return response;
    }
}
