CREATE TABLE IF NOT EXISTS operations_ad_clients (
    id BIGINT NOT NULL AUTO_INCREMENT,
    client_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(180),
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(200),
    address TEXT,
    industry VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_ad_clients_status (status),
    INDEX idx_operations_ad_clients_name (client_name)
);

CREATE TABLE IF NOT EXISTS operations_ad_bookings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ad_client_id BIGINT NOT NULL,
    title VARCHAR(180) NOT NULL,
    placement VARCHAR(40) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price DECIMAL(14, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    publish_status VARCHAR(30) NOT NULL,
    sales_owner VARCHAR(150),
    notes TEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    INDEX idx_operations_ad_bookings_client (ad_client_id),
    INDEX idx_operations_ad_bookings_publish_status (publish_status),
    INDEX idx_operations_ad_bookings_dates (start_date, end_date),
    CONSTRAINT fk_operations_ad_bookings_client
        FOREIGN KEY (ad_client_id)
        REFERENCES operations_ad_clients(id)
);
