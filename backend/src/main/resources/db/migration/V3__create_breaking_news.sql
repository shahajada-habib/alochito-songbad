CREATE TABLE IF NOT EXISTS breaking_news (
    id BIGINT NOT NULL AUTO_INCREMENT,
    text TEXT NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
);

CREATE INDEX idx_breaking_news_active ON breaking_news (active);
CREATE INDEX idx_breaking_news_created_at ON breaking_news (created_at);
