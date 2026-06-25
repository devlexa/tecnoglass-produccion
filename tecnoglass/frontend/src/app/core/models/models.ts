// ── Auth ────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  email: string;
  rol: string;
  expira: string;
}

// ── Orden de Producción ─────────────────────────────────────
export interface CrearOrdenRequest {
  codigo: string;
  descripcion?: string;
  cantidadVentanas: number;
}

export interface OrdenResumenDto {
  id: number;
  codigo: string;
  descripcion?: string;
  cantidadTotal: number;
  estado: string;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  ventanasCompletadas: number;
  porcentajeAvance: number;
}

export interface DistribucionEstacionDto {
  estacion: string;
  ordenEstacion: number;
  cantidadVentanas: number;
  porcentaje: number;
}

export interface OrdenDetalleDto {
  orden: OrdenResumenDto;
  distribucion: DistribucionEstacionDto[];
}

// ── Ventana / Trazabilidad ───────────────────────────────────
export interface MoverVentanaRequest {
  codigoQR: string;
}

export interface MoverVentanaResponse {
  exito: boolean;
  mensaje: string;
}

export interface VentanaDto {
  id: number;
  codigoQR: string;
  ordenProduccionId: number;
  estacionActual?: string;
  ordenEstacionActual?: number;
  estado: string;
  fechaCreacion: string;
}

export interface MovimientoDto {
  movimientoId: number;
  estacion: string;
  ordenEstacion: number;
  fechaIngreso: string;
  fechaSalida?: string;
  duracionMinutos?: number;
  registradoPor: string;
}

export interface HistorialVentanaDto {
  ventana: VentanaDto;
  movimientos: MovimientoDto[];
}

// ── Dashboard ────────────────────────────────────────────────
export interface DashboardDto {
  ordenesActivas: OrdenResumenDto[];
  distribucionGlobal: DistribucionEstacionDto[];
}
