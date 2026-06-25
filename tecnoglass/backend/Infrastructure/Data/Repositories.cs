using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Tecnoglass.Application.DTOs;
using Tecnoglass.Domain.Entities;

namespace Tecnoglass.Infrastructure.Data;

/// <summary>
/// Provee conexiones SQL Server para uso con Dapper.
/// </summary>
public class DbContext
{
    private readonly string _connectionString;

    public DbContext(string connectionString)
        => _connectionString = connectionString;

    public IDbConnection CreateConnection()
        => new SqlConnection(_connectionString);
}

namespace Tecnoglass.Infrastructure.Repositories;

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
            "SELECT Nombre FROM dbo.Rol WHERE Id = @RolId",
            new { RolId = rolId });
    }
}

public class OrdenProduccionRepository
{
    private readonly DbContext _db;

    public OrdenProduccionRepository(DbContext db) => _db = db;

    public async Task<int> CrearOrdenAsync(OrdenProduccion orden)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO dbo.OrdenProduccion (Codigo, Descripcion, CantidadTotal, CreadoPorId)
            OUTPUT INSERTED.Id
            VALUES (@Codigo, @Descripcion, @CantidadTotal, @CreadoPorId)";
        return await conn.ExecuteScalarAsync<int>(sql, orden);
    }

    public async Task CrearVentanasLoteAsync(int ordenId, int cantidad)
    {
        // Genera todas las ventanas del lote en una sola operación set-based
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO dbo.Ventana (OrdenProduccionId)
            SELECT @OrdenId
            FROM (
                SELECT TOP (@Cantidad) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) rn
                FROM sys.all_objects a CROSS JOIN sys.all_objects b
            ) nums";
        await conn.ExecuteAsync(sql, new { OrdenId = ordenId, Cantidad = cantidad });
    }

    public async Task<IEnumerable<OrdenResumenDto>> ListarActivasAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<OrdenResumenDto>(
            "EXEC dbo.sp_DashboardResumen");
        // El SP devuelve dos result sets; aquí tomamos el primero (órdenes activas)
    }

    public async Task<OrdenDetalleDto?> ObtenerDetalleAsync(int ordenId)
    {
        using var conn = _db.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "EXEC dbo.sp_ResumenOrdenProduccion @OrdenId",
            new { OrdenId = ordenId });

        var orden = await multi.ReadSingleOrDefaultAsync<OrdenResumenDto>();
        if (orden is null) return null;

        var distribucion = await multi.ReadAsync<DistribucionEstacionDto>();
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
        var parametros = new DynamicParameters();
        parametros.Add("@CodigoQR",   codigoQR);
        parametros.Add("@UsuarioId",  usuarioId);
        parametros.Add("@Resultado",  dbType: DbType.Int32,  direction: ParameterDirection.Output);
        parametros.Add("@Mensaje",    dbType: DbType.String, direction: ParameterDirection.Output, size: 200);

        await conn.ExecuteAsync("dbo.sp_MoverVentana", parametros, commandType: CommandType.StoredProcedure);

        return (parametros.Get<int>("@Resultado"), parametros.Get<string>("@Mensaje"));
    }

    public async Task<HistorialVentanaDto?> ObtenerHistorialAsync(Guid codigoQR)
    {
        using var conn = _db.CreateConnection();
        using var multi = await conn.QueryMultipleAsync(
            "EXEC dbo.sp_HistorialVentana @CodigoQR",
            new { CodigoQR = codigoQR });

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

        var ordenes     = await multi.ReadAsync<OrdenResumenDto>();
        var distribucion = await multi.ReadAsync<DistribucionEstacionDto>();

        return new DashboardDto(ordenes, distribucion);
    }
}
