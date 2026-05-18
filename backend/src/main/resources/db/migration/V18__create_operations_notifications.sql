CREATE TABLE operations_notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    source_module VARCHAR(80),
    source_entity_id BIGINT,
    read_status VARCHAR(20) NOT NULL,
    due_at DATETIME,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
