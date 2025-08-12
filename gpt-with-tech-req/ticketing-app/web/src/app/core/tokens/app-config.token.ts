// web/src/app/core/tokens/app-config.token.ts

import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string; // Base URL for the API, e.g., http://localhost:3000/api
  stripePublicKey?: string; // Stripe public key for client-side payments
  appName: string; // Application name for display
  defaultLanguage: string; // Default i18n language
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
