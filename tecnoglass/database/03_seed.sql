-- ============================================================
-- TECNOGLASS / ENERGÍA SOLAR S.A.
-- Script SEED - Datos iniciales
-- ============================================================

USE TecnoglassDB;
GO

-- Roles
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE Nombre = 'Administrador')
    INSERT INTO dbo.Rol (Nombre) VALUES ('Administrador');
IF NOT EXISTS (SELECT 1 FROM dbo.Rol WHERE Nombre = 'Operario')
    INSERT INTO dbo.Rol (Nombre) VALUES ('Operario');
GO

-- Estaciones del flujo
IF NOT EXISTS (SELECT 1 FROM dbo.Estacion)
BEGIN
    INSERT INTO dbo.Estacion (Nombre, Orden) VALUES
        ('Corte',    1),
        ('Troquel',  2),
        ('Ensamble', 3),
        ('Empaque',  4);
END
GO

-- Usuario administrador por defecto
-- Password: Admin123! (BCrypt hash — reemplazar con hash real generado por la aplicación)
IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Email = 'admin@tecnoglass.com')
BEGIN
    INSERT INTO dbo.Usuario (Nombre, Email, PasswordHash, RolId)
    VALUES (
        'Administrador',
        'admin@tecnoglass.com',
        '$2a$11$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH',
        (SELECT Id FROM dbo.Rol WHERE Nombre = 'Administrador')
    );
END
GO

-- Operario de prueba
IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Email = 'operario@tecnoglass.com')
BEGIN
    INSERT INTO dbo.Usuario (Nombre, Email, PasswordHash, RolId)
    VALUES (
        'Operario Demo',
        'operario@tecnoglass.com',
        '$2a$11$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH',
        (SELECT Id FROM dbo.Rol WHERE Nombre = 'Operario')
    );
END
GO

PRINT 'Seed ejecutado correctamente.';
GO
