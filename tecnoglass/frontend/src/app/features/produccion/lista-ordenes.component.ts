// ── Lista Ordenes Component ──────────────────────────────────
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { RouterModule }               from '@angular/router';
import { ProduccionService }          from '../../core/services/services';
import { OrdenResumenDto }            from '../../core/models/models';

@Component({
  selector: 'app-lista-ordenes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Órdenes de Producción</h1>
        <a routerLink="/produccion/nueva" class="btn-new">+ Nueva orden</a>
      </div>

      <div class="loading" *ngIf="loading">Cargando órdenes...</div>

      <table class="tabla" *ngIf="!loading && ordenes.length">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descripción</th>
            <th>Total ventanas</th>
            <th>Estado</th>
            <th>Avance</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let o of ordenes">
            <td><strong>{{ o.codigo }}</strong></td>
            <td>{{ o.descripcion || '—' }}</td>
            <td>{{ o.cantidadTotal }}</td>
            <td><span class="badge" [class]="badgeClass(o.estado)">{{ o.estado }}</span></td>
            <td>
              <div class="mini-bar">
                <div class="mini-fill" [style.width.%]="o.porcentajeAvance"></div>
              </div>
              {{ o.porcentajeAvance | number:'1.0-1' }}%
            </td>
            <td>{{ o.fechaCreacion | date:'dd/MM/yyyy' }}</td>
            <td><a [routerLink]="['/produccion', o.id]" class="link">Ver →</a></td>
          </tr>
        </tbody>
      </table>

      <div class="empty" *ngIf="!loading && !ordenes.length">
        No hay órdenes activas. <a routerLink="/produccion/nueva">Crear una nueva</a>.
      </div>
    </div>
  `,
  styles: [`
    .page        { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a365d; }
    .btn-new     { background: #2b6cb0; color: #fff; padding: 10px 20px; border-radius: 8px;
                   text-decoration: none; font-size: 13px; font-weight: 600; }
    .tabla       { width: 100%; border-collapse: collapse; background: #fff;
                   border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    th           { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600;
                   color: #718096; background: #f7fafc; border-bottom: 1px solid #e2e8f0; }
    td           { padding: 14px 16px; font-size: 14px; color: #2d3748; border-bottom: 1px solid #f0f4f8; }
    .badge       { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .ACTIVA      { background: #c6f6d5; color: #276749; }
    .COMPLETADA  { background: #bee3f8; color: #2c5282; }
    .CANCELADA   { background: #fed7d7; color: #9b2c2c; }
    .mini-bar    { display: inline-block; width: 80px; height: 6px; background: #e2e8f0;
                   border-radius: 3px; overflow: hidden; vertical-align: middle; margin-right: 6px; }
    .mini-fill   { height: 100%; background: #38a169; }
    .link        { color: #2b6cb0; text-decoration: none; font-weight: 500; }
    .loading, .empty { text-align: center; padding: 60px; color: #a0aec0; }
    .empty a     { color: #2b6cb0; }
  `]
})
export class ListaOrdenesComponent implements OnInit {
  private svc = inject(ProduccionService);

  ordenes: OrdenResumenDto[] = [];
  loading = true;

  ngOnInit(): void {
    this.svc.listarActivas().subscribe({
      next:  data => { this.ordenes = data; this.loading = false; },
      error: ()   => this.loading = false
    });
  }

  badgeClass(estado: string): string { return estado; }
}


// ── Detalle Orden Component ──────────────────────────────────
import { Component, OnInit }          from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrdenDetalleDto }            from '../../core/models/models';

@Component({
  selector: 'app-detalle-orden',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <a routerLink="/produccion" class="back">← Volver a órdenes</a>

      <ng-container *ngIf="detalle">
        <div class="cabecera">
          <h1>{{ detalle.orden.codigo }}</h1>
          <span class="badge" [class]="detalle.orden.estado">{{ detalle.orden.estado }}</span>
        </div>
        <p class="desc">{{ detalle.orden.descripcion }}</p>

        <!-- Barra de progreso global -->
        <div class="progreso-section">
          <span class="progreso-label">Avance global</span>
          <div class="progreso-bar">
            <div class="progreso-fill" [style.width.%]="detalle.orden.porcentajeAvance"></div>
          </div>
          <strong>{{ detalle.orden.porcentajeAvance | number:'1.1-1' }}%</strong>
          <span class="meta">{{ detalle.orden.ventanasCompletadas }}/{{ detalle.orden.cantidadTotal }} ventanas empacadas</span>
        </div>

        <!-- Distribución por estación -->
        <h2>Distribución por estación</h2>
        <div class="dist-grid">
          <div class="dist-card" *ngFor="let d of detalle.distribucion">
            <span class="dist-est">{{ d.estacion }}</span>
            <span class="dist-n">{{ d.cantidadVentanas }}</span>
            <span class="dist-pct">{{ d.porcentaje | number:'1.1-1' }}%</span>
          </div>
        </div>
      </ng-container>

      <div class="loading" *ngIf="loading">Cargando detalle...</div>
    </div>
  `,
  styles: [`
    .page        { padding: 32px; max-width: 900px; margin: 0 auto; }
    .back        { font-size: 13px; color: #2b6cb0; text-decoration: none; display: block; margin-bottom: 16px; }
    .cabecera    { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    h1           { font-size: 24px; font-weight: 700; color: #1a365d; margin: 0; }
    .desc        { color: #718096; font-size: 14px; margin-bottom: 28px; }
    .badge       { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .ACTIVA      { background: #c6f6d5; color: #276749; }
    .COMPLETADA  { background: #bee3f8; color: #2c5282; }
    .progreso-section { display: flex; align-items: center; gap: 12px; margin-bottom: 32px;
                        background: #f7fafc; border-radius: 10px; padding: 16px 20px; }
    .progreso-label   { font-size: 13px; color: #4a5568; white-space: nowrap; }
    .progreso-bar     { flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; }
    .progreso-fill    { height: 100%; background: #38a169; transition: width .4s; }
    .meta        { font-size: 12px; color: #a0aec0; white-space: nowrap; }
    h2           { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
    .dist-grid   { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
    .dist-card   { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
                   padding: 20px; text-align: center; }
    .dist-est    { display: block; font-size: 13px; color: #4a5568; margin-bottom: 8px; }
    .dist-n      { display: block; font-size: 28px; font-weight: 700; color: #2b6cb0; }
    .dist-pct    { display: block; font-size: 12px; color: #a0aec0; }
    .loading     { text-align: center; padding: 60px; color: #a0aec0; }
  `]
})
export class DetalleOrdenComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc   = inject(ProduccionService);

  detalle?: OrdenDetalleDto;
  loading = true;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.obtenerDetalle(id).subscribe({
      next:  data => { this.detalle = data; this.loading = false; },
      error: ()   => this.loading = false
    });
  }
}
