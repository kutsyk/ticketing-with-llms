Here’s the full `api/README.md` that matches your technical requirements and explains how to run, test, and maintain the API.

````markdown
# Ticketing API

This is the backend API service for the Ticketing platform.  
It is built with **Next.js API routes**, **Prisma ORM**, and **PostgreSQL**.

---

## 📦 Features
- **JWT-based authentication** (with optional OAuth providers)
- **Role-based access control** (ADMIN, SELLER, CHECKER, USER)
- **User management** (create, list, update, delete)
- **Event management** (create, publish, archive)
- **Ticket management** (issue, revoke, refund)
- **Audit logs**
- **Email templates** for transactional emails
- **Swagger UI** auto-generated from `@openapi` annotations
- **Database migrations & seeding** with Prisma
- **Dockerized** for local development

---

## 🚀 Getting Started

### 1. Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Make (optional but recommended)

---

### 2. Environment Variables
Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
````

Example `.env`:

```env
DATABASE_URL=postgresql://user:pass@db:5432/appdb?schema=public
JWT_SECRET=supersecretkey
PORT=3000

# OAuth keys (optional)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# FACEBOOK_CLIENT_ID=
# FACEBOOK_CLIENT_SECRET=
```

---

### 3. Running Locally

#### With Make (recommended)

```bash
make build
make up
```

#### Without Make

```bash
docker compose build
docker compose up api db
```

---

### 4. Database Migrations & Seeding

Apply migrations:

```bash
make migrate
```

Seed the database (creates default admin user):

```bash
make seed
```

---

### 5. Swagger API Docs

Once the API is running, open:

```
http://localhost:3000/api/docs
```

Regenerate Swagger JSON:

```bash
make swagger
```

---

### 6. Project Structure

```
api/
  ├── Dockerfile
  ├── docker-compose.yml
  ├── Makefile
  ├── package.json
  ├── prisma/
  │   ├── schema.prisma
  │   ├── migrations/
  │   └── seed.cjs
  ├── public/
  │   ├── swagger.json
  │   └── swagger-ui/...
  ├── templates/
  │   ├── email/
  │   │   ├── welcome.html
  │   │   └── ticket.html
  ├── pages/
  │   └── api/
  │       ├── auth/
  │       ├── admin/
  │       ├── events/
  │       ├── tickets/
  │       └── docs.js
  ├── scripts/
  │   ├── wait-for-it.sh
  │   └── generate-swagger.cjs
  ├── lib/
  │   ├── auth.js
  │   ├── db.js
  │   └── validators.js
  ├── .env.example
  ├── .gitignore
  └── README.md
```

---

## 🔑 Default Admin

After seeding:

* **Email:** `admin@example.com`
* **Password:** `Admin123!`

---

## 🛠 Development Notes

* Use `prisma migrate dev` only locally. In containers, use `prisma migrate deploy`.
* API routes are annotated with `@openapi` comments for Swagger generation.
* All passwords are stored as bcrypt hashes.
* Sensitive fields (like `password_hash`) are removed from API responses.

---

## 📜 License

MIT

```

---

If you want, I can now give you **`docker-compose.yml`** so that `make up` will actually start the API and DB with correct dependencies. That will also make it easier to test all the files we’re adding.
```
