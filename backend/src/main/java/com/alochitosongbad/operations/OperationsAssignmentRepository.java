package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsAssignmentRepository extends JpaRepository<OperationsAssignment, Long> {
    List<OperationsAssignment> findAllByOrderByCreatedAtDesc();
}
