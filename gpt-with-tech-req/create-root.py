#!/usr/bin/env python3
import argparse, sys, secrets, string
from pathlib import Path
from textwrap import dedent

def rand_secret(n=64):
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))

def write(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dedent(content).lstrip(), encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(description="Create root folder and infrastructure files")
    ap.add_argument("--name", required=True, help="Project name, e.g. TicketingApp")
    ap.add_argument("--api-port", type=int, default=3000)
    ap.add_argument("--web-port", type=int, default=4200)
    ap.add_argument("--db-port", type=int, default=5432)
    args = ap.parse_args()

    root = Path(args.name)
    if root.exists() and any(root.iterdir()):
        print(f"Target '{root}' exists and is not empty.", file=sys.stderr)
        sys.exit(1)

    # .gitignore
    write(root/".gitignore", """
    node_modules/
    dist/
    .next/
    .angular/
    .env
    api/.env*
    web/.env*
    coverage/
    """)
    
    # README.md
    write(root/"README.md", f"""
    # {args.name}

    **Ticketing Web Application** – Full-stack system with API (Next.js), Web (Angular), PostgreSQL, Stripe (or mock), and MailHog for email.

    ## Quickstart (Dev)
    ```bash
    cp .env.example .env
    docker compose up --build
    ```

    **Services**:
    - API: http://localhost:{args.api_port} (Swagger: /api/docs)
    - Web: http://localhost:{args.web_port}
    - MailHog UI: http://localhost:8025
    - Postgres: localhost:{args.db_port}
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
    """)

    # .env.example
    write(root/".env.example", f"""
    # ----- API -----
    DATABASE_URL=postgresql://appuser:apppass@db:5432/appdb
    JWT_SECRET={rand_secret()}
    SMTP_HOST=mailhog
    SMTP_PORT=1025
    SMTP_USER=
    SMTP_PASS=
    SMTP_FROM="Tickets <no-reply@example.com>"
    APP_BASE_URL=http://localhost:{args.web_port}
    API_BASE_URL=http://localhost:{args.api_port}
    PAYMENTS_DISABLED=true
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    OAUTH_REDIRECT_URL=http://localhost:{args.api_port}/api/auth/oauth/google/callback
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    # ----- WEB -----
    NG_APP_API_BASE_URL=http://localhost:{args.api_port}
    """)

    # docker-compose.yml
    write(root/"docker-compose.yml", f"""
    version: "3.9"
    services:
      db:
        image: postgres:16
        environment:
          POSTGRES_DB: appdb
          POSTGRES_USER: appuser
          POSTGRES_PASSWORD: apppass
        ports:
          - "{args.db_port}:5432"
        volumes:
          - db_data:/var/lib/postgresql/data
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
          interval: 5s
          timeout: 5s
          retries: 10

      mailhog:
        image: mailhog/mailhog
        ports:
          - "1025:1025"
          - "8025:8025"

      api:
        build: ./api
        depends_on:
          db:
            condition: service_healthy
          mailhog:
            condition: service_started
        env_file: .env
        environment:
          PORT: {args.api_port}
        ports:
          - "{args.api_port}:3000"

      web:
        build: ./web
        environment:
          NG_APP_API_BASE_URL: "http://api:3000"
        ports:
          - "{args.web_port}:4200"
        depends_on:
          - api

      stripe-mock:
        image: stripe/stripe-mock:latest
        ports:
          - "12111:12111"
        command: ["--http-port", "12111"]

    volumes:
      db_data:
    """)

    # Makefile
    write(root/"Makefile", f"""
    up:
    \tdocker compose up --build
    down:
    \tdocker compose down
    migrate:
    \tdocker compose exec api npm run prisma:migrate
    seed:
    \tdocker compose exec api node scripts/seed.cjs
    logs:
    \tdocker compose logs -f
    """)

    print(f"Root structure for '{args.name}' created successfully.")

if __name__ == "__main__":
    main()
