CREATE TABLE IF NOT EXISTS operations_expenses (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    category VARCHAR(30) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    expense_date DATE NOT NULL,
    paid_by VARCHAR(150),
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_expenses_category (category),
    INDEX idx_operations_expenses_status (status),
    INDEX idx_operations_expenses_date (expense_date)
);

CREATE TABLE IF NOT EXISTS operations_invoices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ad_client_id BIGINT NOT NULL,
    ad_booking_id BIGINT,
    invoice_number VARCHAR(80) NOT NULL,
    title VARCHAR(180) NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    paid_amount DECIMAL(14, 2) NOT NULL,
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_operations_invoices_invoice_number (invoice_number),
    INDEX idx_operations_invoices_client (ad_client_id),
    INDEX idx_operations_invoices_booking (ad_booking_id),
    INDEX idx_operations_invoices_payment_status (payment_status),
    INDEX idx_operations_invoices_due_date (due_date),
    CONSTRAINT fk_operations_invoices_client
        FOREIGN KEY (ad_client_id)
        REFERENCES operations_ad_clients(id),
    CONSTRAINT fk_operations_invoices_booking
        FOREIGN KEY (ad_booking_id)
        REFERENCES operations_ad_bookings(id)
);
