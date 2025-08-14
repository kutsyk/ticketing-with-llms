// web/src/app/features/admin/pages/dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { UsersService } from '../../../../core/services/users.service';
import { EventsService } from '../../../../core/services/events.service';
import { TicketsService } from '../../../../core/services/tickets.service';
import { PaymentsService } from '../../../../core/services/payments.service';
import { ScansService } from '../../../../core/services/scans.service';
import { AuditLogsService } from '../../../../core/services/audit-logs.service';

type KPIs = {
  users: number;
  events: number;
  ticketsSold: number;
  revenueCents: number;
};

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  kpis$!: Observable<KPIs>;
  recentPayments$!: Observable<any[]>;
  recentScans$!: Observable<any[]>;
  recentAuditLogs$!: Observable<any[]>;

  paymentColumns = ['created_at', 'user_email', 'amount', 'status'];
  scanColumns = ['scanned_at', 'ticket_serial', 'result'];
  auditColumns = ['created_at', 'action', 'entity', 'actor'];

  constructor(
    private usersService: UsersService,
    private eventsService: EventsService,
    private ticketsService: TicketsService,
    private paymentsService: PaymentsService,
    private scansService: ScansService,
    private auditLogsService: AuditLogsService
  ) {}

  ngOnInit(): void {
    // KPIs
    this.kpis$ = this.loadKPIs();

    // Recent Payments (top 10 newest)
    this.recentPayments$ = this.paymentsService.getAll().pipe(
      map((list) =>
        (list || [])
          .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
          .slice(0, 10)
      )
    );

    // Recent Scans (top 10 newest)
    this.recentScans$ = this.scansService.getAllLogs().pipe(
      map((list) =>
        (list || [])
          .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime())
          .slice(0, 10)
      )
    );

    // Recent Audit Logs (top 10 newest)
    this.recentAuditLogs$ = this.auditLogsService.getLogs().pipe(
      map((list) =>
        (list || [])
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
      )
    );
  }

  private loadKPIs(): Observable<KPIs> {
    // Pull minimal data and compute KPIs client-side.
    // If your API has dedicated /admin/dashboard, switch to it for efficiency.
    return this.usersService.getAll().pipe(
      switchMap((users) =>
        this.eventsService.getAll().pipe(
          switchMap((events) =>
            this.ticketsService.getAll().pipe(
              switchMap((tickets) =>
                this.paymentsService.getAll().pipe(
                  map((payments) => {
                    const usersCount = users?.length || 0;
                    const eventsCount = events?.length || 0;
                    const ticketsSold = tickets?.length || 0;
                    const revenueCents = (payments || [])
                      .filter((p: any) => p.status === 'SUCCEEDED' || p.status === 'PAID' || p.status === 'COMPLETED')
                      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

                    return {
                      users: usersCount,
                      events: eventsCount,
                      ticketsSold,
                      revenueCents,
                    } as KPIs;
                  })
                )
              )
            )
          )
        )
      )
    );
  }
}
