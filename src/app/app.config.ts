import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  LOCALE_ID
} from '@angular/core';
import {provideRouter} from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt, 'pt-BR');

import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
};
