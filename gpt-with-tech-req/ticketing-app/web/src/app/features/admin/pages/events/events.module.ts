// web/src/app/features/events/events.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminEventsRoutingModule } from './events-routing.module';
import { AdminEventsListComponent } from './events-list/events-list.component';
import { AdminEventEditComponent } from './event-edit/event-edit.component';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatError, MatLabel } from '@angular/material/form-field';
import { MatFormField } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatTable } from '@angular/material/table';

@NgModule({
  declarations: [AdminEventsListComponent, AdminEventEditComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatCardModule,
    MatOptionModule,
    MatDatepickerModule,
    MatError,
    AdminEventsRoutingModule,
    MatTable,
  ],
})
export class AdminEventsModule {}
