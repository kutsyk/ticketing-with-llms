// web/src/app/shared/components/loading-overlay/loading-overlay.component.ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent {
  // Emits true when there are active HTTP requests
  isLoading$: Observable<boolean>;

  constructor(private loading: LoadingService) {
    this.isLoading$ = this.loading.isLoading$;
  }
}
