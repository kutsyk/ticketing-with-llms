// web/src/app/core/models/ticket.model.ts

export type TicketStatus =
  | 'ISSUED'
  | 'REDEEMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PENDING';

export interface Ticket {
  id: string;
  userId: string; // Owner of the ticket
  ticketTypeId: string;
  serial: string;
  qrToken: string;
  status: TicketStatus;
  deliveryEmail: string;
  purchaserName?: string;
  issuedAt: string; // ISO date
  expiresAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;

  // Optional relations
  ticketType?: {
    id: string;
    name: string;
    eventId: string;
  };
  event?: {
    id: string;
    name: string;
    startDate: string;
  };
}

export interface CreateTicketRequest {
  userId: string;
  ticketTypeId: string;
  deliveryEmail: string;
  purchaserName?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  deliveryEmail?: string;
  purchaserName?: string;
  expiresAt?: string;
}

export interface ValidateTicketRequest {
  qrToken: string;
}

export interface ValidateTicketResponse {
  valid: boolean;
  ticket?: Ticket;
  reason?: string;
}
