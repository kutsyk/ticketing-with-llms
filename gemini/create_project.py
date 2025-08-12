import os

def create_file(path, content):
    """Helper function to create a file with specified content."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)

# --- Project Root ---
root_dir = 'ticket-app'
os.makedirs(root_dir, exist_ok=True)

# --- docker-compose.yml ---
docker_compose_content = """version: '3.8'

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-tickets}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-tickets}
      POSTGRES_DB: ${POSTGRES_DB:-tickets}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER}" ]
      interval: 5s
      timeout: 5s
      retries: 10
  
  mailhog:
    image: mailhog/mailhog:v1.0.1
    ports:
      - "8025:8025"

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-tickets}:${POSTGRES_PASSWORD:-tickets}@db:5432/${POSTGRES_DB:-tickets}?schema=public
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./api:/app
      - /app/node_modules
    command: sh -c "npx prisma migrate dev --name init && npm run dev"

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
    ports:
      - "4200:80"
    depends_on:
      - api
    volumes:
      - ./web:/app
      - /app/node_modules
    command: npm run start

volumes:
  db_data:
"""
create_file(os.path.join(root_dir, 'docker-compose.yml'), docker_compose_content)

# --- API directory and files ---
# API Dockerfile
api_dockerfile_content = """
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
"""
create_file(os.path.join(root_dir, 'api', 'Dockerfile'), api_dockerfile_content)

# API package.json
api_package_json_content = """{
  "name": "api",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@prisma/client": "^4.16.2",
    "bcrypt": "^5.1.0",
    "next": "13.4.7",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/node": "20.3.1",
    "@types/react": "18.2.14",
    "autoprefixer": "10.4.14",
    "eslint": "8.43.0",
    "eslint-config-next": "13.4.7",
    "postcss": "8.4.24",
    "prisma": "^4.16.2",
    "tailwindcss": "3.3.2",
    "typescript": "5.1.3"
  }
}
"""
create_file(os.path.join(root_dir, 'api', 'package.json'), api_package_json_content)

# API prisma schema
api_prisma_schema_content = """// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  OPERATOR
  ADMINISTRATOR
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tickets   Ticket[]
}

model Ticket {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  qrCode     String   @unique
  isUsed     Boolean  @default(false)
  price      Float
  createdAt  DateTime @default(now())
  usedAt     DateTime?
}
"""
create_file(os.path.join(root_dir, 'api', 'prisma', 'schema.prisma'), api_prisma_schema_content)

# API swagger.json
api_swagger_content = """{
  "openapi": "3.0.0",
  "info": {
    "title": "Ticket API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/auth/register": {
      "post": {
        "summary": "Register a new user",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "email": { "type": "string" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created"
          }
        }
      }
    }
  }
}
"""
create_file(os.path.join(root_dir, 'api', 'src', 'swagger.json'), api_swagger_content)

# API lib/prisma.ts
api_prisma_ts_content = """import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
"""
create_file(os.path.join(root_dir, 'api', 'src', 'lib', 'prisma.ts'), api_prisma_ts_content)

# API auth/register route
api_register_route_content = """import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'User creation failed' }, { status: 500 });
  }
}
"""
create_file(os.path.join(root_dir, 'api', 'src', 'app', 'api', 'auth', 'register', 'route.ts'), api_register_route_content)

# --- WEB directory and files ---
# WEB Dockerfile
web_dockerfile_content = """
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.21.3-alpine

COPY --from=build /app/dist/web /usr/share/nginx/html

EXPOSE 80
"""
create_file(os.path.join(root_dir, 'web', 'Dockerfile'), web_dockerfile_content)

# WEB package.json
web_package_json_content = """{
  "name": "web",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^16.0.0",
    "@angular/cdk": "^16.0.0",
    "@angular/common": "^16.0.0",
    "@angular/compiler": "^16.0.0",
    "@angular/core": "^16.0.0",
    "@angular/forms": "^16.0.0",
    "@angular/material": "^16.0.0",
    "@angular/platform-browser": "^16.0.0",
    "@angular/platform-browser-dynamic": "^16.0.0",
    "@angular/router": "^16.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.13.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.0.0",
    "@angular/cli": "~16.0.0",
    "@angular/compiler-cli": "^16.0.0",
    "@types/jasmine": "~4.3.0",
    "jasmine-core": "~4.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.0.0",
    "typescript": "~5.0.2"
  }
}
"""
create_file(os.path.join(root_dir, 'web', 'package.json'), web_package_json_content)

# WEB routes
web_routes_content = """import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { OperatorDashboardComponent } from './operator-dashboard/operator-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { OperatorGuard } from './guards/operator.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'operator', component: OperatorDashboardComponent, canActivate: [OperatorGuard] },
  { path: '', redirectTo: '/profile', pathMatch: 'full' },
  { path: '**', redirectTo: '/profile' }
];
"""
create_file(os.path.join(root_dir, 'web', 'src', 'app', 'app.routes.ts'), web_routes_content)

# WEB app component html
web_app_component_html_content = """<mat-toolbar color="primary">
  <span>Ticket App</span>
  <span class="example-spacer"></span>
  <button mat-button routerLink="/profile">Profile</button>
  <button mat-button *ngIf="isOperator" routerLink="/operator">Operator</button>
  <button mat-button *ngIf="isAdmin" routerLink="/admin">Admin</button>
  <button mat-button (click)="logout()">Logout</button>
</mat-toolbar>

<router-outlet></router-outlet>
"""
create_file(os.path.join(root_dir, 'web', 'src', 'app', 'app.component.html'), web_app_component_html_content)

print("Project structure and files have been created successfully!")