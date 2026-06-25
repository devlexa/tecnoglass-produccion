import { Component, inject }      from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { VentanaService }         from '../../core/services/services';
import { HistorialVentanaDto }    from '../../core/models/models';

@Component({
  selector: 'app-trazabilidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Trazabilidad de Ventanas</h1>

      <!-- Panel de búsqueda / acción -->
      <div class="panel">
        <div class="search-row">
          <input
            [(ngModel)]="codigoQR"
            placeholder="Pegar o escanear código QR (UUID)..."
            class="qr-input"
            (keyup.enter)="buscar()"
          >
          <button class="btn-buscar" (click)="buscar()" [disabled]="!codigoQR">
            Consultar historial
          </button>
          <button class="btn-mover" (click)="moverVentana()" [disabled]="!codigoQR || loadingMover">
            {{ loadingMover ? 'Moviendo...' : '▶ Mover a siguiente estación' }}
          </button>
        </div>

        <div class="alert success" *ngIf="mensajeMover">{{ mensajeMover }}</div>
        <div class="alert error"   *ngIf="errorMsg">{{ errorMsg }}</div>
      </div>

      <!-- Historial de la ventana -->
      <ng-container *ngIf="historial">
        <div class="ventana-info">
          <div class="info-row">
            <span class="label">Código QR</span>
            <span class="value mono">{{ historial.ventana.codigoQR }}</span>
          </div>
          <div class="info-row">
            <span class="label">Estación actual</span>
            <span class="value">{{ historial.ventana.estacionActual ?? 'Sin ingresar a línea' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Estado</span>
            <span class="badge" [class]="historial.ventana.estado">{{ historial.ventana.estado }}</span>
          </div>
        </div>

        <h2>Historial de movimientos</h2>

        <div class="empty" *ngIf="!historial.movimientos?.length">
          Esta ventana aún no ha sido movida a ninguna estación.
        </div>

        <div class="timeline" *ngIf="historial.movimientos?.length">
          <div class="evento" *ngFor="let m of historial.movimientos">
            <div class="evento-dot" [class.completado]="m.fechaSalida"></div>
            <div class="evento-body">
              <div class="evento-est">{{ m.estacion }}</div>
              <div class="evento-meta">
                Ingreso: {{ m.fechaIngreso | date:'dd/MM/yyyy HH:mm' }}
                <span *ngIf="m.fechaSalida">
                  · Salida: {{ m.fechaSalida | date:'dd/MM/yyyy HH:mm' }}
                  · {{ m.duracionMinutos }} min
                </span>
                <span *ngIf="!m.fechaSalida" class="en-curso">· En curso</span>
              </div>
              <div class="evento-op">Registrado por: {{ m.registradoPor }}</div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page        { padding: 32px; max-width: 860px; margin: 0 auto; }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a365d; margin-bottom: 24px; }
    .panel       { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
                   padding: 24px; margin-bottom: 28px; }
    .search-row  { display: flex; gap: 10px; flex-wrap: wrap; }
    .qr-input    { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
                   font-size: 14px; min-width: 200px; }
    .qr-input:focus { outline: none; border-color: #3182ce; }
    .btn-buscar  { padding: 10px 18px; background: #edf2f7; color: #4a5568; border: 1px solid #e2e8f0;
                   border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; }
    .btn-mover   { padding: 10px 18px; background: #2b6cb0; color: #fff; border: none;
                   border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn-mover:disabled, .btn-buscar:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert       { margin-top: 14px; padding: 10px 16px; border-radius: 8px; font-size: 13px; }
    .alert.success { background: #c6f6d5; color: #276749; }
    .alert.error   { background: #fed7d7; color: #9b2c2c; }

    .ventana-info { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px;
                    padding: 20px; margin-bottom: 28px; }
    .info-row   { display: flex; align-items: center; gap: 16px; margin-bottom: 10px; }
    .info-row:last-child { margin-bottom: 0; }
    .label      { font-size: 12px; font-weight: 600; color: #718096; width: 120px; }
    .value      { font-size: 14px; color: #2d3748; }
    .mono       { font-family: monospace; font-size: 12px; }

    .badge        { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .EN_PROCESO   { background: #fefcbf; color: #744210; }
    .COMPLETADA   { background: #c6f6d5; color: #276749; }

    h2           { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
    .empty       { color: #a0aec0; font-size: 14px; padding: 20px 0; }

    .timeline    { position: relative; padding-left: 28px; }
    .timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0;
                         width: 2px; background: #e2e8f0; }
    .evento      { position: relative; margin-bottom: 20px; }
    .evento-dot  { position: absolute; left: -24px; top: 4px; width: 12px; height: 12px;
                   border-radius: 50%; background: #cbd5e0; border: 2px solid #fff;
                   box-shadow: 0 0 0 2px #e2e8f0; }
    .evento-dot.completado { background: #38a169; }
    .evento-body { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .evento-est  { font-size: 15px; font-weight: 600; color: #2d3748; margin-bottom: 6px; }
    .evento-meta { font-size: 12px; color: #718096; }
    .evento-op   { font-size: 12px; color: #a0aec0; margin-top: 4px; }
    .en-curso    { color: #d69e2e; font-weight: 600; }
  `]
})
export class TrazabilidadComponent {
  private svc = inject(VentanaService);

  codigoQR     = '';
  historial?: HistorialVentanaDto;
  errorMsg     = '';
  mensajeMover = '';
  loadingMover = false;

  buscar(): void {
    if (!this.codigoQR.trim()) return;
    this.errorMsg = ''; this.mensajeMover = '';

    this.svc.obtenerHistorial(this.codigoQR.trim()).subscribe({
      next:  data  => { this.historial = data; },
      error: err   => { this.errorMsg = err.error?.error ?? 'Ventana no encontrada.'; this.historial = undefined; }
    });
  }

  moverVentana(): void {
    if (!this.codigoQR.trim()) return;
    this.loadingMover = true; this.errorMsg = ''; this.mensajeMover = '';

    this.svc.moverVentana({ codigoQR: this.codigoQR.trim() }).subscribe({
      next: res => {
        this.mensajeMover = res.mensaje;
        this.loadingMover = false;
        this.buscar(); // recargar historial
      },
      error: err => {
        this.errorMsg    = err.error?.error ?? 'Error al mover la ventana.';
        this.loadingMover = false;
      }
    });
  }
}
