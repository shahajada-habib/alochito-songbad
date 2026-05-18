CREATE TABLE IF NOT EXISTS operations_staff (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    designation VARCHAR(120) NOT NULL,
    department VARCHAR(120),
    phone VARCHAR(50),
    email VARCHAR(200),
    joining_date DATE,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_staff_status (status)
);

CREATE TABLE IF NOT EXISTS operations_assignments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    assigned_staff_id BIGINT NOT NULL,
    category VARCHAR(120),
    location VARCHAR(180),
    deadline DATETIME(6),
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_assignments_staff (assigned_staff_id),
    INDEX idx_operations_assignments_status (status),
    INDEX idx_operations_assignments_deadline (deadline),
    CONSTRAINT fk_operations_assignments_staff
        FOREIGN KEY (assigned_staff_id)
        REFERENCES operations_staff(id)
);
