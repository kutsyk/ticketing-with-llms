// web/src/app/core/services/ticket-types.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity_available: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TicketTypesService {
  constructor(private api: ApiService) {}

  // List all ticket types for an event
  getAllForEvent(eventId: string): Observable<TicketType[]> {
    return this.api.get<TicketType[]>(`/ticket-types/${eventId}`);
  }

  // Get a single ticket type by ID
  getById(id: string): Observable<TicketType> {
    return this.api.get<TicketType>(`/admin/ticket-types/${id}`);
  }

  // Create a ticket type for an event
  create(data: Partial<TicketType>): Observable<TicketType> {
    return this.api.post<TicketType>('/admin/ticket-types', data);
  }

  // Update a ticket type
  update(id: string, data: Partial<TicketType>): Observable<TicketType> {
    return this.api.put<TicketType>(`/admin/ticket-types/${id}`, data);
  }

  // Delete a ticket type
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/ticket-types/${id}`);
  }
}
