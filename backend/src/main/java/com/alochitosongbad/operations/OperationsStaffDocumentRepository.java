package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsStaffDocumentRepository extends JpaRepository<OperationsStaffDocument, Long> {
    List<OperationsStaffDocument> findAllByOrderByCreatedAtDesc();
}
