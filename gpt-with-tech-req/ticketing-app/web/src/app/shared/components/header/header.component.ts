// web/src/app/shared/components/header/header.component.ts

import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { MatIcon } from '@angular/material/icon';
import { MatMenu } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  // standalone: true,
  // imports: [MatIcon, MatMenu, MatToolbar, CommonModule]
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();

  user$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.currentUser$;
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  logout(): void {
    this.authService.logout();
  }
}
