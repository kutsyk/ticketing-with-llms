// web/src/app/features/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'], title: 'Admin Dashboard' },
    children: [
      { path: '', pathMatch: 'full', component: AdminDashboardComponent },

      // Child feature sections (lazy-loaded). Keep names consistent with your feature folders.
      // { path: 'users', loadChildren: () => import('./pages/users/users.module').then(m => m.UsersModule), data: { title: 'Users' } },
      { path: 'events', loadChildren: () => import('./pages/events/events.module').then(m => m.AdminEventsModule), data: { title: 'Events' } },
      // { path: 'ticket-types', loadChildren: () => import('./pages/ticket-types/ticket-types.module').then(m => m.TicketTypesModule), data: { title: 'Ticket Types' } },
      // { path: 'tickets', loadChildren: () => import('./pages/tickets/tickets.module').then(m => m.AdminTicketsModule), data: { title: 'Tickets' } },
      // { path: 'payments', loadChildren: () => import('./pages/payments/payments.module').then(m => m.PaymentsModule), data: { title: 'Payments' } },
      // { path: 'scans', loadChildren: () => import('./pages/scans/scans.module').then(m => m.ScansModule), data: { title: 'Scans' } },
      // { path: 'audit-logs', loadChildren: () => import('./pages/audit-logs/audit-logs.module').then(m => m.AuditLogsModule), data: { title: 'Audit Logs' } },
      // { path: 'exports', loadChildren: () => import('./pages/exports/exports.module').then(m => m.ExportsModule), data: { title: 'Exports' } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
