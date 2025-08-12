// web/src/app/core/config/app-config.ts

import { AppConfig } from '../tokens/app-config.token';
import { environment } from '../../../environments/environment';

export const APP_CONFIG_VALUE: AppConfig = {
  apiBaseUrl: environment.apiBaseUrl || 'http://localhost:3000/api',
  stripePublicKey: '',
  appName: 'Ticketing Platform',
  defaultLanguage: 'en'
};
