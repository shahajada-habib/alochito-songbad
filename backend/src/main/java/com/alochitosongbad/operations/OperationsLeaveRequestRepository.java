package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsLeaveRequestRepository extends JpaRepository<OperationsLeaveRequest, Long> {
    List<OperationsLeaveRequest> findAllByOrderByCreatedAtDesc();
}
