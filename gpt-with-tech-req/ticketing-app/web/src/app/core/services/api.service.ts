// web/src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpContext,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiList<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

type Query = Record<
  string,
  string | number | boolean | (string | number | boolean)[] | undefined | null
>;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = stripTrailingSlash(environment.apiBaseUrl);

  constructor(private http: HttpClient) {}

  // ---------- Generic HTTP helpers ----------

  get<T>(
    path: string,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
      responseType?: 'json';
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.get<T>(url, { params, headers, context: options.context });
  }

  post<T, B = unknown>(
    path: string,
    body?: B,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.post<T>(url, body ?? {}, { params, headers, context: options.context });
  }

  put<T, B = unknown>(
    path: string,
    body?: B,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.put<T>(url, body ?? {}, { params, headers, context: options.context });
  }

  patch<T, B = unknown>(
    path: string,
    body?: B,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.patch<T>(url, body ?? {}, { params, headers, context: options.context });
  }

  delete<T>(
    path: string,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.delete<T>(url, { params, headers, context: options.context });
  }

  // ---------- Specialized helpers ----------

  /**
   * Download a file (e.g., CSV export) as Blob.
   */
  download(
    path: string,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<Blob> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.get(url, {
      params,
      headers,
      responseType: 'blob',
      context: options.context,
    });
  }

  /**
   * Upload a file with multipart/form-data.
   */
  upload<T>(
    path: string,
    formData: FormData,
    options: {
      query?: Query;
      headers?: HttpHeaders | Record<string, string>;
      context?: HttpContext;
    } = {}
  ): Observable<T> {
    const url = this.url(path);
    const params = toHttpParams(options.query);
    const headers = toHttpHeaders(options.headers);
    return this.http.post<T>(url, formData, { params, headers, context: options.context });
  }

  /**
   * Build absolute API URL from a relative path.
   * Accepts paths with or without leading slash.
   */
  url(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${p}`;
  }
}

// ---------- helpers ----------

function stripTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function toHttpHeaders(
  headers?: HttpHeaders | Record<string, string>
): HttpHeaders | undefined {
  if (!headers) return undefined;
  return headers instanceof HttpHeaders ? headers : new HttpHeaders(headers);
}

function toHttpParams(query?: Query): HttpParams | undefined {
  if (!query) return undefined;
  let params = new HttpParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          params = params.append(key, String(v));
        }
      });
    } else {
      params = params.set(key, String(value));
    }
  });
  return params;
}
