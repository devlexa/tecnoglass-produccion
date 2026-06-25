-- ============================================================
-- TECNOGLASS / ENERGÍA SOLAR S.A.
-- Script SPs - Procedimientos Almacenados
-- Motor: SQL Server 2019+
-- ============================================================

USE TecnoglassDB;
GO

-- ============================================================
-- SP: sp_MoverVentana
-- Mueve una ventana a la siguiente estación del flujo.
-- Valida secuencia, registra historial y cierra la orden
-- automáticamente cuando todas las ventanas están empacadas.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_MoverVentana
    @CodigoQR       UNIQUEIDENTIFIER,
    @UsuarioId      INT,
    @Resultado      INT         OUTPUT,  -- 0=OK, <0=error
    @Mensaje        VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @VentanaId          INT;
    DECLARE @EstacionActualId   INT;
    DECLARE @OrdenId            INT;
    DECLARE @EstadoVentana      VARCHAR(20);
    DECLARE @ProximaEstacionId  INT;
    DECLARE @ProximoOrden       TINYINT;
    DECLARE @TotalVentanas      INT;
    DECLARE @VentanasCompletadas INT;
    DECLARE @MovimientoAbierto  INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Obtener ventana con bloqueo de fila (UPDLOCK) para evitar concurrencia
        SELECT
            @VentanaId        = v.Id,
            @EstacionActualId = v.EstacionActualId,
            @OrdenId          = v.OrdenProduccionId,
            @EstadoVentana    = v.Estado
        FROM dbo.Ventana v WITH (UPDLOCK, ROWLOCK)
        WHERE v.CodigoQR = @CodigoQR;

        IF @VentanaId IS NULL
        BEGIN
            SET @Resultado = -1;
            SET @Mensaje   = 'Ventana no encontrada para el QR proporcionado.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @EstadoVentana = 'COMPLETADA'
        BEGIN
            SET @Resultado = -2;
            SET @Mensaje   = 'La ventana ya completó todas las estaciones.';
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Determinar la próxima estación
        IF @EstacionActualId IS NULL
        BEGIN
            -- Primera entrada: asignar estación 1 (Corte)
            SELECT @ProximaEstacionId = Id, @ProximoOrden = Orden
            FROM dbo.Estacion WHERE Orden = 1;
        END
        ELSE
        BEGIN
            SELECT @ProximoOrden = Orden + 1
            FROM dbo.Estacion WHERE Id = @EstacionActualId;

            IF @ProximoOrden > 4
            BEGIN
                SET @Resultado = -3;
                SET @Mensaje   = 'La ventana ya está en la última estación.';
                ROLLBACK TRANSACTION;
                RETURN;
            END

            SELECT @ProximaEstacionId = Id
            FROM dbo.Estacion WHERE Orden = @ProximoOrden;
        END

        -- 3. Cerrar movimiento abierto en estación anterior
        UPDATE dbo.MovimientoVentana
        SET FechaSalida = SYSUTCDATETIME()
        WHERE VentanaId = @VentanaId
          AND FechaSalida IS NULL;

        -- 4. Registrar nuevo movimiento
        INSERT INTO dbo.MovimientoVentana (VentanaId, EstacionId, RegistradoPorId)
        VALUES (@VentanaId, @ProximaEstacionId, @UsuarioId);

        -- 5. Actualizar estación actual de la ventana
        UPDATE dbo.Ventana
        SET EstacionActualId = @ProximaEstacionId,
            Estado = CASE WHEN @ProximoOrden = 4 THEN 'COMPLETADA' ELSE 'EN_PROCESO' END
        WHERE Id = @VentanaId;

        -- 6. Si llegó a Empaque (orden=4), verificar cierre automático de la orden
        IF @ProximoOrden = 4
        BEGIN
            SELECT @TotalVentanas = COUNT(*)
            FROM dbo.Ventana WHERE OrdenProduccionId = @OrdenId;

            SELECT @VentanasCompletadas = COUNT(*)
            FROM dbo.Ventana
            WHERE OrdenProduccionId = @OrdenId
              AND Estado = 'COMPLETADA';

            -- La ventana actual ya fue marcada COMPLETADA arriba; el COUNT la incluye
            IF @VentanasCompletadas = @TotalVentanas
            BEGIN
                UPDATE dbo.OrdenProduccion
                SET Estado = 'COMPLETADA',
                    FechaFinalizacion = SYSUTCDATETIME()
                WHERE Id = @OrdenId;
            END
        END

        -- 7. Auditoría
        INSERT INTO dbo.AuditoriaAccion (UsuarioId, Accion, Entidad, EntidadId, Detalle)
        VALUES (
            @UsuarioId,
            'MOVER_VENTANA',
            'Ventana',
            @VentanaId,
            CONCAT('QR=', @CodigoQR, ' -> EstacionId=', @ProximaEstacionId)
        );

        COMMIT TRANSACTION;

        SET @Resultado = 0;
        SET @Mensaje   = CONCAT('Ventana movida correctamente a estación orden ', @ProximoOrden, '.');
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @Resultado = -99;
        SET @Mensaje   = ERROR_MESSAGE();
    END CATCH
END
GO


