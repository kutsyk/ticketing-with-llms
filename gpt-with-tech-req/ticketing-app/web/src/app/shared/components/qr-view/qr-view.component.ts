// web/src/app/shared/components/qr-view/qr-view.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-qr-view',
  templateUrl: './qr-view.component.html',
  styleUrls: ['./qr-view.component.scss']
})
export class QrViewComponent {
  /**
   * The value to encode into the QR code.
   */
  @Input() value: string | null = null;

  /**
   * Optional label to display under the QR code.
   */
  @Input() label: string | null = null;

  /**
   * Size of the QR code in pixels.
   */
  @Input() size = 200;
}
