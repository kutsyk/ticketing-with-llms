// web/src/app/core/services/audit-logs.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AuditLog {
  id: string;
  action: string;
  user_id: string | null;
  user_email?: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilters {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogsService {
  constructor(private api: ApiService) {}

  /**
   * Get all audit logs with optional filtering
   */
  getLogs(filters?: AuditLogFilters): Observable<AuditLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.api.get<AuditLog[]>(`/admin/audit-logs${query}`);
  }

  /**
   * Get details of a single audit log by ID
   */
  getLogById(id: string): Observable<AuditLog> {
    return this.api.get<AuditLog>(`/admin/audit-logs/${id}`);
  }
}
