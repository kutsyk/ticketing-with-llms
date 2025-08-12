// web/src/app/features/events/pages/list/events-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Event, EventsService } from '../../../../core/services/events.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
})
export class EventsListComponent implements OnInit {
  events$!: Observable<Event[]>;

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    this.events$ = this.eventsService.getAll();
  }
}
