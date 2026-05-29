CREATE TABLE site_settings (
    id BIGINT NOT NULL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    footer_logo_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(255),
    address TEXT,
    facebook_url VARCHAR(500),
    youtube_url VARCHAR(500),
    twitter_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    about_text TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
