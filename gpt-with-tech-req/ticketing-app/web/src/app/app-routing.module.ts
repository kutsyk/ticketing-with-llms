// web/src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

// RBAC roles must match backend: USER | SELLER | CHECKER | ADMIN
type Role = 'USER' | 'SELLER' | 'CHECKER' | 'ADMIN';

const routes: Routes = [
  // Public landing -> redirect to events
  { path: '', pathMatch: 'full', redirectTo: 'events' },

  // Auth (public)
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule),
    data: { title: 'Auth' },
  },

  // Events (public listing + details)
  {
    path: 'events',
    loadChildren: () =>
      import('./features/events/events.module').then((m) => m.EventsModule),
    data: { title: 'Events' },
  },

  // Checkout (requires login to complete purchase)
  {
    path: 'checkout',
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    loadChildren: () =>
      import('./features/checkout/checkout.module').then(
        (m) => m.CheckoutModule,
      ),
    data: { title: 'Checkout' },
  },

  // Profile (requires USER+)
  {
    path: 'profile',
    canActivate: [AuthGuard],
    canLoad: [AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile.module').then(
        (m) => m.ProfileModule,
      ),
    data: { title: 'My Profile', roles: ['USER', 'SELLER', 'CHECKER', 'ADMIN'] as Role[] },
  },

  // Seller (SELLER or ADMIN)
  {
    path: 'seller',
    canActivate: [AuthGuard, RoleGuard],
    canLoad: [AuthGuard, RoleGuard],
    loadChildren: () =>
      import('./features/seller/seller.module').then((m) => m.SellerModule),
    data: { title: 'Seller', roles: ['SELLER', 'ADMIN'] as Role[] },
  },

  // Checker (CHECKER or ADMIN)
  {
    path: 'checker',
    canActivate: [AuthGuard, RoleGuard],
    canLoad: [AuthGuard, RoleGuard],
    loadChildren: () =>
      import('./features/checker/checker.module').then(
        (m) => m.CheckerModule,
      ),
    data: { title: 'Checker', roles: ['CHECKER', 'ADMIN'] as Role[] },
  },

  // Admin (ADMIN only)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    canLoad: [AuthGuard, RoleGuard],
    loadChildren: () =>
      import('./features/admin/admin.module').then((m) => m.AdminModule),
    data: { title: 'Admin', roles: ['ADMIN'] as Role[] },
  },

  // Fallback
  { path: '**', redirectTo: 'events' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
      paramsInheritanceStrategy: 'always',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
