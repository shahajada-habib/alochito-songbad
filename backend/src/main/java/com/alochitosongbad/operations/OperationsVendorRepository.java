package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsVendorRepository extends JpaRepository<OperationsVendor, Long> {
    List<OperationsVendor> findAllByOrderByCreatedAtDesc();
}
