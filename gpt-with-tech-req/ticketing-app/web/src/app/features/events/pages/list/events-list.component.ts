// web/src/app/features/events/pages/list/events-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { EventsService } from '../../../../core/services/events.service';
import { Event } from 'src/app/core/models/event.model';


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
