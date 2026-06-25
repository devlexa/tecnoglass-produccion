import { Routes }                from '@angular/router';
import { provideRouter }         from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig }     from '@angular/core';
import { authGuard, adminGuard } from './core/interceptors/jwt.interceptor';
import { jwtInterceptor }        from './core/interceptors/jwt.interceptor';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'produccion',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/produccion/lista-ordenes.component').then(m => m.ListaOrdenesComponent)
      },
      {
        path: 'nueva',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/produccion/crear-orden.component').then(m => m.CrearOrdenComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/produccion/detalle-orden.component').then(m => m.DetalleOrdenComponent)
      }
    ]
  },
  {
    path: 'trazabilidad',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trazabilidad/trazabilidad.component').then(m => m.TrazabilidadComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
