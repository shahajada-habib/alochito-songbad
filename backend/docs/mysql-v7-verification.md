# MySQL V7-V9 Verification

## Start Backend With MySQL

PowerShell:

```powershell
$env:SPRING_PROFILES_ACTIVE='mysql-dev'
$env:DB_USERNAME='root'
$env:DB_PASSWORD='<your-password>'
mvn spring-boot:run
```

Bash:

```bash
SPRING_PROFILES_ACTIVE=mysql-dev \
DB_USERNAME=root \
DB_PASSWORD=<your-password> \
mvn spring-boot:run
```

## Verify Flyway History

```sql
SELECT version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

Expected: V1 through V9 all show `success = 1`.

## Verify V7 Date Conversion

```sql
SELECT id, title,
       scheduled_at, publish_date
FROM news
ORDER BY id DESC
LIMIT 20;
```

Expected: `scheduled_at` and `publish_date` are MySQL `DATETIME` values. `NULL` is acceptable for drafts or legacy invalid values.

## Verify V8 Reactions

```sql
DESCRIBE reactions;
SELECT COUNT(*) FROM reactions;
```

Expected: `reactions` exists with `news_id`, `reaction_type`, `ip_hash`, and `created_at`.

## Verify V9 Tags

```sql
DESCRIBE tags;
DESCRIBE news_tags;

SELECT t.name, COUNT(nt.news_id) AS article_count
FROM tags t
LEFT JOIN news_tags nt ON t.id = nt.tag_id
GROUP BY t.id
ORDER BY article_count DESC;
```

Expected: `tags` and `news_tags` exist, and existing comma-separated `news.tags` values have been copied into normalized tag rows where present.
