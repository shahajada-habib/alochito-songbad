CREATE TABLE IF NOT EXISTS operations_attendance (
    id BIGINT NOT NULL AUTO_INCREMENT,
    staff_id BIGINT NOT NULL,
    duty_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status VARCHAR(20) NOT NULL,
    duty_note TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_attendance_staff (staff_id),
    INDEX idx_operations_attendance_date (duty_date),
    INDEX idx_operations_attendance_status (status),
    CONSTRAINT fk_operations_attendance_staff
        FOREIGN KEY (staff_id)
        REFERENCES operations_staff(id)
);

CREATE TABLE IF NOT EXISTS operations_assets (
    id BIGINT NOT NULL AUTO_INCREMENT,
    asset_name VARCHAR(180) NOT NULL,
    asset_type VARCHAR(40) NOT NULL,
    serial_number VARCHAR(120),
    assigned_staff_id BIGINT,
    purchase_date DATE,
    purchase_price DECIMAL(14, 2),
    condition_status VARCHAR(30) NOT NULL,
    availability_status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_operations_assets_serial_number (serial_number),
    INDEX idx_operations_assets_assigned_staff (assigned_staff_id),
    INDEX idx_operations_assets_type (asset_type),
    INDEX idx_operations_assets_availability (availability_status),
    CONSTRAINT fk_operations_assets_staff
        FOREIGN KEY (assigned_staff_id)
        REFERENCES operations_staff(id)
);
