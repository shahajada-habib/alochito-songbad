package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsDepartmentRepository extends JpaRepository<OperationsDepartment, Long> {
    List<OperationsDepartment> findAllByOrderByCreatedAtDesc();
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
