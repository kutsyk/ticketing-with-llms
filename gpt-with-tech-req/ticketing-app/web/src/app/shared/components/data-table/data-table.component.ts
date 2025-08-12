// web/src/app/shared/components/data-table/data-table.component.ts
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T extends Record<string, any>>
  implements OnChanges, AfterViewInit
{
  /**
   * Table title (shown above the table)
   */
  @Input() title = '';

  /**
   * Raw data array
   */
  @Input() data: T[] = [];

  /**
   * Columns to display (excluding 'actions', which is appended automatically when showActions=true)
   * Example: ['email', 'name', 'role']
   */
  @Input() displayedColumns: string[] = [];

  /**
   * Show action column with edit/delete buttons
   */
  @Input() showActions = true;

  /**
   * Show "Add New" button in the header
   */
  @Input() showAddButton = true;

  /**
   * Optional initial filter value
   */
  @Input() filterValue = '';

  /**
   * Emits when user clicks "Add New"
   */
  @Output() onAdd = new EventEmitter<void>();

  /**
   * Emits the row element when user clicks edit
   */
  @Output() onEdit = new EventEmitter<T>();

  /**
   * Emits the row element when user clicks delete
   */
  @Output() onDelete = new EventEmitter<T>();

  dataSource = new MatTableDataSource<T>([]);
  allColumns: string[] = [];

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['displayedColumns'] || changes['showActions']) {
      this.setupColumns();
      this.refreshDataSource();
    }
    if (changes['filterValue']) {
      this.applyFilter(this.filterValue);
    }
  }

  ngAfterViewInit(): void {
    // hook up paginator and sort when available
    this.attachPaginatorAndSort();
  }

  /**
   * Recompute column list including actions if enabled
   */
  private setupColumns(): void {
    this.allColumns = this.showActions
      ? [...this.displayedColumns, 'actions']
      : [...this.displayedColumns];
  }

  /**
   * (Re)initialize data source
   */
  private refreshDataSource(): void {
    this.dataSource = new MatTableDataSource<T>(this.data || []);
    this.dataSource.filterPredicate = this.defaultFilterPredicate;
    this.dataSource.paginator = this.paginator || null!;
    this.dataSource.sort = this.sort || null!;
    if (this.filterValue) this.applyFilter(this.filterValue);
  }

  /**
   * Attach paginator and sort after view init or when they appear later
   */
  private attachPaginatorAndSort(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator || null!;
      this.dataSource.sort = this.sort || null!;
    }
  }

  /**
   * Default case-insensitive filter across all primitive fields
   */
  private defaultFilterPredicate = (data: T, filter: string): boolean => {
    const f = filter.trim().toLowerCase();
    return Object.values(data).some((val) =>
      String(val ?? '').toLowerCase().includes(f),
    );
  };

  applyFilter(value: string): void {
    this.filterValue = value;
    this.dataSource.filter = value?.trim().toLowerCase() || '';
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  trackByIndex = (_: number, __: any) => _;

  // Action handlers called by template buttons
  editRow(row: T): void {
    this.onEdit.emit(row);
  }

  deleteRow(row: T): void {
    this.onDelete.emit(row);
  }
}
