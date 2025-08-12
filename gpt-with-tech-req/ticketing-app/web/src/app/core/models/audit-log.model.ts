// web/src/app/core/models/audit-log.model.ts

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_DELETED'
  | 'TICKET_SCANNED'
  | 'PAYMENT_PROCESSED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ROLE_CHANGED'
  | 'EXPORT_GENERATED'
  | 'SYSTEM_ERROR'
  | 'OTHER';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: string; // e.g., "User", "Event", "Ticket"
  entityId?: string; // ID of the entity affected
  performedBy?: {
    id: string;
    email: string;
    fullName?: string;
  };
  performedAt: string; // ISO date string
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilter {
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  performedById?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}
