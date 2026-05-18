package com.alochitosongbad.operations;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OperationsNotificationRepository extends JpaRepository<OperationsNotification, Long> {
    List<OperationsNotification> findAllByOrderByCreatedAtDesc();
    List<OperationsNotification> findByReadStatusOrderByCreatedAtDesc(OperationsNotificationReadStatus readStatus);
}
