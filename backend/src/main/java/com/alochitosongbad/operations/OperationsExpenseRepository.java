package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsExpenseRepository extends JpaRepository<OperationsExpense, Long> {
    List<OperationsExpense> findAllByOrderByCreatedAtDesc();
}
