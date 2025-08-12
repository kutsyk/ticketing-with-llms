import { CanActivateFn } from '@angular/router';

export const operatorGuard: CanActivateFn = (route, state) => {
  // Add your operator role checking logic here
  return true;
};