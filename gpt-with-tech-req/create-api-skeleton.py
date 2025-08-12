#!/usr/bin/env python3
import os

ROOT = "ticketing-app/api"

FILES = [
    # Top-level
    "Dockerfile",
    "Makefile",
    "README.md",
    "next.config.js",
    "package.json",
    "tsconfig.json",
    ".env.example",
    ".eslintrc.cjs",
    ".prettierrc",

    # public
    "public/swagger.json",
    "public/emails/compiled/verify-email.html",
    "public/emails/compiled/reset-password.html",
    "public/emails/compiled/ticket-delivery.html",
    "public/emails/compiled/receipt.html",
    "public/favicon-16x16.png",
    "public/favicon-32x32.png",

    # prisma
    "prisma/schema.prisma",
    "prisma/seed.cjs",
    "prisma/migrations/.gitkeep",

    # scripts
    "scripts/wait-for-it.sh",
    "scripts/generate-swagger.cjs",
    "scripts/build-templates.cjs",

    # templates (MJML)
    "templates/emails/verify-email.mjml",
    "templates/emails/reset-password.mjml",
    "templates/emails/ticket-delivery.mjml",
    "templates/emails/receipt.mjml",

    # docs
    "docs/api-tests.http",
    "docs/openapi-components.js",

    # lib
    "lib/auth/jwt.js",
    "lib/auth/hash.js",
    "lib/auth/rbac.js",
    "lib/db/client.js",
    "lib/email/transport.js",
    "lib/email/send.js",
    "lib/payments/stripe.js",
    "lib/payments/provider.js",
    "lib/qr/generate.js",
    "lib/qr/payload.js",
    "lib/tickets/issue.js",
    "lib/tickets/validate.js",
    "lib/tickets/resend.js",
    "lib/exports/csv.js",
    "lib/calendar/ics.js",
    "lib/logging/logger.js",
    "lib/rate-limit/limiter.js",
    "lib/validation/zod.js",
    "lib/env.js",

    # middleware (optional, if you enable global rate limit)
    "middleware/rate-limit.js",

    # pages root
    "pages/index.js",

    # pages/api - docs & health
    "pages/api/docs.js",
    "pages/api/healthz.js",
    "pages/api/readyz.js",

    # pages/api/auth
    "pages/api/auth/register.js",
    "pages/api/auth/login.js",
    "pages/api/auth/me.js",
    "pages/api/auth/verify-email.js",
    "pages/api/auth/forgot-password.js",
    "pages/api/auth/reset-password.js",
    "pages/api/auth/oauth/google/start.js",
    "pages/api/auth/oauth/google/callback.js",

    # pages/api/events (public)
    "pages/api/events/index.js",
    "pages/api/events/[id].js",

    # pages/api/ticket-types (public by event)
    "pages/api/ticket-types/[eventId]/index.js",

    # pages/api/checkout
    "pages/api/checkout/session.js",
    "pages/api/checkout/webhook.js",

    # pages/api/tickets (user + admin)
    "pages/api/tickets/index.js",
    "pages/api/tickets/[id].js",
    "pages/api/tickets/[id]/resend-email.js",
    "pages/api/tickets/validate.js",

    # pages/api/seller & checker
    "pages/api/seller/issue.js",
    "pages/api/checker/validate.js",

    # pages/api/admin
    "pages/api/admin/users/index.js",
    "pages/api/admin/users/[id].js",
    "pages/api/admin/events/index.js",
    "pages/api/admin/events/[id].js",
    "pages/api/admin/ticket-types/index.js",
    "pages/api/admin/ticket-types/[id].js",
    "pages/api/admin/tickets/index.js",
    "pages/api/admin/tickets/[id].js",
    "pages/api/admin/payments/index.js",
    "pages/api/admin/payments/[id].js",
    "pages/api/admin/scans/index.js",
    "pages/api/admin/audit-logs/index.js",
    "pages/api/admin/exports/index.js",
]

def touch(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Create empty file (keep .gitkeep as empty too)
    with open(path, "a", encoding="utf-8"):
        pass

def main():
    for rel in FILES:
        abs_path = os.path.join(ROOT, rel)
        touch(abs_path)
    print(f"✅ Created API skeleton under ./{ROOT} ({len(FILES)} files)")

if __name__ == "__main__":
    main()
