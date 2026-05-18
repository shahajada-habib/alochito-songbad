package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsInvoiceRepository extends JpaRepository<OperationsInvoice, Long> {
    List<OperationsInvoice> findAllByOrderByCreatedAtDesc();
    boolean existsByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumberAndIdNot(String invoiceNumber, Long id);
}
