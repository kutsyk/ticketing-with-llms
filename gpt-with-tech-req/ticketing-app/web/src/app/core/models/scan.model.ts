// web/src/app/core/models/scan.model.ts

export type ScanStatus =
  | 'VALID'
  | 'INVALID'
  | 'EXPIRED'
  | 'ALREADY_USED'
  | 'ERROR';

export interface Scan {
  id: string;
  ticketId: string;
  eventId: string;
  scannedAt: string; // ISO date
  status: ScanStatus;
  location?: string;
  deviceId?: string;

  // Relations
  ticket?: {
    id: string;
    serial: string;
    status: string;
  };
  event?: {
    id: string;
    name: string;
    date: string;
  };
  scannedBy?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export interface CreateScanRequest {
  ticketId: string;
  eventId: string;
  location?: string;
  deviceId?: string;
}

export interface CreateScanResponse {
  success: boolean;
  status: ScanStatus;
  message?: string;
  ticket?: {
    serial: string;
    purchaserName?: string;
    status: string;
    expiresAt?: string;
  };
}
