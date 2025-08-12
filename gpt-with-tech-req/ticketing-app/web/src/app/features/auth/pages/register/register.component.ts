// web/src/app/features/auth/pages/register/register.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get passwordsDoNotMatch(): boolean {
    const pass = this.password?.value;
    const confirm = this.confirmPassword?.value;
    return pass && confirm && pass !== confirm;
  }

  onSubmit() {
    if (this.registerForm.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.loading = true;
    const { email, password } = this.registerForm.value;

    this.authService.register(email, password).subscribe({
      next: () => {
        this.snackBar.open('Registration successful! Please check your email to verify your account.', 'Close', {
          duration: 5000
        });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(err?.error?.message || 'Registration failed', 'Close', {
          duration: 5000
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
