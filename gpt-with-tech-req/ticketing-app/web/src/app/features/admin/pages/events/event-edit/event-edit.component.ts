// Admin > Events > Edit/Create
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventsService } from '../../../../../core/services/events.service';

function toISO(d: any): string | null {
  if (!d) return null;
  // If Date instance, convert to ISO; if string, trust it (assumed ISO)
  return d instanceof Date ? d.toISOString() : String(d);
}

@Component({
  selector: 'app-admin-event-edit',
  templateUrl: './event-edit.component.html',
  styleUrls: ['./event-edit.component.scss'],
})
export class AdminEventEditComponent implements OnInit {
  form!: FormGroup;
  id: string | null = null;
  isNew = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private events: EventsService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      venue: [''],
      starts_at: [null, Validators.required],
      ends_at: [null],
      timezone: ['Europe/Amsterdam'],
      status: ['DRAFT', Validators.required],
    });

    this.id = this.route.snapshot.paramMap.get('id');
    this.isNew = !this.id || this.id === 'new';

    if (!this.isNew && this.id) {
      this.events.getById(this.id).subscribe({
        next: (e: any) => {
          // Accept both snake_case and camelCase from API
          this.form.patchValue({
            name: e.name || e.title || '',
            description: e.description || '',
            venue: e.venue || e.location || '',
            starts_at: e.starts_at || e.start_date ? new Date(e.starts_at || e.start_date) : null,
            ends_at: e.ends_at || e.end_date ? new Date(e.ends_at || e.end_date) : null,
            timezone: e.timezone || 'Europe/Amsterdam',
            status: (e.status || 'DRAFT').toUpperCase(),
          });
        },
        error: () => this.snack.open('Failed to load event', 'Close', { duration: 3000 }),
      });
    }
  }

  back(): void {
    this.router.navigate(['/admin/events']);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const payload: any = {
      name: this.form.value.name,
      description: this.form.value.description || null,
      venue: this.form.value.venue || null,
      starts_at: toISO(this.form.value.starts_at),
      ends_at: toISO(this.form.value.ends_at),
      timezone: this.form.value.timezone || null,
      status: this.form.value.status,
    };

    const req$ = this.isNew
      ? this.events.create(payload)
      : this.events.update(this.id!, payload);

    req$.subscribe({
      next: () => {
        this.snack.open('Event saved', 'Close', { duration: 2500 });
        this.router.navigate(['/admin/events']);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Failed to save event', 'Close', { duration: 3500 });
        this.saving = false;
      },
    });
  }
}
