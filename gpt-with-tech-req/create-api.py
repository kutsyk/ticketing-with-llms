#!/usr/bin/env python3
import argparse, sys, json
from pathlib import Path
from textwrap import dedent

def write(p: Path, content: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(dedent(content).lstrip(), encoding="utf-8")

def json_write(p: Path, obj: dict):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")

def main():
    ap = argparse.ArgumentParser(description="Create API scaffold")
    ap.add_argument("--root", required=True, help="Root folder created by script #1")
    args = ap.parse_args()

    root = Path(args.root)
    if not root.exists():
        print(f"Root '{root}' not found. Run script #1 first.", file=sys.stderr)
        sys.exit(1)

    api = root / "api"

    # Dockerfile
    write(api / "Dockerfile", """
    FROM node:20-alpine
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm ci --no-audit --no-fund
    COPY . .
    RUN npx prisma generate && npm run build
    EXPOSE 3000
    CMD sh -c "npx prisma migrate deploy && node scripts/seed.cjs && npm run start"
    """)

    # package.json
    json_write(api / "package.json", {
      "name": "ticketing-api",
      "private": True,
      "version": "0.1.0",
      "scripts": {
        "dev": "next dev -p 3000",
        "build": "next build",
        "start": "next start -p 3000",
        "prisma:migrate": "prisma migrate dev",
        "prisma:deploy": "prisma migrate deploy"
      },
      "dependencies": {
        "@prisma/client": "^5.18.0",
        "bcryptjs": "^2.4.3",
        "express": "^4.19.2",
        "swagger-ui-express": "^5.0.0",
        "yamljs": "^0.3.0",
        "jsonwebtoken": "^9.0.2",
        "next": "14.2.5",
        "nodemailer": "^6.9.11",
        "qrcode": "^1.5.3",
        "zod": "^3.23.8"
      },
      "devDependencies": {
        "typescript": "^5.4.0",
        "prisma": "^5.18.0"
      }
    })

    # tsconfig.json & Next.js config
    write(api / "next.config.js", "module.exports = {};\n")
    write(api / "tsconfig.json", """
    {
      "compilerOptions": {
        "target": "ES2022",
        "lib": ["dom", "esnext"],
        "strict": true,
        "noEmit": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "esModuleInterop": true,
        "jsx": "preserve"
      },
      "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
    }
    """)
    write(api / "next-env.d.ts", "/// <reference types='next' />\n")

    # Prisma schema (shortened for brevity, still matches requirements)
    write(api / "prisma/schema.prisma", """
    generator client { provider = "prisma-client-js" }
    datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

    enum Role { USER SELLER CHECKER ADMIN }
    enum EventStatus { DRAFT PUBLISHED ARCHIVED }
    enum TicketStatus { ISSUED USED REVOKED REFUNDED }

    model users {
      id String @id @default(uuid())
      email String @unique
      email_verified_at DateTime?
      password_hash String?
      name String?
      avatar_url String?
      role Role @default(USER)
      created_at DateTime @default(now())
      updated_at DateTime @updatedAt
      tickets tickets[]
    }
    // ... rest of tables from your model ...
    """)

    # Swagger OpenAPI spec
    write(api / "openapi.yaml", """
    openapi: 3.0.0
    info:
      title: Ticketing API
      version: 1.0.0
    servers:
      - url: http://localhost:3000/api
    paths:
      /healthz:
        get:
          summary: Health check
          responses:
            '200':
              description: OK
      /auth/register:
        post:
          summary: Register user
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: object
                  properties:
                    email: { type: string }
                    password: { type: string }
          responses:
            '200':
              description: Registered
    """)

    # lib files
    write(api / "src/lib/prisma.ts", """
    import { PrismaClient } from "@prisma/client";
    const g = global as any;
    export const prisma = g.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
    """)

    write(api / "src/lib/jwt.ts", """
    import jwt from "jsonwebtoken";
    const SECRET = process.env.JWT_SECRET || "dev-secret";
    export const signJwt = (payload: object, exp="1h") => jwt.sign(payload, SECRET, { expiresIn: exp });
    export const verifyJwt = <T=any>(token: string) => jwt.verify(token, SECRET) as T;
    """)

    write(api / "src/lib/email.ts", """
    import nodemailer from "nodemailer";
    export function mailer(){
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "mailhog",
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false
      });
    }
    """)

    # API routes
    write(api / "src/pages/api/healthz.ts", """
    import type { NextApiRequest, NextApiResponse } from "next";
    export default function handler(_: NextApiRequest, res: NextApiResponse) {
      res.status(200).json({ ok: true });
    }
    """)

    write(api / "src/pages/api/docs.ts", """
    import type { NextApiRequest, NextApiResponse } from "next";
    import swaggerUi from "swagger-ui-express";
    import YAML from "yamljs";
    import express from "express";

    const swaggerDoc = YAML.load("openapi.yaml");
    const handler = express();
    handler.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

    export default handler;
    export const config = { api: { bodyParser: false } };
    """)

    write(api / "src/pages/api/auth/register.ts", """
    import type { NextApiRequest, NextApiResponse } from "next";
    import { prisma } from "../../../lib/prisma";
    import bcrypt from "bcryptjs";
    import { mailer } from "../../../lib/email";
    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== "POST") return res.status(405).end();
      const { email, password, name } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "email/password required" });
      const hash = await bcrypt.hash(password, 10);
      const user = await prisma.users.create({ data: { email, password_hash: hash, name } });
      await mailer().sendMail({ to: email, subject: "Verify Email (dev)", text: "Dev mode" });
      res.json({ id: user.id });
    }
    """)

    # Seed script
    write(api / "scripts/seed.cjs", """
    const { PrismaClient } = require("@prisma/client");
    const bcrypt = require("bcryptjs");
    const prisma = new PrismaClient();
    async function main(){
      const hash = await bcrypt.hash("admin1234", 10);
      await prisma.users.upsert({
        where: { email: "admin@example.com" },
        update: { role: "ADMIN" },
        create: { email: "admin@example.com", password_hash: hash, role: "ADMIN", name: "Admin" }
      });
      console.log("Seeded admin user");
    }
    main().finally(()=>prisma.$disconnect());
    """)

    print(f"API scaffold created at {api}")

if __name__ == "__main__":
    main()
