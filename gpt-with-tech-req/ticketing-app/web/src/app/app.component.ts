import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';

type Role = 'USER' | 'SELLER' | 'CHECKER' | 'ADMIN';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Ticketing Platform';

  isLoggedIn = false;
  isAdmin = false;

  private sub?: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to auth state
    this.sub = this.auth.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.isAdmin = !!user && (user.role as Role) === 'ADMIN';
    });

    // Optionally, try to restore session on load (if your AuthService supports it)
    // this.auth.restoreSession()?.subscribe();
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      this.router.navigate(['/auth/login']);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
