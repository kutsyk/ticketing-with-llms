// web/src/app/core/models/event.model.ts

export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}
