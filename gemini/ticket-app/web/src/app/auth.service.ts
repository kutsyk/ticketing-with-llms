import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'OPERATOR' | 'ADMINISTRATOR';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject: BehaviorSubject<User | null>;
  public user: Observable<User | null>;
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient, private router: Router) {
    this.userSubject = new BehaviorSubject<User | null>(JSON.parse(localStorage.getItem('user')!));
    this.user = this.userSubject.asObservable();
  }

  public get userValue(): User | null {
    return this.userSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        map(user => {
          localStorage.setItem('user', JSON.stringify(user));
          this.userSubject.next(user);
          return user;
        }),
        catchError(err => {
          // Handle login error
          return throwError(err);
        })
      );
  }

  logout() {
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  register(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/register`, { email, password })
      .pipe(
        catchError(err => {
          // Handle registration error
          return throwError(err);
        })
      );
  }

  isAdmin(): boolean | null {
    const user = this.userValue;
    return user && user.role === 'ADMINISTRATOR';
  }

  isOperator(): boolean | null {
    const user = this.userValue;
    return user && user.role === 'OPERATOR';
  }
}