package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsAdBookingRepository extends JpaRepository<OperationsAdBooking, Long> {
    List<OperationsAdBooking> findAllByOrderByCreatedAtDesc();
}
