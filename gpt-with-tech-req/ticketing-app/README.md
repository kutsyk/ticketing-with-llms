# ticketing-app

**Ticketing Web Application** – Full-stack system with API (Next.js), Web (Angular), PostgreSQL, Stripe (or mock), and MailHog for email.

## Quickstart (Dev)
```bash
cp .env.example .env
docker compose up --build
```

**Services**:
- API: http://localhost:3000 (Swagger: /api/docs)
- Web: http://localhost:4200
- MailHog UI: http://localhost:8025
- Postgres: localhost:5432
- Stripe Mock (if enabled): http://localhost:12111

**Seed Admin Credentials**:
- Email: `admin@example.com`
- Password: `admin1234`

## Running Migrations & Seed
```bash
docker compose exec api npm run prisma:migrate
docker compose exec api node scripts/seed.cjs
```

## Testing (Dev)
- Unit: `npm test` (inside api or web)
- E2E: Cypress/Playwright (inside web)

## Production
- Configure `.env` for production services
- Build images: `docker compose build`
- Deploy via your container platform
