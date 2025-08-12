// web/src/app/core/services/payments.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Payment {
  id: string;
  user_id: string;
  ticket_id: string;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_id: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  created_at?: string;
  updated_at?: string;
}

export interface RefundResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  constructor(private api: ApiService) {}

  /** ================= ADMIN ================= **/

  // Get all payments
  getAll(): Observable<Payment[]> {
    return this.api.get<Payment[]>('/admin/payments');
  }

  // Get a payment by ID
  getById(id: string): Observable<Payment> {
    return this.api.get<Payment>(`/admin/payments/${id}`);
  }

  // Refund a payment
  refund(id: string): Observable<RefundResponse> {
    return this.api.post<RefundResponse>(`/admin/payments/${id}/refund`, {});
  }
}
