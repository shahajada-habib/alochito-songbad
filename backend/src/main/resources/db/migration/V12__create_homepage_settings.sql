CREATE TABLE homepage_settings (
    id BIGINT NOT NULL PRIMARY KEY,
    breaking_ticker_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    lead_story_id BIGINT,
    featured_story_ids TEXT,
    visible_category_sections TEXT,
    most_read_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    latest_section_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME,
    updated_at DATETIME
);
