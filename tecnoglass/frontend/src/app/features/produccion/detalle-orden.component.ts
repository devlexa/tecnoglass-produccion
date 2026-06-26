import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProduccionService }          from '../../core/services/services';
import { OrdenDetalleDto }            from '../../core/models/models';

@Component({
  selector: 'app-detalle-orden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <a routerLink="/produccion" class="back">← Volver a órdenes</a>

      <div *ngIf="!loading && detalle">
        <div class="cabecera">
          <h1>{{ detalle.orden.codigo }}</h1>
          <span class="badge" [class]="detalle.orden.estado">{{ detalle.orden.estado }}</span>
        </div>
        <p class="desc">{{ detalle.orden.descripcion }}</p>

        <div class="progreso-section">
          <span class="progreso-label">Avance global</span>
          <div class="progreso-bar">
            <div class="progreso-fill" [style.width.%]="detalle.orden.porcentajeAvance"></div>
          </div>
          <strong>{{ detalle.orden.porcentajeAvance | number:'1.1-1' }}%</strong>
          <span class="meta">{{ detalle.orden.ventanasCompletadas }}/{{ detalle.orden.cantidadTotal }} empacadas</span>
        </div>

        <h2>Distribución por estación</h2>
        <div class="dist-grid">
          <div class="dist-card" *ngFor="let d of detalle.distribucion">
            <span class="dist-est">{{ d.estacion }}</span>
            <span class="dist-n">{{ d.cantidadVentanas }}</span>
            <span class="dist-pct">{{ d.porcentaje | number:'1.1-1' }}%</span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">Cargando detalle...</div>
      <div class="error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .page         { padding: 32px; max-width: 900px; margin: 0 auto; }
    .back         { font-size: 13px; color: #2b6cb0; text-decoration: none; display: block; margin-bottom: 16px; }
    .cabecera     { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    h1            { font-size: 24px; font-weight: 700; color: #1a365d; margin: 0; }
    .desc         { color: #718096; font-size: 14px; margin-bottom: 28px; }
    .badge        { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .ACTIVA       { background: #c6f6d5; color: #276749; }
    .COMPLETADA   { background: #bee3f8; color: #2c5282; }
    .progreso-section { display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
                        background: #f7fafc; border-radius: 10px; padding: 16px 20px; flex-wrap: wrap; }
    .progreso-label   { font-size: 13px; color: #4a5568; white-space: nowrap; }
    .progreso-bar     { flex: 1; min-width: 100px; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
    .progreso-fill    { height: 100%; background: #38a169; transition: width .4s; }
    .meta         { font-size: 12px; color: #a0aec0; white-space: nowrap; }
    h2            { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
    .dist-grid    { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .dist-card    { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; }
    .dist-est     { display: block; font-size: 13px; color: #4a5568; margin-bottom: 8px; }
    .dist-n       { display: block; font-size: 28px; font-weight: 700; color: #2b6cb0; }
    .dist-pct     { display: block; font-size: 12px; color: #a0aec0; }
    .loading, .error { text-align: center; padding: 60px; color: #a0aec0; }
  `]
})
export class DetalleOrdenComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProduccionService);
  private cdr   = inject(ChangeDetectorRef);

  detalle?: OrdenDetalleDto;
  loading = true;
  error   = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.obtenerDetalle(id).subscribe({
      next: data => {
        this.detalle = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'No se pudo cargar el detalle.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}