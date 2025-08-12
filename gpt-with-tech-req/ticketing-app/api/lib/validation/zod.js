// lib/validation/zod.js
// Centralized Zod validation schemas for all API endpoints
// Ensures consistent request body, query, and param validation

import { z } from 'zod';

/**
 * Common reusable schema parts
 */
export const idSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Invalid email address' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password is too long' });

export const roleSchema = z.enum(['USER', 'SELLER', 'CHECKER', 'ADMIN']);

export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

/**
 * Auth schemas
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1, { message: 'Name is required' }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' }),
});

export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
  password: passwordSchema,
});

/**
 * User update schema (Admin & self-update)
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().trim().optional(),
  role: roleSchema.optional(),
  avatar_url: z.string().url().optional(),
  email_verified_at: dateSchema.nullable().optional(),
  password: passwordSchema.optional(),
});

/**
 * Event schemas
 */
export const createEventSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }),
  description: z.string().trim().optional(),
  start_date: dateSchema,
  end_date: dateSchema,
  location: z.string().trim().min(1, { message: 'Location is required' }),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  image_url: z.string().url().optional(),
});

export const updateEventSchema = createEventSchema.partial();

/**
 * Ticket schemas
 */
export const issueTicketSchema = z.object({
  event_id: idSchema,
  user_id: idSchema,
  status: z.enum(['ISSUED', 'USED', 'REVOKED', 'REFUNDED']).default('ISSUED'),
});

export const updateTicketSchema = z.object({
  status: z.enum(['ISSUED', 'USED', 'REVOKED', 'REFUNDED']).optional(),
});

/**
 * Query params schema for pagination and search
 */
export const paginationQuerySchema = z.object({
  q: z.string().optional(),
  role: roleSchema.optional(),
  status: z.string().optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .transform(Number)
    .default('20'),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .transform(Number)
    .default('0'),
});

/**
 * Utility to validate requests inside controllers
 */
export function validateSchema(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    const err = new Error('Validation failed');
    err.statusCode = 400;
    err.details = errors;
    throw err;
  }
  return result.data;
}

export default {
  idSchema,
  emailSchema,
  passwordSchema,
  roleSchema,
  dateSchema,
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  updateUserSchema,
  createEventSchema,
  updateEventSchema,
  issueTicketSchema,
  updateTicketSchema,
  paginationQuerySchema,
  validateSchema,
};
