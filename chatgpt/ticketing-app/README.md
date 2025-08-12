# Ticketing — Local Run

## Prereqs
- Docker + Docker Compose

## Setup
1. Copy env: `cp .env.example .env` (edit if needed)
2. Build & run: `docker compose up --build`
3. Open Web UI: http://localhost:8080
4. Open MailHog: http://localhost:8025

## Try it
- Register or just use the **Purchase** form with your email.
- Check MailHog inbox for your ticket email (QR embedded).
- Copy the `qr_token` from the email image name (or inspect API response) and test **Scan**.

## Notes
- Auth is a simple stub (no JWT) for demo. Replace with Passport JWT + Google OAuth for production.
- TypeORM `synchronize: true` is enabled for dev only.
- Payments are mocked; integrate Stripe/Mollie and set `orders.status=PAID` on webhook.
