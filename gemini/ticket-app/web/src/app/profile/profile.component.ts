import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="profile-container">
      <mat-card *ngIf="user">
        <mat-card-header>
          <mat-card-title>My Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Email:</strong> {{ user?.email }}</p>
          <p><strong>Role:</strong> {{ user?.role }}</p>
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