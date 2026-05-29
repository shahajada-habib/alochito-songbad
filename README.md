# ALOCHITO SONGBAD

ALOCHITO SONGBAD is a Spring Boot + Angular Bangla news portal with a public reader site and an admin CMS.

## Run Backend

Use the client demo database:

```powershell
cd backend
$env:SPRING_DATASOURCE_URL='jdbc:mysql://localhost:3306/alochito_songbad_client?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
mvn spring-boot:run -D"spring-boot.run.profiles=mysql-dev"
```

Backend default API base:

```text
http://localhost:8082
```

## Run Frontend

```powershell
cd frontend
npm install
npm run start -- --host 127.0.0.1 --port 4210
```

Frontend:

```text
http://127.0.0.1:4210
```

## Seed Client Demo Data

```powershell
.\tools\seed-client-portal-demo-data.ps1 -ApiBaseUrl "http://localhost:8082" -AdminEmail "admin" -AdminPassword "1234"
```

The seed script is idempotent and creates editable CMS data for site settings, homepage settings, categories, newsroom profiles, published demo articles, and breaking ticker items.

## Main Features

- Public portal homepage, latest news, category, tag, search, journalist list/profile, and news detail pages.
- CMS dashboard, news workflow, categories, media library, comments, breaking news, team/profile management.
- Dynamic Website Info and Homepage Customize settings.
- Public comments, reactions, view count, most-read/trending support.
- Bangla/English CMS language toggle and CMS-only light/dark theme.

## Useful Routes

```text
/                         Public homepage
/news                     Latest news
/search?q=বাংলাদেশ        Search
/category/জাতীয়           Category page
/tag/ক্রিকেট              Tag page
/journalists              Journalist/team page
/admin                    CMS dashboard
/admin/news/create        Create news
/admin/website-info       Website settings
/admin/homepage-customize Homepage settings
/admin/settings           CMS settings
```
