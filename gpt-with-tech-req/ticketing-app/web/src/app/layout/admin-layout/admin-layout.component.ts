// web/src/app/layout/admin-layout/admin-layout.component.ts
import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  pageTitle = '';
  loading$ = this.loadingService.loading$;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loadingService: LoadingService
  ) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          return child?.snapshot.data['title'] || 'Admin Dashboard';
        })
      )
      .subscribe((title: string) => {
        this.pageTitle = title;
      });
  }
}
