// web/src/app/core/services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingMap = new Map<string, boolean>();
  private _isLoading$ = new BehaviorSubject<boolean>(false);

  isLoading$ = this._isLoading$.asObservable();

  setLoading(loading: boolean, url: string): void {
    if (loading) {
      this.loadingMap.set(url, true);
    } else {
      this.loadingMap.delete(url);
    }
    this._isLoading$.next(this.loadingMap.size > 0);
  }
}
