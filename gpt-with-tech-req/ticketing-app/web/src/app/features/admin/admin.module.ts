// web/src/app/features/admin/admin.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { MatTable, MatTableModule } from '@angular/material/table';

// Shared + Material
import { MaterialModule } from '../../shared/material/material.module';

// Angular forms & http (for charts that may need async pipes, etc.)
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular common pipes
import { DatePipe, CurrencyPipe } from '@angular/common';

@NgModule({
  declarations: [
    AdminDashboardComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    AdminRoutingModule,
    MatTable,
  ],
  providers: [DatePipe, CurrencyPipe],
})
export class AdminModule {}
