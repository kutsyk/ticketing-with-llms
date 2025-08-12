// web/src/app/features/auth/pages/verify-email/verify-email.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.verifyEmail(token).subscribe({
        next: () => {
          this.verified = true;
          this.loading = false;
        },
        error: () => {
          this.verified = false;
          this.loading = false;
        }
      });
    } else {
      this.verified = false;
      this.loading = false;
    }
  }
}
