using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Tecnoglass.Application.DTOs;
using Tecnoglass.Domain.Entities;

namespace Tecnoglass.Infrastructure.Data
{
    public class DbContext
    {
        private readonly string _connectionString;
        public DbContext(string connectionString) => _connectionString = connectionString;
        public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
    }
}

namespace Tecnoglass.Infrastructure.Repositories
{
    using Tecnoglass.Infrastructure.Data;

    public class UsuarioRepository
    {
        private readonly DbContext _db;
        public UsuarioRepository(DbContext db) => _db = db;

        public async Task<Usuario?> ObtenerPorEmailAsync(string email)
        {
            using var conn = _db.CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<Usuario>(
                "SELECT Id, Nombre, Email, PasswordHash, RolId, Activo FROM dbo.Usuario WHERE Email = @Email AND Activo = 1",
                new { Email = email });
        }

        public async Task<string?> ObtenerNombreRolAsync(int rolId)
        {
            using var conn = _db.CreateConnection();
            return await conn.ExecuteScalarAsync<string>(
                "SELECT Nombre FROM dbo.Rol WHERE Id = @RolId", new { RolId = rolId });
        }
    }

    public class OrdenProduccionRepository
    {
        private readonly DbContext _db;
        public OrdenProduccionRepository(DbContext db) => _db = db;

        public async Task<int> CrearOrdenAsync(OrdenProduccion orden)
        {
            using var conn = _db.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(@"
                INSERT INTO dbo.OrdenProduccion (Codigo, Descripcion, CantidadTotal, CreadoPorId)
                OUTPUT INSERTED.Id
                VALUES (@Codigo, @Descripcion, @CantidadTotal, @CreadoPorId)", orden);
        }

        public async Task CrearVentanasLoteAsync(int ordenId, int cantidad)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(@"
                INSERT INTO dbo.Ventana (OrdenProduccionId)
                SELECT @OrdenId FROM (
                    SELECT TOP (@Cantidad) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) rn
                    FROM sys.all_objects a CROSS JOIN sys.all_objects b
                ) nums", new { OrdenId = ordenId, Cantidad = cantidad });
        }

        public async Task<IEnumerable<OrdenResumenDto>> ListarActivasAsync()
        {
            using var conn = _db.CreateConnection();
            return await conn.QueryAsync<OrdenResumenDto>(@"
                SELECT
                    op.Id, op.Codigo, op.Descripcion, op.CantidadTotal,
                    op.Estado, op.FechaCreacion, op.FechaFinalizacion,
                    COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END) AS VentanasCompletadas,
                    CAST(
                        COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END)
                        * 100.0 / NULLIF(op.CantidadTotal, 0)
                    AS DECIMAL(5,2)) AS PorcentajeAvance
                FROM dbo.OrdenProduccion op
                LEFT JOIN dbo.Ventana v ON v.OrdenProduccionId = op.Id
                WHERE op.Estado = 'ACTIVA'
                GROUP BY op.Id, op.Codigo, op.Descripcion, op.CantidadTotal,
                         op.Estado, op.FechaCreacion, op.FechaFinalizacion
                ORDER BY op.FechaCreacion DESC");
        }

        public async Task<OrdenDetalleDto?> ObtenerDetalleAsync(int ordenId)
{
    using var conn = _db.CreateConnection();
    
    var orden = await conn.QuerySingleOrDefaultAsync<OrdenResumenDto>(@"
        SELECT
            op.Id, op.Codigo, op.Descripcion, op.CantidadTotal,
            op.Estado, op.FechaCreacion, op.FechaFinalizacion,
            COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END) AS VentanasCompletadas,
            CAST(COUNT(CASE WHEN v.Estado = 'COMPLETADA' THEN 1 END)
                * 100.0 / NULLIF(op.CantidadTotal, 0) AS DECIMAL(5,2)) AS PorcentajeAvance
        FROM dbo.OrdenProduccion op
        LEFT JOIN dbo.Ventana v ON v.OrdenProduccionId = op.Id
        WHERE op.Id = @OrdenId
        GROUP BY op.Id, op.Codigo, op.Descripcion, op.CantidadTotal,
                 op.Estado, op.FechaCreacion, op.FechaFinalizacion",
        new { OrdenId = ordenId });

    if (orden is null) return null;

    var distribucion = await conn.QueryAsync<DistribucionEstacionDto>(@"
        SELECT
            ISNULL(e.Nombre, 'Sin ingresar') AS Estacion,
            ISNULL(e.Orden, 0) AS OrdenEstacion,
            COUNT(v.Id) AS CantidadVentanas,
            CAST(COUNT(v.Id) * 100.0 / NULLIF(op.CantidadTotal, 0) AS DECIMAL(5,2)) AS Porcentaje
        FROM dbo.Ventana v
        JOIN dbo.OrdenProduccion op ON op.Id = v.OrdenProduccionId
        LEFT JOIN dbo.Estacion e ON e.Id = v.EstacionActualId
        WHERE v.OrdenProduccionId = @OrdenId
        GROUP BY e.Nombre, e.Orden, op.CantidadTotal
        ORDER BY ISNULL(e.Orden, 0)",
        new { OrdenId = ordenId });

    return new OrdenDetalleDto(orden, distribucion);
}
    }

    public class VentanaRepository
    {
        private readonly DbContext _db;
        public VentanaRepository(DbContext db) => _db = db;

        public async Task<(int Resultado, string Mensaje)> MoverVentanaAsync(Guid codigoQR, int usuarioId)
        {
            using var conn = _db.CreateConnection();
            var p = new DynamicParameters();
            p.Add("@CodigoQR",  codigoQR);
            p.Add("@UsuarioId", usuarioId);
            p.Add("@Resultado", dbType: DbType.Int32,  direction: ParameterDirection.Output);
            p.Add("@Mensaje",   dbType: DbType.String, direction: ParameterDirection.Output, size: 200);
            await conn.ExecuteAsync("dbo.sp_MoverVentana", p, commandType: CommandType.StoredProcedure);
            return (p.Get<int>("@Resultado"), p.Get<string>("@Mensaje"));
        }

        public async Task<HistorialVentanaDto?> ObtenerHistorialAsync(Guid codigoQR)
        {
            using var conn = _db.CreateConnection();
            using var multi = await conn.QueryMultipleAsync(
                "EXEC dbo.sp_HistorialVentana @CodigoQR", new { CodigoQR = codigoQR });
            var ventana = await multi.ReadSingleOrDefaultAsync<VentanaDto>();
            if (ventana is null) return null;
            var movimientos = await multi.ReadAsync<MovimientoDto>();
            return new HistorialVentanaDto(ventana, movimientos);
        }
    }

    public class DashboardRepository
    {
        private readonly DbContext _db;
        public DashboardRepository(DbContext db) => _db = db;

        public async Task<DashboardDto> ObtenerResumenAsync()
        {
            using var conn = _db.CreateConnection();
            using var multi = await conn.QueryMultipleAsync("EXEC dbo.sp_DashboardResumen");
            var ordenes      = await multi.ReadAsync<OrdenResumenDto>();
            var distribucion = await multi.ReadAsync<DistribucionEstacionDto>();
            return new DashboardDto(ordenes, distribucion);
        }
    }
}
