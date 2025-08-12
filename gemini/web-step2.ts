### `ticket-app/web/src/app/register/register.component.ts`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `
    <div class="register-container">
      <h2>Registration</h2>
      <p>Registration form goes here.</p>
    </div>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {}
```

### `ticket-app/web/src/app/guards/auth.guard.ts`

```typescript
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // Add your authentication logic here
  return true;
};
```

### `ticket-app/web/src/app/guards/admin.guard.ts`

```typescript
import { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  // Add your administrator role checking logic here
  return true;
};
```

### `ticket-app/web/src/app/guards/operator.guard.ts`

```typescript
import { CanActivateFn } from '@angular/router';

export const operatorGuard: CanActivateFn = (route, state) => {
  // Add your operator role checking logic here
  return true;
};
```

#### **Updated Code for Existing Files**

### `ticket-app/web/src/app/app.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, User } from './auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatButtonModule, RouterModule],
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
      this.isAdmin = this.authService.isAdmin() ?? false;
      this.isOperator = this.authService.isOperator() ?? false;
    });
  }

  logout() {
    this.authService.logout();
  }
}
```

### `ticket-app/web/src/app/app.component.scss`

```scss
/* Add your styles here */
```

### `ticket-app/web/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { OperatorDashboardComponent } from './operator-dashboard/operator-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { operatorGuard } from './guards/operator.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'operator', component: OperatorDashboardComponent, canActivate: [operatorGuard] },
  { path: '', redirectTo: '/profile', pathMatch: 'full' },
  { path: '**', redirectTo: '/profile' }
];
```

### `ticket-app/web/src/app/login/login.component.ts`

```typescript
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
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

### `ticket-app/web/src/app/login/login.component.scss`

```scss
/* Add your styles here */
```
