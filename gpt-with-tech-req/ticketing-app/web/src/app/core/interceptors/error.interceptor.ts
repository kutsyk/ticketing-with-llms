// web/src/app/core/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StorageService } from '../services/storage.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private storageService: StorageService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'An unknown error occurred';

        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 0) {
          errorMsg = 'API is unreachable. Please try again later.';
        } else {
          switch (error.status) {
            case 400:
              errorMsg = 'Bad request';
              break;
            case 401:
              errorMsg = 'Unauthorized. Please log in again.';
              this.storageService.clearToken();
              this.router.navigate(['/auth/login']);
              break;
            case 403:
              errorMsg = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMsg = 'The requested resource was not found.';
              break;
            case 500:
              errorMsg = 'A server error occurred. Please try again later.';
              break;
          }
        }

        // Show snackbar notification
        this.snackBar.open(errorMsg, 'Close', {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });

        return throwError(() => error);
      })
    );
  }
}
