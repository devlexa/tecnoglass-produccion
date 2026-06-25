-- ============================================================
-- TECNOGLASS / ENERGÍA SOLAR S.A.
-- Script DDL - Base de Datos de Producción de Ventanería
-- Motor: SQL Server 2019+
-- Autor: Prueba Técnica Fullstack
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TecnoglassDB')
BEGIN
    CREATE DATABASE TecnoglassDB
        COLLATE Latin1_General_CI_AI;
END
GO

USE TecnoglassDB;
GO

-- ============================================================
-- TABLA: Rol
-- ============================================================
IF OBJECT_ID('dbo.Rol', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rol (
        Id       INT           NOT NULL IDENTITY(1,1),
        Nombre   VARCHAR(50)   NOT NULL,
        CONSTRAINT PK_Rol PRIMARY KEY (Id),
        CONSTRAINT UQ_Rol_Nombre UNIQUE (Nombre)
    );
END
GO

-- ============================================================
-- TABLA: Usuario
-- ============================================================
IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuario (
        Id              INT            NOT NULL IDENTITY(1,1),
        Nombre          NVARCHAR(100)  NOT NULL,
        Email           VARCHAR(150)   NOT NULL,
        PasswordHash    VARCHAR(256)   NOT NULL,
        RolId           INT            NOT NULL,
        Activo          BIT            NOT NULL DEFAULT 1,
        FechaCreacion   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Usuario      PRIMARY KEY (Id),
        CONSTRAINT UQ_Usuario_Email UNIQUE (Email),
        CONSTRAINT FK_Usuario_Rol  FOREIGN KEY (RolId) REFERENCES dbo.Rol(Id)
    );

    CREATE INDEX IX_Usuario_Email ON dbo.Usuario (Email);
END
GO

-- ============================================================
-- TABLA: Estacion
-- Representa las 4 estaciones del flujo: Corte, Troquel, Ensamble, Empaque
-- ============================================================
IF OBJECT_ID('dbo.Estacion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Estacion (
        Id      INT          NOT NULL IDENTITY(1,1),
        Nombre  VARCHAR(50)  NOT NULL,
        Orden   TINYINT      NOT NULL,   -- 1=Corte, 2=Troquel, 3=Ensamble, 4=Empaque
        CONSTRAINT PK_Estacion       PRIMARY KEY (Id),
        CONSTRAINT UQ_Estacion_Orden UNIQUE (Orden),
        CONSTRAINT CK_Estacion_Orden CHECK (Orden BETWEEN 1 AND 4)
    );
END
GO

-- ============================================================
-- TABLA: OrdenProduccion
-- Representa un lote de ventanas a fabricar
-- ============================================================
IF OBJECT_ID('dbo.OrdenProduccion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrdenProduccion (
        Id                  INT            NOT NULL IDENTITY(1,1),
        Codigo              VARCHAR(30)    NOT NULL,
        Descripcion         NVARCHAR(250)  NULL,
        CantidadTotal       INT            NOT NULL,
        Estado              VARCHAR(20)    NOT NULL DEFAULT 'ACTIVA',
        FechaCreacion       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaFinalizacion   DATETIME2      NULL,
        CreadoPorId         INT            NOT NULL,
        CONSTRAINT PK_OrdenProduccion          PRIMARY KEY (Id),
        CONSTRAINT UQ_OrdenProduccion_Codigo   UNIQUE (Codigo),
        CONSTRAINT FK_OrdenProduccion_Usuario  FOREIGN KEY (CreadoPorId) REFERENCES dbo.Usuario(Id),
        CONSTRAINT CK_OrdenProduccion_Estado   CHECK (Estado IN ('ACTIVA','COMPLETADA','CANCELADA')),
        CONSTRAINT CK_OrdenProduccion_Cantidad CHECK (CantidadTotal > 0)
    );

    CREATE INDEX IX_OrdenProduccion_Estado ON dbo.OrdenProduccion (Estado);
END
GO

-- ============================================================
-- TABLA: Ventana
-- Cada unidad individual dentro de una orden de producción
-- ============================================================
IF OBJECT_ID('dbo.Ventana', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Ventana (
        Id                  INT             NOT NULL IDENTITY(1,1),
        CodigoQR            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),  -- GUID global único
        OrdenProduccionId   INT             NOT NULL,
        EstacionActualId    INT             NULL,   -- NULL = aún no ingresa a línea
        Estado              VARCHAR(20)     NOT NULL DEFAULT 'EN_PROCESO',
        FechaCreacion       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Ventana                   PRIMARY KEY (Id),
        CONSTRAINT UQ_Ventana_CodigoQR          UNIQUE (CodigoQR),
        CONSTRAINT FK_Ventana_Orden             FOREIGN KEY (OrdenProduccionId) REFERENCES dbo.OrdenProduccion(Id),
        CONSTRAINT FK_Ventana_Estacion          FOREIGN KEY (EstacionActualId)  REFERENCES dbo.Estacion(Id),
        CONSTRAINT CK_Ventana_Estado            CHECK (Estado IN ('EN_PROCESO','COMPLETADA'))
    );

    CREATE INDEX IX_Ventana_OrdenProduccionId ON dbo.Ventana (OrdenProduccionId);
    CREATE INDEX IX_Ventana_CodigoQR          ON dbo.Ventana (CodigoQR);
    CREATE INDEX IX_Ventana_EstacionActualId  ON dbo.Ventana (EstacionActualId);
END
GO

-- ============================================================
-- TABLA: MovimientoVentana
-- Historial completo de cada ventana por estación (auditoría)
-- ============================================================
IF OBJECT_ID('dbo.MovimientoVentana', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.MovimientoVentana (
        Id              INT         NOT NULL IDENTITY(1,1),
        VentanaId       INT         NOT NULL,
        EstacionId      INT         NOT NULL,
        FechaIngreso    DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaSalida     DATETIME2   NULL,
        RegistradoPorId INT         NOT NULL,
        CONSTRAINT PK_MovimientoVentana          PRIMARY KEY (Id),
        CONSTRAINT FK_Movimiento_Ventana         FOREIGN KEY (VentanaId)       REFERENCES dbo.Ventana(Id),
        CONSTRAINT FK_Movimiento_Estacion        FOREIGN KEY (EstacionId)      REFERENCES dbo.Estacion(Id),
        CONSTRAINT FK_Movimiento_Usuario         FOREIGN KEY (RegistradoPorId) REFERENCES dbo.Usuario(Id)
    );

    CREATE INDEX IX_Movimiento_VentanaId  ON dbo.MovimientoVentana (VentanaId);
    CREATE INDEX IX_Movimiento_EstacionId ON dbo.MovimientoVentana (EstacionId);
END
GO

-- ============================================================
-- TABLA: AuditoriaAccion
-- Log de acciones relevantes del sistema
-- ============================================================
IF OBJECT_ID('dbo.AuditoriaAccion', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditoriaAccion (
        Id          BIGINT          NOT NULL IDENTITY(1,1),
        UsuarioId   INT             NULL,
        Accion      VARCHAR(100)    NOT NULL,
        Entidad     VARCHAR(50)     NULL,
        EntidadId   INT             NULL,
        Detalle     NVARCHAR(500)   NULL,
        Fecha       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AuditoriaAccion PRIMARY KEY (Id)
    );

    CREATE INDEX IX_Auditoria_Fecha     ON dbo.AuditoriaAccion (Fecha DESC);
    CREATE INDEX IX_Auditoria_UsuarioId ON dbo.AuditoriaAccion (UsuarioId);
END
GO

PRINT 'DDL ejecutado correctamente en TecnoglassDB.';
GO
