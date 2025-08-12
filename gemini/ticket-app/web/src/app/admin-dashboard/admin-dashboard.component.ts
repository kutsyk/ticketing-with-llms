import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
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