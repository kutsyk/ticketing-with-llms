// web/src/app/core/models/user.model.ts

export type UserRole = 'ADMIN' | 'SELLER' | 'CHECKER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phone?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
