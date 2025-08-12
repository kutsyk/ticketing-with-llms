// web/src/app/core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    const expectedRoles = route.data['roles'] as string[];
    const user = this.authService.getCurrentUser();

    if (!user || !expectedRoles.includes(user.role)) {
      // If no access, redirect to forbidden page or dashboard
      return this.router.createUrlTree(['/forbidden']);
    }

    return true;
  }
}
