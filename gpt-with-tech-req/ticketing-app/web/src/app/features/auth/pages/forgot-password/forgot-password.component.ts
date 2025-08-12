// web/src/app/features/auth/pages/forgot-password/forgot-password.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email } = this.form.value;

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
        this.snackBar.open('If this email is registered, a reset link has been sent.', 'Close', {
          duration: 4000
        });
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error sending reset link. Please try again later.', 'Close', {
          duration: 4000
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
