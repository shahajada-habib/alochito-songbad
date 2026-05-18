CREATE TABLE IF NOT EXISTS operations_activity_log (
    id BIGINT NOT NULL AUTO_INCREMENT,
    module_name VARCHAR(80) NOT NULL,
    entity_id BIGINT,
    action_type VARCHAR(30) NOT NULL,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    actor_name VARCHAR(150),
    created_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_activity_module (module_name),
    INDEX idx_operations_activity_action (action_type),
    INDEX idx_operations_activity_created_at (created_at)
);