-- ============================================================
-- SP: sp_HistorialVentana
-- Retorna el historial completo de movimientos de una ventana
-- identificada por su Código QR.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_HistorialVentana
    @CodigoQR UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Ventana WHERE CodigoQR = @CodigoQR)
    BEGIN
        RAISERROR('Ventana no encontrada.', 16, 1);
        RETURN;
    END

    -- Información general de la ventana
    SELECT
        v.Id                AS VentanaId,
        v.CodigoQR,
        op.Codigo           AS OrdenCodigo,
        op.Estado           AS OrdenEstado,
        e.Nombre            AS EstacionActual,
        e.Orden             AS OrdenEstacionActual,
        v.Estado            AS EstadoVentana,
        v.FechaCreacion
    FROM dbo.Ventana v
    JOIN dbo.OrdenProduccion op ON op.Id = v.OrdenProduccionId
    LEFT JOIN dbo.Estacion e    ON e.Id  = v.EstacionActualId
    WHERE v.CodigoQR = @CodigoQR;

    -- Historial de movimientos
    SELECT
        mv.Id               AS MovimientoId,
        es.Nombre           AS Estacion,
        es.Orden            AS OrdenEstacion,
        mv.FechaIngreso,
        mv.FechaSalida,
        CASE
            WHEN mv.FechaSalida IS NOT NULL
            THEN DATEDIFF(MINUTE, mv.FechaIngreso, mv.FechaSalida)
            ELSE NULL
        END                 AS DuracionMinutos,
        u.Nombre            AS RegistradoPor
    FROM dbo.MovimientoVentana mv
    JOIN dbo.Estacion es    ON es.Id = mv.EstacionId
    JOIN dbo.Usuario u      ON u.Id  = mv.RegistradoPorId
    WHERE mv.VentanaId = (SELECT Id FROM dbo.Ventana WHERE CodigoQR = @CodigoQR)
    ORDER BY mv.FechaIngreso ASC;
END
GO


-- ============================================================
-- SP: sp_ResumenOrdenProduccion
-- Retorna KPIs de una orden: total ventanas, distribución
-- por estación y porcentaje de avance global.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_ResumenOrdenProduccion
    @OrdenId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.OrdenProduccion WHERE Id = @OrdenId)
    BEGIN
        RAISERROR('Orden de producción no encontrada.', 16, 1);
        RETURN;
    END

    -- Cabecera de la orden
    SELECT
        op.Id,
        op.Codigo,
        op.Descripcion,
        op.CantidadTotal,
        op.Estado,
        op.FechaCreacion,
        op.FechaFinalizacion,
        u.Nombre AS CreadoPor,
        -- % avance: ventanas en Empaque (completadas) / total
        CAST(
            (SELECT COUNT(*) FROM dbo.Ventana
             WHERE OrdenProduccionId = @OrdenId AND Estado = 'COMPLETADA')
            * 100.0 / NULLIF(op.CantidadTotal, 0)
        AS DECIMAL(5,2)) AS PorcentajeAvance
    FROM dbo.OrdenProduccion op
    JOIN dbo.Usuario u ON u.Id = op.CreadoPorId
    WHERE op.Id = @OrdenId;

    -- Distribución de ventanas por estación
    SELECT
        ISNULL(e.Nombre, 'Sin ingresar') AS Estacion,
        ISNULL(e.Orden, 0)               AS OrdenEstacion,
        COUNT(v.Id)                      AS CantidadVentanas,
        CAST(COUNT(v.Id) * 100.0 / NULLIF(op.CantidadTotal, 0) AS DECIMAL(5,2)) AS Porcentaje
    FROM dbo.Ventana v
    JOIN dbo.OrdenProduccion op ON op.Id = v.OrdenProduccionId
    LEFT JOIN dbo.Estacion e    ON e.Id  = v.EstacionActualId
    WHERE v.OrdenProduccionId = @OrdenId
    GROUP BY e.Nombre, e.Orden, op.CantidadTotal
    ORDER BY ISNULL(e.Orden, 0);
END
GO


-- ============================================================
-- SP: sp_DashboardResumen
-- Retorna todas las órdenes activas con su avance y
-- distribución de ventanas por estación para el dashboard.
-- Operación Set-Based — sin cursores.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.sp_DashboardResumen
AS
BEGIN
    SET NOCOUNT ON;

    -- Resumen de órdenes activas
    SELECT
        op.Id,
        op.Codigo,
        op.Descripcion,
        op.CantidadTotal,
        op.Estado,
        op.FechaCreacion,
        COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END)               AS VentanasCompletadas,
        CAST(
            COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END)
            * 100.0 / NULLIF(op.CantidadTotal, 0)
        AS DECIMAL(5,2))                                                   AS PorcentajeAvance
    FROM dbo.OrdenProduccion op
    LEFT JOIN dbo.Ventana v ON v.OrdenProduccionId = op.Id
    WHERE op.Estado = 'ACTIVA'
    GROUP BY op.Id, op.Codigo, op.Descripcion, op.CantidadTotal, op.Estado, op.FechaCreacion
    ORDER BY op.FechaCreacion DESC;

    -- Distribución global de ventanas por estación (para gráfico del dashboard)
    SELECT
        ISNULL(e.Nombre, 'Sin ingresar') AS Estacion,
        ISNULL(e.Orden, 0)               AS OrdenEstacion,
        COUNT(v.Id)                      AS TotalVentanas
    FROM dbo.Ventana v
    JOIN dbo.OrdenProduccion op ON op.Id = v.OrdenProduccionId AND op.Estado = 'ACTIVA'
    LEFT JOIN dbo.Estacion e    ON e.Id  = v.EstacionActualId
    GROUP BY e.Nombre, e.Orden
    ORDER BY ISNULL(e.Orden, 0);
END
GO

PRINT 'Stored Procedures creados correctamente.';
GO
