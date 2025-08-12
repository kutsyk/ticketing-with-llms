#!/usr/bin/env python3
import os
from pathlib import Path
from textwrap import dedent

BASE_DIR = Path(__file__).resolve().parent
API_DIR = BASE_DIR / "ticketing-app" / "api"

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(dedent(content).lstrip("\n"))

def main():
    API_DIR.mkdir(parents=True, exist_ok=True)
    # docker-compose.yml
    write_file(BASE_DIR / "ticketing-app" / "docker-compose.yml", """
    version: '3.9'
    services:
      db:
        image: postgres:16
        environment:
          POSTGRES_DB: appdb
          POSTGRES_USER: user
          POSTGRES_PASSWORD: pass
        volumes:
          - db_data:/var/lib/postgresql/data
        ports:
          - "5432:5432"

      mailhog:
        image: mailhog/mailhog
        ports:
          - "8025:8025"
          - "1025:1025"

      api:
        build: ./api
        depends_on:
          - db
          - mailhog
        env_file:
          - ./api/.env
        ports:
          - "3000:3000"
        command: sh -c "npx prisma migrate dev --name init && npm run seed && npm run dev"

    volumes:
      db_data:
    """)

    # .env.example
    write_file(API_DIR / ".env.example", """
    DATABASE_URL=postgresql://user:pass@db:5432/appdb
    JWT_SECRET=supersecret
    SMTP_HOST=mailhog
    SMTP_PORT=1025
    SMTP_FROM=noreply@example.com
    PAYMENTS_DISABLED=true
    APP_BASE_URL=http://localhost:4200
    API_BASE_URL=http://localhost:3000
    """)

    # Dockerfile
    write_file(API_DIR / "Dockerfile", """
    FROM node:18
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npx prisma generate
    EXPOSE 3000
    CMD ["npm", "run", "dev"]
    """)

    # package.json
    write_file(API_DIR / "package.json", """
    {
      "name": "ticketing-api",
      "version": "1.0.0",
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "seed": "node prisma/seed.js"
      },
      "dependencies": {
        "@prisma/client": "^5.22.0",
        "bcrypt": "^5.1.1",
        "jsonwebtoken": "^9.0.2",
        "next": "13.5.6",
        "nodemailer": "^6.9.7",
        "qrcode": "^1.5.3",
        "swagger-ui-express": "^5.0.0",
        "stripe": "^13.7.0"
      },
      "devDependencies": {
        "prisma": "^5.22.0"
      }
    }
    """)
    # prisma/schema.prisma
    write_file(API_DIR / "prisma" / "schema.prisma", """
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    enum Role { USER SELLER CHECKER ADMIN }
    enum EventStatus { DRAFT PUBLISHED ARCHIVED }
    enum TicketStatus { ISSUED USED REVOKED REFUNDED }
    enum PaymentStatus { REQUIRES_ACTION PAID FAILED REFUNDED }
    enum ScanResult { VALIDATED ALREADY_USED INVALID EXPIRED REVOKED }

    model users {
      id               String   @id @default(uuid())
      email            String   @unique
      email_verified_at DateTime?
      password_hash    String?
      name             String?
      avatar_url       String?
      role             Role     @default(USER)
      created_at       DateTime @default(now())
      updated_at       DateTime @updatedAt
      oauth_accounts   oauth_accounts[]
      tickets          tickets[]
      payments         payments[]
      scans            ticket_scans[]
      audit_logs       audit_logs[]
    }

    model oauth_accounts {
      id                  String   @id @default(uuid())
      user                users    @relation(fields: [user_id], references: [id])
      user_id             String
      provider            String
      provider_account_id String
      access_token        String?
      refresh_token       String?
      expires_at          DateTime?
    }

    model events {
      id          String       @id @default(uuid())
      name        String
      description String?
      venue       String?
      starts_at   DateTime
      ends_at     DateTime
      timezone    String?
      status      EventStatus  @default(DRAFT)
      created_at  DateTime     @default(now())
      updated_at  DateTime     @updatedAt
      ticket_types ticket_types[]
    }

    model ticket_types {
      id             String    @id @default(uuid())
      event          events    @relation(fields: [event_id], references: [id])
      event_id       String
      name           String
      description    String?
      price_cents    Int
      currency       String
      quantity_total Int
      quantity_sold  Int       @default(0)
      sales_start_at DateTime?
      sales_end_at   DateTime?
      tickets        tickets[]
    }

    model tickets {
      id              String        @id @default(uuid())
      user            users?        @relation(fields: [user_id], references: [id])
      user_id         String?
      ticket_type     ticket_types  @relation(fields: [ticket_type_id], references: [id])
      ticket_type_id  String
      serial          String        @unique
      qr_token        String        @unique
      qr_version      Int
      status          TicketStatus  @default(ISSUED)
      issued_at       DateTime      @default(now())
      used_at         DateTime?
      expires_at      DateTime?
      delivery_email  String
      purchaser_name  String
      payment         payments?     @relation(fields: [payment_id], references: [id])
      payment_id      String?
      scans           ticket_scans[]
    }

    model payments {
      id                 String         @id @default(uuid())
      user               users?         @relation(fields: [user_id], references: [id])
      user_id            String?
      provider           String
      provider_payment_id String?
      amount_cents       Int
      currency           String
      status             PaymentStatus
      created_at         DateTime       @default(now())
      updated_at         DateTime       @updatedAt
      tickets            tickets[]
    }

    model ticket_scans {
      id                  String      @id @default(uuid())
      ticket              tickets     @relation(fields: [ticket_id], references: [id])
      ticket_id           String
      scanned_by          users       @relation(fields: [scanned_by_user_id], references: [id])
      scanned_by_user_id  String
      result              ScanResult
      user_agent          String?
      ip_address          String?
      scanned_at          DateTime    @default(now())
    }

    model audit_logs {
      id             String   @id @default(uuid())
      actor_user     users?   @relation(fields: [actor_user_id], references: [id])
      actor_user_id  String?
      action         String
      entity         String
      entity_id      String
      diff           Json?
      created_at     DateTime @default(now())
    }

    // Indexes
    @@index([email], map: "idx_users_email")
    @@index([qr_token], map: "idx_tickets_qr_token")
    @@index([serial], map: "idx_tickets_serial")
    @@index([ticket_id], map: "idx_scans_ticket_id")
    @@index([provider_payment_id], map: "idx_payments_provider_payment_id")
    """)

    # migrations/init.sql
    write_file(API_DIR / "prisma" / "migrations" / "init" / "migration.sql", "-- SQL migration file generated from schema.prisma")

    # pages/api/_utils/db.js
    write_file(API_DIR / "pages" / "api" / "_utils" / "db.js", """
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    export default prisma;
    """)

    # pages/api/_utils/auth.js
    write_file(API_DIR / "pages" / "api" / "_utils" / "auth.js", """
    import jwt from 'jsonwebtoken';
    import bcrypt from 'bcrypt';

    const JWT_SECRET = process.env.JWT_SECRET;

    export function signToken(payload, expiresIn = '1h') {
      return jwt.sign(payload, JWT_SECRET, { expiresIn });
    }

    export function verifyToken(token) {
      return jwt.verify(token, JWT_SECRET);
    }

    export async function hashPassword(password) {
      return await bcrypt.hash(password, 10);
    }

    export async function comparePassword(password, hash) {
      return await bcrypt.compare(password, hash);
    }

    export function requireRole(roles) {
      return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
        const token = authHeader.split(' ')[1];
        try {
          const decoded = verifyToken(token);
          if (!roles.includes(decoded.role)) {
            return res.status(403).json({ error: 'Forbidden' });
          }
          req.user = decoded;
          next();
        } catch (err) {
          res.status(401).json({ error: 'Invalid token' });
        }
      };
    }
    """)

    # pages/api/auth/register.js
    write_file(API_DIR / "pages" / "api" / "auth" / "register.js", """
    import prisma from '../_utils/db';
    import { hashPassword, signToken } from '../_utils/auth';

    export default async function handler(req, res) {
      if (req.method !== 'POST') return res.status(405).end();
      const { email, password, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const existing = await prisma.users.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'User already exists' });

      const password_hash = await hashPassword(password);
      const user = await prisma.users.create({
        data: { email, password_hash, name }
      });

      const token = signToken({ id: user.id, role: user.role });
      res.status(201).json({ token });
    }
    """)

    # pages/api/auth/login.js
    write_file(API_DIR / "pages" / "api" / "auth" / "login.js", """
    import prisma from '../_utils/db';
    import { comparePassword, signToken } from '../_utils/auth';

    export default async function handler(req, res) {
      if (req.method !== 'POST') return res.status(405).end();
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const user = await prisma.users.findUnique({ where: { email } });
      if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken({ id: user.id, role: user.role });
      res.status(200).json({ token });
    }
    """)

    # pages/api/events/index.js
    write_file(API_DIR / "pages" / "api" / "events" / "index.js", """
    import prisma from '../_utils/db';

    export default async function handler(req, res) {
      if (req.method === 'GET') {
        const events = await prisma.events.findMany({ where: { status: 'PUBLISHED' } });
        return res.json(events);
      }
      res.status(405).end();
    }
    """)

    # pages/api/tickets/validate.js
    write_file(API_DIR / "pages" / "api" / "tickets" / "validate.js", """
    import prisma from '../_utils/db';

    export default async function handler(req, res) {
      if (req.method !== 'POST') return res.status(405).end();
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'QR token required' });

      const ticket = await prisma.tickets.findUnique({ where: { qr_token: token } });
      if (!ticket) return res.json({ status: 'invalid' });
      if (ticket.status === 'USED') return res.json({ status: 'already_used', used_at: ticket.used_at });
      if (ticket.status !== 'ISSUED') return res.json({ status: ticket.status.toLowerCase() });

      await prisma.tickets.update({
        where: { id: ticket.id },
        data: { status: 'USED', used_at: new Date() }
      });

      res.json({ status: 'valid_unused', ticket });
    }
    """)
    # pages/api/checkout/session.js
    write_file(API_DIR / "pages" / "api" / "checkout" / "session.js", """
    import Stripe from 'stripe';
    import prisma from '../_utils/db';

    const stripeDisabled = process.env.PAYMENTS_DISABLED === 'true';
    const stripe = stripeDisabled ? null : new Stripe(process.env.STRIPE_SECRET_KEY);

    export default async function handler(req, res) {
      if (req.method !== 'POST') return res.status(405).end();
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid items' });
      }

      if (stripeDisabled) {
        const tickets = await Promise.all(items.map(async (item) => {
          const ticketType = await prisma.ticket_types.findUnique({ where: { id: item.ticket_type_id } });
          const ticket = await prisma.tickets.create({
            data: {
              ticket_type_id: ticketType.id,
              status: 'ISSUED',
              serial: Math.random().toString(36).substr(2, 8).toUpperCase(),
              qr_token: crypto.randomUUID(),
              issued_at: new Date(),
              delivery_email: 'test@example.com'
            }
          });
          return ticket;
        }));
        return res.json({ status: 'mock_paid', tickets });
      }

      const line_items = await Promise.all(items.map(async (item) => {
        const ticketType = await prisma.ticket_types.findUnique({ where: { id: item.ticket_type_id } });
        return {
          price_data: {
            currency: ticketType.currency,
            product_data: { name: ticketType.name },
            unit_amount: ticketType.price_cents
          },
          quantity: item.qty
        };
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.APP_BASE_URL}/orders/success`,
        cancel_url: `${process.env.APP_BASE_URL}/orders/cancel`
      });

      res.json({ url: session.url });
    }
    """)

    # pages/api/admin/events.js
    write_file(API_DIR / "pages" / "api" / "admin" / "events.js", """
    import prisma from '../_utils/db';
    import { requireRole } from '../_utils/auth';

    export default async function handler(req, res) {
      await new Promise((resolve) => requireRole(['ADMIN'])(req, res, resolve));
      if (req.method === 'GET') {
        const events = await prisma.events.findMany();
        return res.json(events);
      }
      if (req.method === 'POST') {
        const event = await prisma.events.create({ data: req.body });
        return res.status(201).json(event);
      }
      res.status(405).end();
    }
    """)

    # pages/api/admin/tickets.js
    write_file(API_DIR / "pages" / "api" / "admin" / "tickets.js", """
    import prisma from '../_utils/db';
    import { requireRole } from '../_utils/auth';

    export default async function handler(req, res) {
      await new Promise((resolve) => requireRole(['ADMIN'])(req, res, resolve));
      if (req.method === 'GET') {
        const tickets = await prisma.tickets.findMany();
        return res.json(tickets);
      }
      res.status(405).end();
    }
    """)

    # pages/api/seller/issue.js
    write_file(API_DIR / "pages" / "api" / "seller" / "issue.js", """
    import prisma from '../_utils/db';
    import { requireRole } from '../_utils/auth';
    import crypto from 'crypto';

    export default async function handler(req, res) {
      await new Promise((resolve) => requireRole(['SELLER'])(req, res, resolve));
      if (req.method !== 'POST') return res.status(405).end();
      const { eventId, ticketTypeId, purchaserEmail, purchaserName } = req.body;

      const ticket = await prisma.tickets.create({
        data: {
          ticket_type_id: ticketTypeId,
          delivery_email: purchaserEmail,
          purchaser_name: purchaserName,
          status: 'ISSUED',
          serial: Math.random().toString(36).substr(2, 8).toUpperCase(),
          qr_token: crypto.randomUUID(),
          issued_at: new Date()
        }
      });

      res.status(201).json(ticket);
    }
    """)

    # pages/api/docs/index.js (Swagger UI)
    write_file(API_DIR / "pages" / "api" / "docs" / "index.js", """
    import swaggerUi from 'swagger-ui-express';
    import swaggerDocument from '../../../swagger.json';

    export const config = {
      api: { bodyParser: false }
    };

    export default function handler(req, res) {
      return swaggerUi.setup(swaggerDocument)(req, res);
    }
    """)

        # swagger.json
    write_file(API_DIR / "swagger.json", """
{
  "openapi": "3.0.0",
  "info": {
    "title": "Ticketing Web Application API",
    "version": "1.0.0",
    "description": "API for user registration, authentication, ticket purchasing, QR code generation/validation, and admin operations."
  },
  "servers": [
    {
      "url": "http://localhost:3000/api",
      "description": "Local development server"
    }
  ],
  "paths": {
    "/auth/register": {
      "post": {
        "summary": "Register a new user with email and password",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/RegisterRequest" },
              "example": {
                "email": "user@example.com",
                "password": "StrongPass123!",
                "name": "John Doe"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User successfully registered",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/User" }
              }
            }
          },
          "400": {
            "description": "Validation error",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "summary": "Login with email and password",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/LoginRequest" },
              "example": {
                "email": "user@example.com",
                "password": "StrongPass123!"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/AuthToken" }
              }
            }
          },
          "401": {
            "description": "Invalid credentials",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/verify-email": {
      "post": {
        "summary": "Verify user's email using token",
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Email verified successfully"
          },
          "400": {
            "description": "Invalid or expired token",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/auth/forgot-password": {
      "post": {
        "summary": "Send a password reset email",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/ForgotPasswordRequest" },
              "example": { "email": "user@example.com" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password reset email sent"
          }
        }
      }
    },
    "/auth/reset-password": {
      "post": {
        "summary": "Reset password using provided token",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/ResetPasswordRequest" },
              "example": {
                "token": "reset-token",
                "newPassword": "NewPass123!"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password reset successfully"
          },
          "400": {
            "description": "Invalid or expired token",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/events": {
      "get": {
        "summary": "List all public events",
        "responses": {
          "200": {
            "description": "Array of events",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/Event" }
                }
              }
            }
          }
        }
      }
    },
    "/events/{id}": {
      "get": {
        "summary": "Get details for a specific event",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Event details",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Event" }
              }
            }
          },
          "404": {
            "description": "Event not found"
          }
        }
      }
    },
    "/tickets/validate": {
      "post": {
        "summary": "Validate ticket QR code",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/ValidateTicketRequest" },
              "example": { "token": "qr-code-token" }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Validation result",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ScanResult" }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "RegisterRequest": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email" },
          "password": { "type": "string", "minLength": 8 },
          "name": { "type": "string" }
        },
        "required": ["email", "password"]
      },
      "LoginRequest": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email" },
          "password": { "type": "string" }
        },
        "required": ["email", "password"]
      },
      "ForgotPasswordRequest": {
        "type": "object",
        "properties": {
          "email": { "type": "string", "format": "email" }
        },
        "required": ["email"]
      },
      "ResetPasswordRequest": {
        "type": "object",
        "properties": {
          "token": { "type": "string" },
          "newPassword": { "type": "string", "minLength": 8 }
        },
        "required": ["token", "newPassword"]
      },
      "ValidateTicketRequest": {
        "type": "object",
        "properties": {
          "token": { "type": "string" }
        },
        "required": ["token"]
      },
      "User": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "email": { "type": "string" },
          "name": { "type": "string" },
          "role": { "type": "string", "enum": ["USER", "SELLER", "CHECKER", "ADMIN"] }
        }
      },
      "Event": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "name": { "type": "string" },
          "description": { "type": "string" },
          "venue": { "type": "string" },
          "starts_at": { "type": "string", "format": "date-time" },
          "ends_at": { "type": "string", "format": "date-time" },
          "status": { "type": "string", "enum": ["DRAFT", "PUBLISHED", "ARCHIVED"] }
        }
      },
      "ScanResult": {
        "type": "object",
        "properties": {
          "status": { "type": "string", "enum": ["valid_unused", "already_used", "invalid", "expired", "revoked"] },
          "ticket": { "$ref": "#/components/schemas/Ticket" }
        }
      },
      "Ticket": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "serial": { "type": "string" },
          "status": { "type": "string", "enum": ["ISSUED", "USED", "REVOKED", "REFUNDED"] }
        }
      },
      "AuthToken": {
        "type": "object",
        "properties": {
          "accessToken": { "type": "string" },
          "refreshToken": { "type": "string" }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": { "type": "string" }
        }
      }
    }
  }
}
    """)

 # email templates (MJML)
    write_file(API_DIR / "emails" / "ticketDelivery.mjml", """
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="20px" font-weight="bold">Your Ticket</mj-text>
            <mj-image src="{{QR_URL}}" alt="QR Code" width="200px" />
            <mj-text>Event: {{EVENT_NAME}}</mj-text>
            <mj-text>Date: {{EVENT_DATE}}</mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
    """)

    write_file(API_DIR / "emails" / "verifyEmail.mjml", """
    <mjml>
      <mj-body>
        <mj-section>
          <mj-column>
            <mj-text font-size="20px">Verify your email</mj-text>
            <mj-button href="{{VERIFY_LINK}}">Verify</mj-button>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
    """)

    # prisma/seed.js
    write_file(API_DIR / "prisma" / "seed.js", """
    import prisma from '../pages/api/_utils/db.js';
    import bcrypt from 'bcrypt';

    async function main() {
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const admin = await prisma.users.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
          email: 'admin@example.com',
          password_hash: adminPassword,
          role: 'ADMIN',
          name: 'Admin User'
        }
      });

      const event = await prisma.events.create({
        data: {
          name: 'Sample Event',
          description: 'Demo event for testing',
          venue: 'Test Venue',
          starts_at: new Date(Date.now() + 86400000),
          ends_at: new Date(Date.now() + 172800000),
          timezone: 'UTC',
          status: 'PUBLISHED'
        }
      });

      await prisma.ticket_types.create({
        data: {
          event_id: event.id,
          name: 'General Admission',
          description: 'Standard ticket',
          price_cents: 2000,
          currency: 'USD',
          quantity_total: 100,
          quantity_sold: 0
        }
      });

      console.log('Seed complete:', { admin, event });
    }

    main()
      .then(() => process.exit(0))
      .catch((e) => {
        console.error(e);
        process.exit(1);
      });
    """)
    print("✅ API folder structure created successfully at:", API_DIR)

if __name__ == "__main__":
    try:
        main()
        print("✅ script2.py finished without errors.")
    except Exception as e:
        print("❌ script2.py failed:", str(e))
        import traceback
        traceback.print_exc()