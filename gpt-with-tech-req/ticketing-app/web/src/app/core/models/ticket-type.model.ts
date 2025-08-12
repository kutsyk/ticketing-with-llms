// web/src/app/core/models/ticket-type.model.ts

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number; // Stored in smallest currency unit (e.g., cents)
  currency: string; // e.g., "USD"
  quantityTotal: number;
  quantitySold: number;
  salesStart?: string; // ISO date
  salesEnd?: string;   // ISO date
  isActive: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface CreateTicketTypeRequest {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantityTotal: number;
  salesStart?: string;
  salesEnd?: string;
  isActive?: boolean;
}

export interface UpdateTicketTypeRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  quantityTotal?: number;
  salesStart?: string;
  salesEnd?: string;
  isActive?: boolean;
}
