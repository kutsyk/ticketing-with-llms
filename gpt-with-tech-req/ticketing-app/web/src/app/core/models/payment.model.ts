// web/src/app/core/models/payment.model.ts

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'STRIPE'
  | 'PAYPAL';

export interface Payment {
  id: string;
  userId: string;
  ticketId?: string;
  amount: number; // Stored in smallest currency unit (e.g., cents)
  currency: string; // ISO 4217 currency code
  status: PaymentStatus;
  method: PaymentMethod;
  providerTransactionId?: string;
  description?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date

  // Relations
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  ticket?: {
    id: string;
    serial: string;
    status: string;
  };
}

export interface CreatePaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  description?: string;
  ticketId?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  providerTransactionId?: string;
  description?: string;
}

export interface RefundPaymentRequest {
  paymentId: string;
  reason?: string;
}

export interface RefundPaymentResponse {
  success: boolean;
  refundId?: string;
  error?: string;
}
