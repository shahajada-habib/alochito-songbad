package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsPurchaseRequestRepository extends JpaRepository<OperationsPurchaseRequest, Long> {
    List<OperationsPurchaseRequest> findAllByOrderByCreatedAtDesc();
}
