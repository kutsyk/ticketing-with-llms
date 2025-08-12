// web/src/app/features/auth/pages/reset-password/reset-password.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  token!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.snackBar.open('Invalid or missing password reset token.', 'Close', {
        duration: 3000,
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const { password } = this.form.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password has been reset successfully.', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.error?.message || 'Failed to reset password.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
