import { Component, inject } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService }        from './core/services/services';
import { filter }             from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Nav solo cuando está autenticado y no en login -->
    <nav class="navbar" *ngIf="auth.isLoggedIn && !isLoginPage">
      <div class="nav-brand">Tecnoglass <span>Producción</span></div>
      <div class="nav-links">
        <a routerLink="/dashboard"     routerLinkActive="active">Dashboard</a>
        <a routerLink="/produccion"    routerLinkActive="active">Órdenes</a>
        <a routerLink="/trazabilidad"  routerLinkActive="active">Trazabilidad</a>
      </div>
      <div class="nav-user">
        <span>{{ auth.nombre }}</span>
        <button (click)="auth.logout()">Salir</button>
      </div>
    </nav>

    <main [class.with-nav]="auth.isLoggedIn && !isLoginPage">
      <router-outlet />
    </main>
  `,
  styles: [`
    .navbar      { display: flex; align-items: center; padding: 0 32px; height: 56px;
                   background: #1a365d; color: #fff; position: sticky; top: 0; z-index: 100; }
    .nav-brand   { font-size: 16px; font-weight: 700; margin-right: 40px; white-space: nowrap; }
    .nav-brand span { color: #63b3ed; }
    .nav-links   { display: flex; gap: 6px; flex: 1; }
    .nav-links a { color: #a0aec0; text-decoration: none; padding: 6px 14px; border-radius: 6px;
                   font-size: 14px; transition: all .15s; }
    .nav-links a:hover, .nav-links a.active { background: #2c5282; color: #fff; }
    .nav-user    { display: flex; align-items: center; gap: 12px; font-size: 13px; }
    .nav-user span { color: #a0aec0; }
    .nav-user button { padding: 6px 14px; background: transparent; border: 1px solid #4a5568;
                        color: #a0aec0; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .nav-user button:hover { background: #2d3748; }
    main         { min-height: 100vh; background: #f0f4f8; }
    main.with-nav { min-height: calc(100vh - 56px); }
  `]
})
export class AppComponent {
  auth       = inject(AuthService);
  private router = inject(Router);
  isLoginPage = false;

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.isLoginPage = e.url.includes('/login');
    });
  }
}
