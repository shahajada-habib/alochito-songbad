# ALOCHITO SONGBAD

Clean MVP structure for a news portal with one Angular app and one Spring Boot API.

## Project Structure

```text
alochito-songbad/
  frontend/   Angular app for public news portal and admin CMS
  backend/    Spring Boot backend API
```

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at:

```text
http://localhost:4200
```

Useful routes:

```text
/              Public news home
/news          Public news listing
/news/:slug    Public news detail placeholder
/admin         CMS dashboard
/admin/news    CMS news management placeholder
```

## Run Backend

Create a MySQL database first:

```sql
CREATE DATABASE alochito_songbad;
```

Then update `backend/src/main/resources/application.properties` with your local MySQL username and password.

```bash
cd backend
mvn spring-boot:run
```

Backend runs at:

```text
http://localhost:8080
```

Health check:

```text
GET http://localhost:8080/api/health
```

## Notes

- This is only the base structure.
- No full news or CMS features are implemented yet.
- Keep the MVP small: public pages, admin pages, auth, category/news CRUD, and publishing workflow can be added step by step.
