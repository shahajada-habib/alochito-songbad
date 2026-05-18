package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsStaffRepository extends JpaRepository<OperationsStaff, Long> {
    List<OperationsStaff> findAllByOrderByCreatedAtDesc();
}
