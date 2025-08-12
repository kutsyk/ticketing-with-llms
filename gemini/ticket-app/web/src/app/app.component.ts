import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService, User } from './auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatInputModule, MatFormFieldModule, MatButtonModule, RouterModule, MatCardModule],
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