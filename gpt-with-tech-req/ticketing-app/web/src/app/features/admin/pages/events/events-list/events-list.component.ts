// Admin > Events > List
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventsService } from '../../../../../core/services/events.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatFormField, MatInput } from '@angular/material/input';

type AnyEvent = {
  id: string;
  name?: string;
  title?: string;
  venue?: string;
  location?: string;
  starts_at?: string; // ISO
  start_date?: string;
  ends_at?: string;
  end_date?: string;
  status?: string; // DRAFT | PUBLISHED | ARCHIVED
};

@Component({
  selector: 'app-admin-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
})
export class AdminEventsListComponent implements OnInit, AfterViewInit, OnDestroy {
  columns = ['name', 'venue', 'starts', 'ends', 'status', 'actions'];
  dataSource = new MatTableDataSource<AnyEvent>([]);
  filter = '';
  sub?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private events: EventsService,
    private snack: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => {
      const v = (s: any) => String(s ?? '').toLowerCase();
      const f = filter.trim().toLowerCase();
      return (
        v(data.name || data.title).includes(f) ||
        v(data.venue || data.location).includes(f)
      );
    };
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.sub?.unsubscribe();
    this.sub = this.events.getAll().subscribe({
      next: (list: any[]) => (this.dataSource.data = list || []),
      error: () => this.snack.open('Failed to load events', 'Close', { duration: 3000 }),
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.filter;
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearFilter(): void {
    this.filter = '';
    this.applyFilter();
  }

  create(): void {
    this.router.navigate(['/admin/events/new']);
  }

  edit(id: string): void {
    this.router.navigate(['/admin/events', id]);
  }

  remove(e: AnyEvent): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: 'Delete Event',
        message: `Delete "${e.name || e.title}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.events.delete(e.id).subscribe({
        next: () => {
          this.snack.open('Event deleted', 'Close', { duration: 2500 });
          this.load();
        },
        error: () => this.snack.open('Failed to delete event', 'Close', { duration: 3000 }),
      });
    });
  }
}
