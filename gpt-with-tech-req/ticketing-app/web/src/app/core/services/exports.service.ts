// web/src/app/core/services/exports.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ExportRequest {
  type: 'users' | 'events' | 'tickets' | 'ticket-types' | 'payments' | 'scans' | 'audit-logs';
  format: 'csv' | 'xlsx';
  filters?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class ExportsService {
  constructor(private api: ApiService) {}

  /**
   * Trigger an export and return a Blob for download
   */
  exportData(request: ExportRequest): Observable<Blob> {
    const params = new URLSearchParams();
    params.append('type', request.type);
    params.append('format', request.format);

    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';

    return this.api.get<Blob>(`/admin/exports${query}`, {
      responseType: 'blob' as 'json', // Ensures Angular treats the response as binary
    });
  }

  /**
   * Helper to download the file directly from the browser
   */
  downloadExport(request: ExportRequest, fileName: string): void {
    this.exportData(request).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  }
}
