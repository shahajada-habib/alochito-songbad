package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsAdClientRepository extends JpaRepository<OperationsAdClient, Long> {
    List<OperationsAdClient> findAllByOrderByCreatedAtDesc();
}
