// web/src/app/shared/components/qr-scanner/qr-scanner.component.ts
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
})
export class QrScannerComponent implements OnInit {
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice?: MediaDeviceInfo;
  torchEnabled = false;

  constructor(private dialogRef: MatDialogRef<QrScannerComponent>) {}

  async ngOnInit(): Promise<void> {
    try {
      // Prompt for camera access so labels are available on some browsers
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      // Ignore; we’ll still try to list devices (may be empty/label-less without permission)
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter((d) => d.kind === 'videoinput');

      // Prefer back/environment camera on mobile if available
      const envCam =
        this.availableDevices.find((d) =>
          /back|rear|environment/i.test(d.label),
        ) || this.availableDevices[0];

      this.currentDevice = envCam;
    } catch (err) {
      console.error('Failed to enumerate cameras:', err);
      this.availableDevices = [];
      this.currentDevice = undefined;
    }
  }

  onCodeResult(result: string): void {
    if (result) {
      this.dialogRef.close(result); // return the scanned QR payload to opener
    }
  }

  deviceIndex(device: MediaDeviceInfo): number {
    return this.availableDevices.indexOf(device) + 1;
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
