package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsAttendanceRepository extends JpaRepository<OperationsAttendance, Long> {
    List<OperationsAttendance> findAllByOrderByCreatedAtDesc();
}
