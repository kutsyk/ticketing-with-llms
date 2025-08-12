// web/src/app/core/services/tickets.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Ticket {
  id: string;
  ticket_type_id: string;
  user_id?: string;
  serial: string;
  qr_token: string;
  status: 'ISSUED' | 'USED' | 'CANCELLED';
  delivery_email: string;
  purchaser_name?: string;
  issued_at?: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ValidateTicketResponse {
  valid: boolean;
  reason?: string;
  ticket?: Ticket;
}

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  constructor(private api: ApiService) {}

  /** ================= PUBLIC CHECKER ================= **/

  // Validate a ticket by QR token or serial
  validateTicket(payload: { qr_token?: string; serial?: string }): Observable<ValidateTicketResponse> {
    return this.api.post<ValidateTicketResponse>('/tickets/validate', payload);
  }

  /** ================= ADMIN ================= **/

  // List all tickets (admin view)
  getAll(): Observable<Ticket[]> {
    return this.api.get<Ticket[]>('/admin/tickets');
  }

  // Get a ticket by ID
  getById(id: string): Observable<Ticket> {
    return this.api.get<Ticket>(`/admin/tickets/${id}`);
  }

  // Issue a ticket (manually from admin panel or seller app)
  issueTicket(data: Partial<Ticket>): Observable<Ticket> {
    return this.api.post<Ticket>('/seller/issue', data);
  }

  // Resend ticket email
  resendEmail(id: string): Observable<void> {
    return this.api.post<void>(`/tickets/${id}/resend-email`, {});
  }

  // Update a ticket (status, purchaser, etc.)
  update(id: string, data: Partial<Ticket>): Observable<Ticket> {
    return this.api.put<Ticket>(`/admin/tickets/${id}`, data);
  }

  // Delete a ticket
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/tickets/${id}`);
  }
}
