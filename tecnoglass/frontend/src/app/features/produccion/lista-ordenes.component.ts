import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
            <th>Total</th>
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
            <td><span class="badge" [class]="o.estado">{{ o.estado }}</span></td>
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
  private cdr = inject(ChangeDetectorRef);

  ordenes: OrdenResumenDto[] = [];
  loading = true;

  ngOnInit(): void {
    this.svc.listarActivas().subscribe({
      next: data => {
        this.ordenes = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}