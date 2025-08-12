// web/src/app/core/models/event.model.ts

export interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  imageUrl?: string;
  isPublished?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  imageUrl?: string;
  isPublished?: boolean;
}
