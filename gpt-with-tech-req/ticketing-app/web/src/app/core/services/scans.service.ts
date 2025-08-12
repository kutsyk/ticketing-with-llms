// web/src/app/core/services/scans.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ScanLog {
  id: string;
  ticket_id: string;
  checker_id: string;
  scanned_at: string;
  result: 'VALID' | 'INVALID' | 'EXPIRED';
}

export interface TicketValidationRequest {
  qr_token: string;
}

export interface TicketValidationResponse {
  valid: boolean;
  ticket_id?: string;
  event_name?: string;
  purchaser_name?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ScansService {
  constructor(private api: ApiService) {}

  /** ================= ADMIN ================= **/

  // Get all scan logs
  getAllLogs(): Observable<ScanLog[]> {
    return this.api.get<ScanLog[]>('/admin/scans');
  }

  // Get scan logs for a specific ticket
  getLogsByTicket(ticketId: string): Observable<ScanLog[]> {
    return this.api.get<ScanLog[]>(`/admin/scans?ticketId=${ticketId}`);
  }

  /** ================= CHECKER ================= **/

  // Validate ticket by QR token
  validateTicket(data: TicketValidationRequest): Observable<TicketValidationResponse> {
    return this.api.post<TicketValidationResponse>('/checker/validate', data);
  }
}
