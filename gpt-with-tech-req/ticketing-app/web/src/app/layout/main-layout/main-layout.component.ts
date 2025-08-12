// web/src/app/layout/main-layout/main-layout.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription, filter } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  pageTitle = 'Ticketing Platform';
  loading$: Observable<boolean>;

  private sub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loading: LoadingService
  ) {
    this.loading$ = this.loading.isLoading$;
  }

  ngOnInit(): void {
    // Update page title from deepest activated route data.title
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const deepest = this.getDeepestChild(this.route);
        const data = deepest.snapshot.data || {};
        this.pageTitle = data['title'] || 'Ticketing Platform';
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private getDeepestChild(r: ActivatedRoute): ActivatedRoute {
    let child = r;
    while (child.firstChild) {
      child = child.firstChild;
    }
    return child;
  }
}
