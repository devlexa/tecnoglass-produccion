# Tecnoglass — Sistema de Producción de Ventanería

## Stack
- Backend: ASP.NET Core (.NET 10) + Dapper + SQL Server
- Frontend: Angular 21
- Auth: JWT Bearer
- Password de prueba: `password`

## Instalación

### 1. Base de datos
```bash
sqlcmd -S localhost -E -i "tecnoglass/database/01_DDL.sql"
sqlcmd -S localhost -E -i "tecnoglass/database/02_SPs.sql"
sqlcmd -S localhost -E -i "tecnoglass/database/03_seed.sql"
sqlcmd -S localhost -E -d TecnoglassDB -Q "UPDATE dbo.Usuario SET PasswordHash='placeholder' WHERE Email='admin@tecnoglass.com'"
```

### 2. Backend
```bash
cd tecnoglass/backend
dotnet run
# Corre en http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### 3. Frontend
```bash
cd tecnoglass/frontend
npm install
ng serve
# Corre en http://localhost:4200
```

## Usuarios
| Email | Password | Rol |
|---|---|---|
| admin@tecnoglass.com | password | Administrador |
| operario@tecnoglass.com | password | Operario |

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/login | Login |
| GET | /api/dashboard | KPIs globales |
| GET | /api/ordenes | Listar órdenes activas |
| POST | /api/ordenes | Crear orden |
| GET | /api/ordenes/{id} | Detalle orden |
| POST | /api/ventanas/mover | Mover ventana (escaneo QR) |
| GET | /api/ventanas/{qr}/historial | Historial ventana |
