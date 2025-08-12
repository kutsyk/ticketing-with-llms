// web/src/app/core/services/users.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private api: ApiService) {}

  // List all users (admin only)
  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/admin/users');
  }

  // Get a single user by ID
  getById(id: string): Observable<User> {
    return this.api.get<User>(`/admin/users/${id}`);
  }

  // Create a new user
  create(data: Partial<User> & { password?: string }): Observable<User> {
    return this.api.post<User>('/admin/users', data);
  }

  // Update an existing user
  update(id: string, data: Partial<User>): Observable<User> {
    return this.api.put<User>(`/admin/users/${id}`, data);
  }

  // Delete a user
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/users/${id}`);
  }
}
