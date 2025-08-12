### `ticket-app/web/src/app/auth.service.ts`

```typescript
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

  login(email, password) {
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

  register(email, password) {
    return this.http.post<any>(`${this.apiUrl}/register`, { email, password })
      .pipe(
        catchError(err => {
          // Handle registration error
          return throwError(err);
        })
      );
  }

  isAdmin() {
    const user = this.userValue;
    return user && user.role === 'ADMINISTRATOR';
  }

  isOperator() {
    const user = this.userValue;
    return user && user.role === 'OPERATOR';
  }
}
```

-----

### `ticket-app/web/src/app/app.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService, User } from './auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  user: User | null = null;
  isAdmin: boolean = false;
  isOperator: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.user.subscribe(user => {
      this.user = user;
      this.isAdmin = this.authService.isAdmin();
      this.isOperator = this.authService.isOperator();
    });
  }

  logout() {
    this.authService.logout();
  }
}
```

-----

### `ticket-app/web/src/app/login/login.component.ts`

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" required>
            </mat-form-field>
            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" required>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid">Login</button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
        .subscribe(
          () => this.router.navigate(['/profile']),
          error => console.error(error)
        );
    }
  }
}
```

-----

### `ticket-app/web/src/app/profile/profile.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-container">
      <mat-card *ngIf="user">
        <mat-card-header>
          <mat-card-title>My Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Role:</strong> {{ user.role }}</p>
          </mat-card-content>
      </mat-card>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.userValue;
  }
}
```

-----

### `ticket-app/web/src/app/admin-dashboard/admin-dashboard.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-dashboard-container">
      <h2>Admin Dashboard</h2>
      <mat-tab-group>
        <mat-tab label="Users">
          <mat-table [dataSource]="usersDataSource">
            <ng-container matColumnDef="email">
              <mat-header-cell *matHeaderCellDef> Email </mat-header-cell>
              <mat-cell *matCellDef="let user"> {{user.email}} </mat-cell>
            </ng-container>
            <ng-container matColumnDef="role">
              <mat-header-cell *matHeaderCellDef> Role </mat-header-cell>
              <mat-cell *matCellDef="let user"> {{user.role}} </mat-cell>
            </ng-container>
            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef> Actions </mat-header-cell>
              <mat-cell *matCellDef="let user">
                <button mat-icon-button color="warn" (click)="deleteUser(user.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="['email', 'role', 'actions']"></mat-header-row>
            <mat-row *matRowDef="let row; columns: ['email', 'role', 'actions'];"></mat-row>
          </mat-table>
        </mat-tab>

        <mat-tab label="Tickets">
          </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  usersDataSource = new MatTableDataSource<any>();

  constructor() {}

  ngOnInit() {
    // Fetch users data from the API and populate the table
  }

  deleteUser(userId: string) {
    // Call API to delete user
  }
}
```

-----

### `ticket-app/web/src/app/operator-dashboard/operator-dashboard.component.ts`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-operator-dashboard',
  template: `
    <div class="operator-dashboard-container">
      <h2>Operator Dashboard</h2>
      <p>This page is for selling, refunding, and scanning tickets.</p>
    </div>
  `
})
export class OperatorDashboardComponent {}
```

-----

### `ticket-app/web/src/app/register/register.component.ts`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  template: `
    <div class="register-container">
      <h2>Registration</h2>
      <p>Registration form goes here.</p>
    </div>
  `
})
export class RegisterComponent {}
```