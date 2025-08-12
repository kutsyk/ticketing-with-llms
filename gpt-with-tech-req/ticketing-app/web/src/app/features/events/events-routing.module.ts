// web/src/app/features/events/events-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventsListComponent } from './pages/list/events-list.component';
import { EventDetailComponent } from './pages/detail/event-detail.component';

const routes: Routes = [
  { path: '', component: EventsListComponent, data: { title: 'Events' } },
  { path: ':id', component: EventDetailComponent, data: { title: 'Event Details' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
