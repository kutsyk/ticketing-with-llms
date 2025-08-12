// web/src/app/features/auth/services/oauth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OauthService {
  private baseUrl = '/api/auth/oauth';

  constructor(private http: HttpClient) {}

  /**
   * Get Google OAuth URL
   */
  getGoogleAuthUrl(redirectUri: string): Observable<{ url: string }> {
    const params = new HttpParams().set('redirectUri', redirectUri);
    return this.http.get<{ url: string }>(`${this.baseUrl}/google/start`, { params });
  }

  /**
   * Handle OAuth callback with code and state
   */
  handleGoogleCallback(code: string, state: string): Observable<any> {
    const body = { code, state };
    return this.http.post(`${this.baseUrl}/google/callback`, body);
  }
}
