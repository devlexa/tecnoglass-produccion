import { Component, inject }      from '@angular/core';
import { CommonModule }           from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router }                 from '@angular/router';
import { AuthService }            from '../../core/services/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-text">Tecnoglass</span>
          <span class="logo-sub">Producción de Ventanería</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Correo electrónico</label>
            <input type="email" formControlName="email" placeholder="usuario@tecnoglass.com">
            <span class="error" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              Ingrese un correo válido.
            </span>
          </div>

          <div class="field">
            <label>Contraseña</label>
            <input type="password" formControlName="password" placeholder="••••••••">
            <span class="error" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              Ingrese su contraseña.
            </span>
          </div>

          <span class="error" *ngIf="errorMsg">{{ errorMsg }}</span>

          <button type="submit" [disabled]="loading || form.invalid" class="btn-primary">
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f4f8;
    }
    .login-card {
      background: #fff;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }
    .login-logo { text-align: center; margin-bottom: 32px; }
    .logo-text  { display: block; font-size: 24px; font-weight: 700; color: #1a365d; }
    .logo-sub   { display: block; font-size: 13px; color: #718096; margin-top: 4px; }
    .field      { margin-bottom: 20px; }
    label       { display: block; font-size: 13px; font-weight: 500; color: #4a5568; margin-bottom: 6px; }
    input       { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0;
                  border-radius: 8px; font-size: 14px; box-sizing: border-box;
                  transition: border-color .2s; }
    input:focus { outline: none; border-color: #3182ce; }
    .error      { display: block; font-size: 12px; color: #e53e3e; margin-top: 4px; }
    .btn-primary {
      width: 100%; padding: 12px; background: #2b6cb0; color: #fff;
      border: none; border-radius: 8px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background .2s;
    }
    .btn-primary:hover:not(:disabled) { background: #2c5282; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading  = false;
  errorMsg = '';

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    this.auth.login(this.form.value as any).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: err => {
        this.errorMsg = err.error?.error ?? 'Error de autenticación.';
        this.loading  = false;
      }
    });
  }
}
