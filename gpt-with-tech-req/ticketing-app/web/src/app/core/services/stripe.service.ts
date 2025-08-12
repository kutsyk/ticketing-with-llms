// web/src/app/core/services/stripe.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CheckoutSessionRequest {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  id: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class StripeService {
  constructor(private api: ApiService) {}

  /**
   * Create a Stripe Checkout session for the selected tickets
   */
  createCheckoutSession(
    request: CheckoutSessionRequest
  ): Observable<CheckoutSessionResponse> {
    return this.api.post<CheckoutSessionResponse>('/checkout/session', request);
  }

  /**
   * Handle the Stripe webhook from the server (for testing only)
   * This is just for admin testing - usually Stripe calls the server directly
   */
  triggerWebhook(payload: any): Observable<any> {
    return this.api.post<any>('/checkout/webhook', payload);
  }
}
