# Tecnoglass — Sistema de Producción de Ventanería

Sistema Fullstack para la digitalización y trazabilidad de la línea de producción de ventanería de Tecnoglass / Energía Solar S.A.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 17 (standalone components, signals-ready) |
| Backend | ASP.NET Core 8 Web API |
| ORM | Dapper (invocación directa de SPs) |
| Base de datos | Microsoft SQL Server 2019+ |
| Autenticación | JWT Bearer tokens |
| Hashing | BCrypt.Net-Next |

---

## Estructura del repositorio

```
tecnoglass-produccion/
├── backend/
│   ├── API/
│   │   ├── Controllers/     # AuthController, OrdenProduccionController, VentanaController, DashboardController
│   │   ├── Program.cs       # DI, JWT, CORS, Swagger
│   │   └── appsettings.json
│   ├── Application/
│   │   ├── DTOs/            # Records de entrada/salida de la API
│   │   ├── Interfaces/      # Contratos de servicios
│   │   └── Services/        # Implementaciones: Auth, Orden, Ventana, Dashboard
│   ├── Domain/
│   │   └── Entities/        # Entidades de dominio
│   ├── Infrastructure/
│   │   └── Data/            # DbContext (Dapper) + Repositories
│   └── Tecnoglass.csproj
├── frontend/
│   └── src/app/
│       ├── core/            # Models, Services, Guards, Interceptor JWT
│       ├── features/
│       │   ├── auth/        # LoginComponent
│       │   ├── dashboard/   # DashboardComponent
│       │   ├── produccion/  # ListaOrdenes, CrearOrden, DetalleOrden
│       │   └── trazabilidad/# TrazabilidadComponent (historial + mover ventana)
│       ├── app.component.ts # Shell con navbar
│       └── app.routes.ts    # Rutas lazy-loaded + guards
├── database/
│   ├── 01_DDL.sql           # Tablas, constraints, índices
│   ├── 02_SPs.sql           # 4 Stored Procedures
│   └── 03_seed.sql          # Datos iniciales (roles, estaciones, usuario admin)
└── README.md
```

---

## Requisitos previos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) y Angular CLI (`npm install -g @angular/cli`)
- [SQL Server 2019+](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (o SQL Server Express)
- [SQL Server Management Studio](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) (opcional pero recomendado)

---

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/tecnoglass-produccion.git
cd tecnoglass-produccion
```

---

### 2. Base de datos

Abrir SSMS o cualquier cliente SQL Server y ejecutar los scripts **en orden**:

```sql
-- Paso 1: Crear base de datos y tablas
-- Ejecutar: database/01_DDL.sql

-- Paso 2: Crear Stored Procedures
-- Ejecutar: database/02_SPs.sql

-- Paso 3: Insertar datos iniciales
-- Ejecutar: database/03_seed.sql
```

> **Nota sobre contraseñas:** El seed inserta usuarios con un placeholder de BCrypt.
> Para generar el hash real, ejecutar el backend una vez y usar el endpoint `/api/auth/login`
> con cualquier password; o bien usar la herramienta online [bcrypt-generator.com](https://bcrypt-generator.com)
> (rounds = 11) y actualizar manualmente:
>
> ```sql
> UPDATE dbo.Usuario
> SET PasswordHash = '$2a$11$TU_HASH_AQUI'
> WHERE Email = 'admin@tecnoglass.com';
> ```
>
> La contraseña por defecto para pruebas es: `Admin123!`

---

### 3. Backend (ASP.NET Core 8)

#### 3.1 Configurar appsettings.json

Editar `backend/API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=TecnoglassDB;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Secret": "UNA_CLAVE_SECRETA_DE_AL_MENOS_32_CARACTERES_AQUI",
    "Issuer": "tecnoglass",
    "Audience": "tecnoglass-app"
  }
}
```

> Si usas autenticación de Windows en lugar de SQL login:
> `"Default": "Server=localhost;Database=TecnoglassDB;Integrated Security=True;TrustServerCertificate=True;"`

#### 3.2 Restaurar dependencias y ejecutar

```bash
cd backend
dotnet restore
dotnet run --project API
```

La API estará disponible en `http://localhost:5000`.
Swagger UI: `http://localhost:5000/swagger`

---

### 4. Frontend (Angular 17)

```bash
cd frontend
npm install
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

---

## Flujo operativo del sistema

```
Orden de producción
       │
       ▼
  [Lote de ventanas generadas — cada una con GUID + QR]
       │
       ▼
  1. Corte  →  2. Troquel  →  3. Ensamble  →  4. Empaque ✓
                                                     │
                                          Ventana marcada COMPLETADA
                                                     │
                                          Si 100% completadas → Orden COMPLETADA automáticamente
```

### Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Autenticación (retorna JWT) |
| `GET` | `/api/dashboard` | KPIs globales del dashboard |
| `GET` | `/api/ordenes` | Lista órdenes activas |
| `POST` | `/api/ordenes` | Crear nueva orden de producción |
| `GET` | `/api/ordenes/{id}` | Detalle de una orden |
| `POST` | `/api/ventanas/mover` | Mover ventana a la siguiente estación (escaneo QR) |
| `GET` | `/api/ventanas/{qr}/historial` | Historial completo de una ventana |

---

## Características de seguridad y calidad

- **JWT Bearer tokens** con expiración de 8 horas y validación estricta.
- **Control de concurrencia** en `sp_MoverVentana` con `WITH (UPDLOCK, ROWLOCK)` para evitar doble movimiento simultáneo.
- **Transacciones explícitas** en todos los SPs con `SET XACT_ABORT ON` y rollback en catch.
- **Auditoría** de cada movimiento en tabla `AuditoriaAccion`.
- **Validación de secuencia** en el SP: una ventana no puede saltar estaciones.
- **Cierre automático de orden** cuando el 100% de ventanas llega a Empaque (lógica en SP).
- **Result Pattern** en servicios para manejo estructurado de errores sin excepciones no controladas.
- **Guards de ruta** en Angular: `authGuard` para usuarios autenticados, `adminGuard` para rutas de administrador.
- **JWT Interceptor** en Angular: adjunta el token automáticamente a todas las peticiones HTTP.

---

## Usuarios de prueba

| Email | Password | Rol |
|---|---|---|
| admin@tecnoglass.com | Admin123! | Administrador |
| operario@tecnoglass.com | Admin123! | Operario |

> Recuerda actualizar los hashes BCrypt en la BD según la nota del paso 2.

---

## Generación de QR en producción

Cada ventana tiene un `CodigoQR` de tipo `UNIQUEIDENTIFIER` (UUID). Para generar imágenes QR reales en el frontend, integrar una librería como [`qrcode`](https://www.npmjs.com/package/qrcode):

```bash
npm install qrcode @types/qrcode
```

Y en el componente de detalle de orden, renderizar el QR de cada ventana con:
```typescript
import QRCode from 'qrcode';
const dataUrl = await QRCode.toDataURL(ventana.codigoQR);
```
