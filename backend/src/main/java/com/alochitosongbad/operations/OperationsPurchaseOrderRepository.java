package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsPurchaseOrderRepository extends JpaRepository<OperationsPurchaseOrder, Long> {
    List<OperationsPurchaseOrder> findAllByOrderByCreatedAtDesc();
    boolean existsByOrderNumber(String orderNumber);
    boolean existsByOrderNumberAndIdNot(String orderNumber, Long id);
}
