import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  LoginRequest, LoginResponse,
  CrearOrdenRequest, OrdenResumenDto, OrdenDetalleDto,
  MoverVentanaRequest, MoverVentanaResponse, HistorialVentanaDto,
  DashboardDto
} from '../models/models';

const API = 'http://localhost:5000/api';

// ── Auth Service ─────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, req).pipe(
      tap(res => {
        localStorage.setItem('token',  res.token);
        localStorage.setItem('nombre', res.nombre);
        localStorage.setItem('rol',    res.rol);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  get token(): string | null      { return localStorage.getItem('token');  }
  get nombre(): string | null     { return localStorage.getItem('nombre'); }
  get rol(): string | null        { return localStorage.getItem('rol');    }
  get isLoggedIn(): boolean       { return !!this.token; }
  get isAdmin(): boolean          { return this.rol === 'Administrador'; }
}

// ── Producción Service ────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private http = inject(HttpClient);

  crearOrden(req: CrearOrdenRequest): Observable<OrdenResumenDto> {
    return this.http.post<OrdenResumenDto>(`${API}/ordenes`, req);
  }

  listarActivas(): Observable<OrdenResumenDto[]> {
    return this.http.get<OrdenResumenDto[]>(`${API}/ordenes`);
  }

  obtenerDetalle(id: number): Observable<OrdenDetalleDto> {
    return this.http.get<OrdenDetalleDto>(`${API}/ordenes/${id}`);
  }
}

// ── Ventana Service ───────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class VentanaService {
  private http = inject(HttpClient);

  moverVentana(req: MoverVentanaRequest): Observable<MoverVentanaResponse> {
    return this.http.post<MoverVentanaResponse>(`${API}/ventanas/mover`, req);
  }

  obtenerHistorial(codigoQR: string): Observable<HistorialVentanaDto> {
    return this.http.get<HistorialVentanaDto>(`${API}/ventanas/${codigoQR}/historial`);
  }
}

// ── Dashboard Service ─────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  obtenerResumen(): Observable<DashboardDto> {
    return this.http.get<DashboardDto>(`${API}/dashboard`);
  }
}
