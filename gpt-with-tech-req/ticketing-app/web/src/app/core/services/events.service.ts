// web/src/app/core/services/events.service.ts
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiEvent, Event, mapApiEvent } from '../models/event.model';
import { Paginated } from '../models/util.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private api: ApiService) {}

  // List all events
  getAll(): Observable<Event[]> {
    return this.api.get<Paginated<ApiEvent>>('/events').pipe(map(res => res.items.map(mapApiEvent))
    );
  }

  // Get a single event by ID
  getById(id: string): Observable<Event> {
    return this.api.get<Event>(`/events/${id}`);
  }

  // Create a new event
  create(data: Partial<Event>): Observable<Event> {
    return this.api.post<Event>('/events', data);
  }

  // Update an event
  update(id: string, data: Partial<Event>): Observable<Event> {
    return this.api.put<Event>(`/events/${id}`, data);
  }

  // Delete an event
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/events/${id}`);
  }
}
