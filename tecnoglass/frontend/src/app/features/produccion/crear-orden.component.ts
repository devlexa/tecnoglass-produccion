// ── Crear Orden Component ────────────────────────────────────
import { Component, inject }      from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule }   from '@angular/router';
import { ProduccionService }      from '../../core/services/services';

@Component({
  selector: 'app-crear-orden',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <a routerLink="/produccion" class="back">← Volver</a>
        <h1 class="page-title">Nueva Orden de Producción</h1>
      </div>

      <div class="card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Código de la orden *</label>
            <input formControlName="codigo" placeholder="Ej: OP-2026-001" uppercase>
          </div>

          <div class="field">
            <label>Descripción (opcional)</label>
            <input formControlName="descripcion" placeholder="Descripción del lote">
          </div>

          <div class="field">
            <label>Cantidad de ventanas *</label>
            <input type="number" formControlName="cantidadVentanas" min="1" placeholder="Ej: 100">
            <span class="hint">Se generará un QR único por cada ventana.</span>
          </div>

          <span class="error" *ngIf="errorMsg">{{ errorMsg }}</span>
          <span class="success" *ngIf="successMsg">{{ successMsg }}</span>

          <div class="form-actions">
            <a routerLink="/produccion" class="btn-cancel">Cancelar</a>
            <button type="submit" [disabled]="loading || form.invalid" class="btn-primary">
              {{ loading ? 'Creando...' : 'Crear Orden' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page       { padding: 32px; max-width: 600px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .back        { font-size: 13px; color: #2b6cb0; text-decoration: none; display: block; margin-bottom: 8px; }
    .page-title  { font-size: 22px; font-weight: 700; color: #1a365d; }
    .card        { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; }
    .field       { margin-bottom: 20px; }
    label        { display: block; font-size: 13px; font-weight: 500; color: #4a5568; margin-bottom: 6px; }
    input        { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
                   font-size: 14px; box-sizing: border-box; }
    input:focus  { outline: none; border-color: #3182ce; }
    .hint        { font-size: 12px; color: #a0aec0; margin-top: 4px; display: block; }
    .error       { color: #e53e3e; font-size: 13px; display: block; margin-bottom: 12px; }
    .success     { color: #38a169; font-size: 13px; display: block; margin-bottom: 12px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .btn-primary { padding: 10px 24px; background: #2b6cb0; color: #fff; border: none;
                   border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-cancel  { padding: 10px 24px; background: #e2e8f0; color: #4a5568; border-radius: 8px;
                   text-decoration: none; font-size: 14px; font-weight: 500; }
  `]
})
export class CrearOrdenComponent {
  private fb     = inject(FormBuilder);
  private svc    = inject(ProduccionService);
  private router = inject(Router);

  form = this.fb.group({
    codigo:           ['', [Validators.required, Validators.minLength(3)]],
    descripcion:      [''],
    cantidadVentanas: [null, [Validators.required, Validators.min(1)]]
  });

  loading    = false;
  errorMsg   = '';
  successMsg = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true; this.errorMsg = '';

    this.svc.crearOrden(this.form.value as any).subscribe({
      next: orden => {
        this.successMsg = `Orden ${orden.codigo} creada con ${orden.cantidadTotal} ventanas.`;
        setTimeout(() => this.router.navigate(['/produccion', orden.id]), 1500);
      },
      error: err => {
        this.errorMsg = err.error?.error ?? 'Error al crear la orden.';
        this.loading  = false;
      }
    });
  }
}
