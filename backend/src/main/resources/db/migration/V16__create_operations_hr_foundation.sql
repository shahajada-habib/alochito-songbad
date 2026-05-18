CREATE TABLE IF NOT EXISTS operations_departments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_operations_departments_name (name),
    UNIQUE KEY uk_operations_departments_code (code),
    INDEX idx_operations_departments_status (status)
);

CREATE TABLE IF NOT EXISTS operations_leave_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    staff_id BIGINT NOT NULL,
    leave_type VARCHAR(20) NOT NULL DEFAULT 'CASUAL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(8,2) NOT NULL DEFAULT 0,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewer_name VARCHAR(150),
    review_note TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_leave_staff (staff_id),
    INDEX idx_operations_leave_status (status),
    CONSTRAINT fk_operations_leave_staff FOREIGN KEY (staff_id) REFERENCES operations_staff(id)
);

CREATE TABLE IF NOT EXISTS operations_staff_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    staff_id BIGINT NOT NULL,
    title VARCHAR(180) NOT NULL,
    document_type VARCHAR(30) NOT NULL DEFAULT 'NOTE',
    file_url VARCHAR(500),
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_documents_staff (staff_id),
    INDEX idx_operations_documents_status (status),
    CONSTRAINT fk_operations_documents_staff FOREIGN KEY (staff_id) REFERENCES operations_staff(id)
);
