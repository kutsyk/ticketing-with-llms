// web/src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userRaw = localStorage.getItem(this.USER_KEY);
    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
      } catch {
        this.clearSession();
      }
    }
  }

  get currentUser(): any | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('/auth/login', { email, password })
      .pipe(
        tap((response) => {
          if (response.token) {
            this.setSession(response.token, response.user);
          }
        })
      );
  }

  register(data: {
    email: string;
    password?: string;
    name?: string;
  }): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/register', data).pipe(
      tap((response) => {
        if (response.token) {
          this.setSession(response.token, response.user);
        }
      })
    );
  }


  verifyEmail(token: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/api/verify-email`, { token });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/api/reset-password`, { token, newPassword });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.api.post<{ message: string }>(`/api/auth/forgot-password`, { email });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(token: string, user: any): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  refreshUser(): Observable<any> {
    return this.api.get<any>('/auth/me').pipe(
      tap((user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}
