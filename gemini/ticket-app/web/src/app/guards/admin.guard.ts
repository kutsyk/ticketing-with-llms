import { CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  // Add your administrator role checking logic here
  return true;
};