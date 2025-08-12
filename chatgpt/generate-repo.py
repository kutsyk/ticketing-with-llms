#!/usr/bin/env python3
# upgrade_auth_qr.py
# Adds Registration, JWT, Google OAuth, and a camera QR scanner into the ticketing-app scaffold.
import os, json, textwrap
from pathlib import Path

ROOT = Path("ticketing-app")

FILES = {
    # ---------- ROOT ----------
    ".env.example": textwrap.dedent("""\
    # Postgres
    POSTGRES_USER=tickets
    POSTGRES_PASSWORD=tickets
    POSTGRES_DB=tickets
    DATABASE_URL=postgres://tickets:tickets@db:5432/tickets

    # API
    API_PORT=3000
    PUBLIC_URL=http://localhost:8080

    # SMTP (MailHog)
    SMTP_HOST=mailhog
    SMTP_PORT=1025
    MAIL_FROM="Tickets <no-reply@example.local>"

    # === JWT ===
    JWT_ACCESS_TTL=900           # 15 minutes
    JWT_REFRESH_TTL=1209600      # 14 days
    JWT_SECRET=change_me_access_secret
    JWT_REFRESH_SECRET=change_me_refresh_secret

    # === Google OAuth ===
    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=
    GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

    # Web
    API_BASE_URL=http://localhost:3000
    """),

    # ---------- API ----------
    "api/package.json": json.dumps({
        "name": "tickets-api",
        "version": "0.2.0",
        "private": True,
        "scripts": {
            "start": "node dist/main.js",
            "start:dev": "nest start --watch",
            "build": "nest build"
        },
        "dependencies": {
            "@nestjs/common": "^10.0.0",
            "@nestjs/core": "^10.0.0",
            "@nestjs/jwt": "^10.2.0",
            "@nestjs/passport": "^10.0.0",
            "@nestjs/platform-express": "^10.0.0",
            "argon2": "^0.40.3",
            "class-transformer": "^0.5.1",
            "class-validator": "^0.14.0",
            "cookie-parser": "^1.4.6",
            "dotenv": "^16.4.5",
            "nodemailer": "^6.9.13",
            "passport": "^0.7.0",
            "passport-google-oauth20": "^2.0.0",
            "passport-jwt": "^4.0.1",
            "pg": "^8.11.3",
            "qrcode": "^1.5.3",
            "reflect-metadata": "^0.1.13",
            "rxjs": "^7.8.1",
            "typeorm": "^0.3.20"
        },
        "devDependencies": {
            "@nestjs/cli": "^10.3.2",
            "@nestjs/schematics": "^10.1.1",
            "@nestjs/testing": "^10.0.0",
            "@types/node": "^20.12.7",
            "ts-node": "^10.9.2",
            "typescript": "^5.4.5"
        }
    }, indent=2),

    # Extend user entity for Google info
    "api/src/entities/user.entity.ts": textwrap.dedent("""\
    import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

    @Entity('users')
    export class User {
      @PrimaryGeneratedColumn('uuid') id!: string;
      @Column({ unique: true }) email!: string;
      @Column({ nullable: true }) password_hash?: string; // null if Google only
      @Column({ default: 'USER' }) role!: 'USER'|'CHECKER'|'SELLER'|'ADMIN';
      @Column({ nullable: true }) name?: string;
      @Column({ nullable: true }) avatar_url?: string;
      @Column({ nullable: true, unique: true }) google_sub?: string; // Google subject
      @CreateDateColumn() created_at!: Date;
      @UpdateDateColumn() updated_at!: Date;
    }
    """),

    # --- Auth DTOs
    "api/src/auth/dto.ts": textwrap.dedent("""\
    import { IsEmail, IsString, MinLength } from 'class-validator';

    export class RegisterDto {
      @IsEmail() email!: string;
      @IsString() @MinLength(6) password!: string;
      @IsString() name!: string;
    }
    export class LoginDto {
      @IsEmail() email!: string;
      @IsString() password!: string;
    }
    """),

    # --- Tokens service
    "api/src/auth/tokens.service.ts": textwrap.dedent("""\
    import { Injectable } from '@nestjs/common';
    import { JwtService } from '@nestjs/jwt';

    @Injectable()
    export class TokensService {
      constructor(private jwt: JwtService) {}
      signAccess(payload: any) {
        return this.jwt.sign(payload, {
          secret: process.env.JWT_SECRET!,
          expiresIn: Number(process.env.JWT_ACCESS_TTL || 900),
        });
      }
      signRefresh(payload: any) {
        return this.jwt.sign(payload, {
          secret: process.env.JWT_REFRESH_SECRET!,
          expiresIn: Number(process.env.JWT_REFRESH_TTL || 1209600),
        });
      }
    }
    """),

    # --- JWT strategies
    "api/src/auth/jwt.strategy.ts": textwrap.dedent("""\
    import { Injectable } from '@nestjs/common';
    import { PassportStrategy } from '@nestjs/passport';
    import { ExtractJwt, Strategy } from 'passport-jwt';

    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
      constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromExtractors([(req: any) => req?.cookies?.access_token]),
          ignoreExpiration: false,
          secretOrKey: process.env.JWT_SECRET,
        });
      }
      async validate(payload: any) { return payload; }
    }
    """),

    "api/src/auth/jwt-refresh.strategy.ts": textwrap.dedent("""\
    import { Injectable } from '@nestjs/common';
    import { PassportStrategy } from '@nestjs/passport';
    import { ExtractJwt, Strategy } from 'passport-jwt';

    @Injectable()
    export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
      constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromExtractors([(req: any) => req?.cookies?.refresh_token]),
          ignoreExpiration: false,
          secretOrKey: process.env.JWT_REFRESH_SECRET,
        });
      }
      async validate(payload: any) { return payload; }
    }
    """),

    # --- Google OAuth strategy
    "api/src/auth/google.strategy.ts": textwrap.dedent("""\
    import { PassportStrategy } from '@nestjs/passport';
    import { Strategy, VerifyCallback } from 'passport-google-oauth20';
    import { Injectable } from '@nestjs/common';

    @Injectable()
    export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
      constructor() {
        super({
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL!,
          scope: ['email', 'profile']
        });
      }
      async validate(_at: string, _rt: string, profile: any, done: VerifyCallback) {
        const { id: sub, displayName, photos, emails } = profile;
        const email = emails?.[0]?.value;
        const avatar_url = photos?.[0]?.value;
        done(null, { sub, email, name: displayName, avatar_url });
      }
    }
    """),

    # --- Auth module/service/controller
    "api/src/auth/auth.module.ts": textwrap.dedent("""\
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { PassportModule } from '@nestjs/passport';
    import { JwtModule } from '@nestjs/jwt';
    import { User } from '../entities/user.entity';
    import { AuthService } from './auth.service';
    import { AuthController } from './auth.controller';
    import { TokensService } from './tokens.service';
    import { JwtStrategy } from './jwt.strategy';
    import { JwtRefreshStrategy } from './jwt-refresh.strategy';
    import { GoogleStrategy } from './google.strategy';

    @Module({
      imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule.register({ session: false }),
        JwtModule.register({}) // secrets via env in TokensService
      ],
      providers: [AuthService, TokensService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
      controllers: [AuthController],
      exports: [AuthService]
    })
    export class AuthModule {}
    """),

    "api/src/auth/auth.service.ts": textwrap.dedent("""\
    import { Injectable } from '@nestjs/common';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository } from 'typeorm';
    import { User } from '../entities/user.entity';
    import * as argon2 from 'argon2';

    @Injectable()
    export class AuthService {
      constructor(@InjectRepository(User) private users: Repository<User>) {}

      async register(email: string, password: string, name: string) {
        const existing = await this.users.findOne({ where: { email } });
        if (existing) throw new Error('EMAIL_IN_USE');
        const password_hash = await argon2.hash(password);
        const user = this.users.create({ email, password_hash, name, role: 'USER' });
        return this.users.save(user);
      }

      async validateLocal(email: string, password: string) {
        const u = await this.users.findOne({ where: { email } });
        if (!u || !u.password_hash) return null;
        const ok = await argon2.verify(u.password_hash, password);
        return ok ? u : null;
      }

      async linkOrCreateGoogle(payload: { sub: string; email?: string; name?: string; avatar_url?: string }) {
        if (!payload.email) throw new Error('NO_EMAIL_FROM_GOOGLE');
        let user = await this.users.findOne({ where: [{ google_sub: payload.sub }, { email: payload.email }] });
        if (!user) {
          user = this.users.create({
            email: payload.email,
            google_sub: payload.sub,
            name: payload.name,
            avatar_url: payload.avatar_url,
            role: 'USER'
          });
        } else {
          // link existing
          if (!user.google_sub) user.google_sub = payload.sub;
          if (!user.name && payload.name) user.name = payload.name;
          if (!user.avatar_url && payload.avatar_url) user.avatar_url = payload.avatar_url;
        }
        return this.users.save(user);
      }
    }
    """),

    "api/src/auth/auth.controller.ts": textwrap.dedent("""\
    import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
    import { Response, Request } from 'express';
    import { AuthService } from './auth.service';
    import { TokensService } from './tokens.service';
    import { RegisterDto, LoginDto } from './dto';
    import { AuthGuard } from '@nestjs/passport';

    function setAuthCookies(res: Response, access: string, refresh: string) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('access_token', access, {
        httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: Number(process.env.JWT_ACCESS_TTL || 900) * 1000
      });
      res.cookie('refresh_token', refresh, {
        httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: Number(process.env.JWT_REFRESH_TTL || 1209600) * 1000
      });
    }

    @Controller('auth')
    export class AuthController {
      constructor(private auth: AuthService, private tokens: TokensService) {}

      @Post('register')
      async register(@Body() dto: RegisterDto, @Res() res: Response) {
        const u = await this.auth.register(dto.email, dto.password, dto.name);
        const payload = { sub: u.id, email: u.email, role: u.role };
        setAuthCookies(res, this.tokens.signAccess(payload), this.tokens.signRefresh(payload));
        return res.json({ id: u.id, email: u.email, role: u.role, name: u.name });
      }

      @Post('login')
      async login(@Body() dto: LoginDto, @Res() res: Response) {
        const u = await this.auth.validateLocal(dto.email, dto.password);
        if (!u) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        const payload = { sub: u.id, email: u.email, role: u.role };
        setAuthCookies(res, this.tokens.signAccess(payload), this.tokens.signRefresh(payload));
        return res.json({ id: u.id, email: u.email, role: u.role, name: u.name });
      }

      @Post('refresh')
      @UseGuards(AuthGuard('jwt-refresh'))
      async refresh(@Req() req: Request, @Res() res: Response) {
        const payload: any = (req as any).user;
        setAuthCookies(res, this.tokens.signAccess(payload), this.tokens.signRefresh(payload));
        return res.json({ ok: true });
      }

      @Post('logout')
      async logout(@Res() res: Response) {
        res.clearCookie('access_token'); res.clearCookie('refresh_token');
        return res.json({ ok: true });
      }

      // Google OAuth
      @Get('google')
      @UseGuards(AuthGuard('google'))
      async googleStart() { /* redirect to Google */ }

      @Get('google/callback')
      @UseGuards(AuthGuard('google'))
      async googleCb(@Req() req: Request, @Res() res: Response) {
        const profile = (req as any).user;
        const u = await this.auth.linkOrCreateGoogle(profile);
        const payload = { sub: u.id, email: u.email, role: u.role };
        setAuthCookies(res, this.tokens.signAccess(payload), this.tokens.signRefresh(payload));
        // Redirect back to web app
        const url = process.env.PUBLIC_URL || 'http://localhost:8080';
        return res.redirect(url);
      }

      @Get('me')
      @UseGuards(AuthGuard('jwt'))
      async me(@Req() req: Request) {
        return (req as any).user;
      }
    }
    """),

    # ---------- WEB ----------
    "web/package.json": json.dumps({
        "name": "web",
        "version": "0.2.0",
        "private": True,
        "scripts": {
            "start": "ng serve",
            "build": "ng build"
        },
        "dependencies": {
            "@angular/animations": "^17.3.0",
            "@angular/common": "^17.3.0",
            "@angular/compiler": "^17.3.0",
            "@angular/core": "^17.3.0",
            "@angular/forms": "^17.3.0",
            "@angular/platform-browser": "^17.3.0",
            "@angular/platform-browser-dynamic": "^17.3.0",
            "@angular/router": "^17.3.0",
            "@angular/material": "^17.3.0",
            "@angular/cdk": "^17.3.0",
            "@zxing/browser": "^0.1.5",
            "rxjs": "^7.8.1",
            "tslib": "^2.6.2",
            "zone.js": "^0.14.4"
        },
        "devDependencies": {
            "@angular/cli": "^17.3.0",
            "@angular/compiler-cli": "^17.3.0",
            "typescript": "^5.4.5"
        }
    }, indent=2),

    # Camera QR scanner component
    "web/src/app/features/checker/scan.component.ts": textwrap.dedent("""\
    import { Component, OnDestroy, signal } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { BrowserMultiFormatReader } from '@zxing/browser';

    const API = (window as any).__API_BASE_URL || (import.meta as any).env?.NG_APP_API_BASE_URL || 'http://localhost:3000';

    @Component({
      selector: 'app-scan',
      standalone: true,
      template: `
      <div class="card">
        <h3>Camera QR Scanner</h3>
        <video id="preview" style="width:100%;max-width:480px;border:1px solid #ddd;border-radius:8px;"></video>
        <div style="margin-top:8px;">
          <button (click)="start()" [disabled]="running()">Start</button>
          <button (click)="stop()" [disabled]="!running()">Stop</button>
        </div>
        <p *ngIf="lastToken()">Token: <code>{{ lastToken() }}</code></p>
        <pre *ngIf="scanResp()">{{ scanResp() | json }}</pre>
      </div>
      `
    })
    export class ScanComponent implements OnDestroy {
      private codeReader = new BrowserMultiFormatReader();
      running = signal(false);
      lastToken = signal<string | null>(null);
      scanResp = signal<any>(null);

      constructor(private http: HttpClient) {}

      async start() {
        if (this.running()) return;
        this.running.set(true);
        const video = document.getElementById('preview') as HTMLVideoElement;
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;
        this.codeReader.decodeFromVideoDevice(deviceId || undefined, video, (result, _err, controls) => {
          if (!this.running()) { controls.stop(); return; }
          if (result) {
            const token = result.getText();
            if (token !== this.lastToken()) {
              this.lastToken.set(token);
              this.http.post(API + '/scan', { qr_token: token }).subscribe(r => this.scanResp.set(r));
            }
          }
        });
      }
      stop() {
        this.running.set(false);
        this.codeReader.reset();
      }
      ngOnDestroy() { this.stop(); }
    }
    """),

    # Simple Google button (redirects to backend)
    "web/src/app/features/auth/google-button.component.ts": textwrap.dedent("""\
    import { Component } from '@angular/core';

    @Component({
      selector: 'google-login-button',
      standalone: true,
      template: `
        <button (click)="login()" style="padding:8px 12px;border-radius:6px;border:1px solid #ddd;background:#fff;">
          Continue with Google
        </button>
      `
    })
    export class GoogleButtonComponent {
      login() {
        const api = (window as any).__API_BASE_URL || (import.meta as any).env?.NG_APP_API_BASE_URL || 'http://localhost:3000';
        window.location.href = api + '/auth/google';
      }
    }
    """),

    # Minimal register form component (optional; app component will still have inline forms)
    "web/src/app/features/auth/register.component.ts": textwrap.dedent("""\
    import { Component, inject, signal } from '@angular/core';
    import { FormsModule } from '@angular/forms';
    import { HttpClient } from '@angular/common/http';
    import { CommonModule } from '@angular/common';

    const API = (window as any).__API_BASE_URL || (import.meta as any).env?.NG_APP_API_BASE_URL || 'http://localhost:3000';

    @Component({
      selector: 'register-form',
      standalone: true,
      imports: [CommonModule, FormsModule],
      template: `
        <form (ngSubmit)="submit()">
          <input [(ngModel)]="name" name="name" placeholder="name" required />
          <input [(ngModel)]="email" name="email" placeholder="email" type="email" required />
          <input [(ngModel)]="password" name="password" placeholder="password" type="password" required />
          <button>Register</button>
        </form>
        <pre *ngIf="resp()">{{ resp() | json }}</pre>
      `
    })
    export class RegisterComponent {
      #http = inject(HttpClient);
      email = ''; password = ''; name = '';
      resp = signal<any>(null);
      submit() {
        this.#http.post(API + '/auth/register', { email: this.email, password: this.password, name: this.name })
          .subscribe(r => this.resp.set(r));
      }
    }
    """),

    # Update the main AppComponent to include Google + Camera scanner
    "web/src/app/app.component.ts": textwrap.dedent("""\
    import { Component, inject, signal } from '@angular/core';
    import { HttpClient } from '@angular/common/http';
    import { FormsModule } from '@angular/forms';
    import { CommonModule } from '@angular/common';
    import { GoogleButtonComponent } from './features/auth/google-button.component';
    import { ScanComponent } from './features/checker/scan.component';

    const API = (window as any).__API_BASE_URL || (import.meta as any).env?.NG_APP_API_BASE_URL || 'http://localhost:3000';

    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [CommonModule, FormsModule, GoogleButtonComponent, ScanComponent],
      template: `
      <div class="container">
        <h2>Ticketing Demo</h2>

        <div class="card">
          <h3>Register</h3>
          <form (ngSubmit)="register()">
            <input [(ngModel)]="regName" name="regName" type="text" placeholder="name" required />
            <input [(ngModel)]="regEmail" name="regEmail" type="email" placeholder="email" required />
            <input [(ngModel)]="regPass" name="regPass" type="password" placeholder="password" required />
            <button>Register</button>
          </form>
          <google-login-button></google-login-button>
          <pre *ngIf="regResp()">{{ regResp() | json }}</pre>
        </div>

        <div class="card">
          <h3>Login</h3>
          <form (ngSubmit)="login()">
            <input [(ngModel)]="logEmail" name="logEmail" type="email" placeholder="email" required />
            <input [(ngModel)]="logPass" name="logPass" type="password" placeholder="password" required />
            <button>Login</button>
          </form>
          <button (click)="refresh()">Refresh Tokens</button>
          <button (click)="logout()">Logout</button>
          <pre *ngIf="logResp()">{{ logResp() | json }}</pre>
        </div>

        <div class="card">
          <h3>Purchase Ticket</h3>
          <form (ngSubmit)="purchase()">
            <input [(ngModel)]="buyEmail" name="buyEmail" type="email" placeholder="recipient email" required />
            <input [(ngModel)]="qty" name="qty" type="number" min="1" placeholder="qty" />
            <button>Purchase</button>
          </form>
          <pre *ngIf="buyResp()">{{ buyResp() | json }}</pre>
          <p>Check MailHog at <a href="http://localhost:8025" target="_blank">http://localhost:8025</a></p>
        </div>

        <app-scan></app-scan>

        <div class="card">
          <h3>Admin Lists</h3>
          <button (click)="load('users')">Users</button>
          <button (click)="load('tickets')">Tickets</button>
          <button (click)="load('orders')">Orders</button>
          <button (click)="load('scans')">Scans</button>
          <pre *ngIf="adminResp()">{{ adminResp() | json }}</pre>
        </div>
      </div>
      `
    })
    export class AppComponent {
      #http = inject(HttpClient);

      regName = ''; regEmail = ''; regPass = '';
      logEmail = ''; logPass = '';
      buyEmail = ''; qty = 1;

      regResp = signal<any>(null);
      logResp = signal<any>(null);
      buyResp = signal<any>(null);
      adminResp = signal<any>(null);

      register() {
        this.#http.post(API + '/auth/register',
          { email: this.regEmail, password: this.regPass, name: this.regName },
          { withCredentials: true }).subscribe(r => this.regResp.set(r));
      }
      login() {
        this.#http.post(API + '/auth/login',
          { email: this.logEmail, password: this.logPass },
          { withCredentials: true }).subscribe(r => this.logResp.set(r));
      }
      refresh() {
        this.#http.post(API + '/auth/refresh', {}, { withCredentials: true }).subscribe(r => this.logResp.set(r));
      }
      logout() {
        this.#http.post(API + '/auth/logout', {}, { withCredentials: true }).subscribe(r => this.logResp.set(r));
      }
      purchase() {
        this.#http.post(API + '/tickets/purchase', { email: this.buyEmail, qty: this.qty }).subscribe(r => this.buyResp.set(r));
      }
      load(kind: 'users'|'tickets'|'orders'|'scans') {
        this.#http.get(API + '/admin/' + kind, { withCredentials: true }).subscribe(r => this.adminResp.set(r));
      }
    }
    """),
}

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")

def main():
    for rel, content in FILES.items():
        write_file(ROOT / rel, content)
    print(f"✔ Wrote/updated {len(FILES)} files under {ROOT.resolve()}")
    print("\nNext steps:")
    print("  1) cd ticketing-app")
    print("  2) cp .env.example .env  # add Google client ID/secret")
    print("  3) docker compose up --build")
    print("  4) Open http://localhost:8080 and MailHog at http://localhost:8025")

if __name__ == "__main__":
    main()
