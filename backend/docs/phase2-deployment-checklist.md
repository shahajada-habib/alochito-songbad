# Phase 2 Deployment Checklist

## Required Environment Variables

Backend:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `SITE_URL`
- `MEDIA_UPLOAD_DIR`
- `MEDIA_MAX_FILE_SIZE`
- `MEDIA_MAX_REQUEST_SIZE`
- `MEDIA_MAX_FILE_SIZE_BYTES`
- `JWT_EXPIRATION_SECONDS`

SSR/frontend:

- `API_ORIGIN`
- `SITE_URL`

## Flyway Migration Order

Run migrations in order through application startup:

- `V1__init.sql`
- `V2__add_news_ownership_fields.sql`
- `V3__create_breaking_news.sql`
- `V4__create_media_assets.sql`
- `V5__increase_news_image_url_length.sql`
- `V6__add_news_image_metadata.sql`
- `V7__convert_news_publish_dates_and_create_comments.sql`
- `V8__create_news_reactions.sql`
- `V9__create_tags.sql`

Verify:

```sql
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

## Pre-Launch Smoke Tests

- Open the public homepage and confirm due published news loads.
- Search from the public header and confirm results load.
- Open a published article and confirm SSR title/meta are present in page source.
- Like and dislike an article, refresh, and confirm counts persist.
- Submit a public comment and confirm it remains pending publicly.
- Log in to admin as admin and confirm dashboard loads.
- Approve a pending comment and confirm it appears publicly.
- Create a user, change role/status, and confirm password hash is never returned.
- Create and publish a news article with tags, then confirm tag chips appear on the public article.
- Upload a valid image and confirm invalid file types are rejected.

## Known Remaining Risks

- Reaction identity is IP-based, so NAT/shared networks can collapse multiple readers into one reaction. Mitigation: add a privacy-safe browser token in Phase 3 if needed.
- In-memory rate limiting resets on restart and is not shared across multiple backend instances. Mitigation: move rate limits to Redis before horizontal scaling.
- Tag slug generation strips non-Latin characters. Mitigation: add transliteration or Unicode-safe slug rules before exposing tag detail pages.
- Dashboard analytics are operational summaries, not audited analytics. Mitigation: add event tracking tables or analytics warehouse integration in Phase 3.
- Email/editor notifications are log-only stubs. Mitigation: add queue-backed email/webhook notifications in Phase 3.
