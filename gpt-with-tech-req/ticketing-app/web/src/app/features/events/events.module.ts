// web/src/app/features/events/events.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material/material.module';
import { EventsRoutingModule } from './events-routing.module';
import { EventsListComponent } from './pages/list/events-list.component';
import { EventDetailComponent } from './pages/detail/event-detail.component';

@NgModule({
  declarations: [
    EventsListComponent,
    EventDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    EventsRoutingModule
  ]
})
export class EventsModule {}
