package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsAssetRepository extends JpaRepository<OperationsAsset, Long> {
    List<OperationsAsset> findAllByOrderByCreatedAtDesc();
    boolean existsBySerialNumber(String serialNumber);
    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);
}
