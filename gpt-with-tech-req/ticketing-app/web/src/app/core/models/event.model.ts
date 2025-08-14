// web/src/app/core/models/event.model.ts

export interface ApiEvent {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  starts_at: string;
  ends_at?: string;
  timezone?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Your UI model (what the app uses)
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

// adapter: API → UI model
export function mapApiEvent(e: ApiEvent): Event {
  return {
    id: e.id,
    name: e.name,
    description: e.description,
    location: e.venue,           // map venue → location
    start_date: e.starts_at,     // map starts_at → start_date
    end_date: e.ends_at,         // map ends_at → end_date
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
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
