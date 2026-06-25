import { inject }            from '@angular/core';
import { HttpInterceptorFn }  from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService }        from '../services/services';

// ── JWT Interceptor ──────────────────────────────────────────
// Adjunta automáticamente el token JWT a cada petición HTTP
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.token;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// ── Auth Guard ───────────────────────────────────────────────
// Protege rutas que requieren autenticación
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn) return true;

  router.navigate(['/login']);
  return false;
};

// ── Admin Guard ──────────────────────────────────────────────
// Protege rutas exclusivas de Administrador
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin) return true;

  router.navigate(['/dashboard']);
  return false;
};
