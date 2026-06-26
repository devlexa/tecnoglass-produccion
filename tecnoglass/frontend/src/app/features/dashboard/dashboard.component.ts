import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterModule }              from '@angular/router';
import { DashboardService }          from '../../core/services/services';
import { DashboardDto }              from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <h1 class="page-title">Dashboard de Producción</h1>

      <ng-container *ngIf="!loading; else spinner">
        <section class="section">
          <h2 class="section-title">Distribución global de ventanas</h2>
          <div class="estaciones-grid">
            <div class="estacion-card" *ngFor="let e of data?.distribucionGlobal">
              <span class="est-orden">{{ e.ordenEstacion || '—' }}</span>
              <span class="est-nombre">{{ e.estacion }}</span>
              <span class="est-count">{{ e.cantidadVentanas }}</span>
              <span class="est-pct">{{ e.porcentaje | number:'1.1-1' }}%</span>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Órdenes activas</h2>
            <a routerLink="/produccion/nueva" class="btn-new">+ Nueva orden</a>
          </div>

          <div class="empty" *ngIf="!data?.ordenesActivas?.length">
            No hay órdenes activas en este momento.
          </div>

          <div class="orden-card" *ngFor="let o of data?.ordenesActivas">
            <div class="orden-info">
              <span class="orden-codigo">{{ o.codigo }}</span>
              <span class="orden-desc">{{ o.descripcion }}</span>
            </div>
            <div class="progreso-wrap">
              <div class="progreso-bar">
                <div class="progreso-fill" [style.width.%]="o.porcentajeAvance"></div>
              </div>
              <span class="progreso-pct">{{ o.porcentajeAvance | number:'1.0-1' }}%</span>
            </div>
            <div class="orden-meta">
              <span>{{ o.ventanasCompletadas }}/{{ o.cantidadTotal }} ventanas</span>
              <a [routerLink]="['/produccion', o.id]" class="link-detalle">Ver detalle →</a>
            </div>
          </div>
        </section>
      </ng-container>

      <ng-template #spinner>
        <div class="loading">Cargando datos...</div>
      </ng-template>

      <div class="error" *ngIf="errorMsg">{{ errorMsg }}</div>
    </div>
  `,
  styles: [`
    .page        { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a365d; margin-bottom: 28px; }
    .section     { margin-bottom: 36px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-title  { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
    .estaciones-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .estacion-card   { background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 10px;
                       padding: 20px 16px; text-align: center; }
    .est-orden  { display: block; font-size: 28px; font-weight: 700; color: #2b6cb0; }
    .est-nombre { display: block; font-size: 13px; color: #4a5568; margin: 4px 0; }
    .est-count  { display: block; font-size: 22px; font-weight: 600; color: #1a365d; }
    .est-pct    { display: block; font-size: 12px; color: #718096; }
    .orden-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
                  padding: 20px; margin-bottom: 12px; }
    .orden-info { margin-bottom: 12px; }
    .orden-codigo { font-size: 16px; font-weight: 700; color: #2d3748; margin-right: 12px; }
    .orden-desc   { font-size: 13px; color: #718096; }
    .progreso-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .progreso-bar  { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .progreso-fill { height: 100%; background: #38a169; border-radius: 4px; transition: width .4s; }
    .progreso-pct  { font-size: 13px; font-weight: 600; color: #38a169; min-width: 44px; }
    .orden-meta    { display: flex; justify-content: space-between; font-size: 13px; color: #718096; }
    .link-detalle  { color: #2b6cb0; text-decoration: none; font-weight: 500; }
    .btn-new { background: #2b6cb0; color: #fff; padding: 8px 16px; border-radius: 8px;
               text-decoration: none; font-size: 13px; font-weight: 600; }
    .loading { text-align: center; padding: 60px; color: #718096; }
    .empty   { text-align: center; padding: 40px; color: #a0aec0; }
    .error   { color: #e53e3e; font-size: 14px; text-align: center; }
  `]
})
export class DashboardComponent implements OnInit {
  private svc = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  data?: DashboardDto;
  loading  = true;
  errorMsg = '';

  ngOnInit(): void {
    this.svc.obtenerResumen().subscribe({
      next: data => {
        this.data = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'Error al cargar el dashboard.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}