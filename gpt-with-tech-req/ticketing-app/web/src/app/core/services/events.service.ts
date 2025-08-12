// web/src/app/core/services/events.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string;
  start_date: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private api: ApiService) {}

  // List all events
  getAll(): Observable<Event[]> {
    return this.api.get<Event[]>('/events');
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
