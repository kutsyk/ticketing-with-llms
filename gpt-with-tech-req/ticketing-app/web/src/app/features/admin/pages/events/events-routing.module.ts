// web/src/app/features/events/events-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminEventsListComponent } from './events-list/events-list.component';
import { AdminEventEditComponent } from './event-edit/event-edit.component';

const routes: Routes = [
  { path: '', component: AdminEventsListComponent, data: { title: 'Events' } },
  { path: ':id', component: AdminEventEditComponent, data: { title: 'Event Details' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminEventsRoutingModule {}
