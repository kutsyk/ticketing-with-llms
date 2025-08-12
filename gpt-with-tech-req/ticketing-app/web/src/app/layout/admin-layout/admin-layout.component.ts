// web/src/app/layout/admin-layout/admin-layout.component.ts
import { Component } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { LoadingService } from '../../core/services/loading.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { FooterComponent } from 'src/app/shared/components/footer/footer.component';
import { SidebarComponent } from 'src/app/shared/components/sidebar/sidebar.component';
import { LoadingOverlayComponent } from 'src/app/shared/components/loading-overlay/loading-overlay.component';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
//   standalone: true,
//   imports: [    HeaderComponent, 
//     FooterComponent, 
//     SidebarComponent,
//     LoadingOverlayComponent,
//     RouterOutlet,
//     MatSidenavContent,
//     MatSidenavContainer,
//     MatSidenav
// ]
})
export class AdminLayoutComponent {
  pageTitle = '';
  loading$ = this.loadingService.isLoading$;

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
