CREATE TABLE operations_vendors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(180),
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(200),
    address TEXT,
    vendor_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE operations_purchase_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    requested_by_staff_id BIGINT,
    department_id BIGINT,
    item_description TEXT NOT NULL,
    estimated_amount DECIMAL(14, 2) NOT NULL,
    request_date DATE NOT NULL,
    needed_by_date DATE,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_operations_purchase_requests_staff
        FOREIGN KEY (requested_by_staff_id) REFERENCES operations_staff(id),
    CONSTRAINT fk_operations_purchase_requests_department
        FOREIGN KEY (department_id) REFERENCES operations_departments(id)
);

CREATE TABLE operations_purchase_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    purchase_request_id BIGINT,
    vendor_id BIGINT NOT NULL,
    order_number VARCHAR(80) NOT NULL,
    title VARCHAR(180) NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount DECIMAL(14, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT uk_operations_purchase_orders_order_number UNIQUE (order_number),
    CONSTRAINT fk_operations_purchase_orders_request
        FOREIGN KEY (purchase_request_id) REFERENCES operations_purchase_requests(id),
    CONSTRAINT fk_operations_purchase_orders_vendor
        FOREIGN KEY (vendor_id) REFERENCES operations_vendors(id)
);
