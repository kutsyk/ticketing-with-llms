// web/src/app/core/services/storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // ---- Token ----
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // ---- User (optional helper used by AuthService/UI) ----
  getUser<T = any>(): T | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  // ---- Clear all auth session data ----
  clearSession(): void {
    this.clearToken();
    this.clearUser();
  }
}
