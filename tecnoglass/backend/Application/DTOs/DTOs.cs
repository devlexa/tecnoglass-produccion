namespace Tecnoglass.Application.DTOs;

// ── Auth ────────────────────────────────────────────────────
public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    string Nombre,
    string Email,
    string Rol,
    DateTime Expira);

// ── Orden de Producción ─────────────────────────────────────
public record CrearOrdenRequest(
    string Codigo,
    string? Descripcion,
    int CantidadVentanas);

public record OrdenResumenDto(
    int Id,
    string Codigo,
    string? Descripcion,
    int CantidadTotal,
    string Estado,
    DateTime FechaCreacion,
    DateTime? FechaFinalizacion,
    int VentanasCompletadas,
    decimal PorcentajeAvance);

public record DistribucionEstacionDto(
    string Estacion,
    int OrdenEstacion,
    int CantidadVentanas,
    decimal Porcentaje);

public record OrdenDetalleDto(
    OrdenResumenDto Orden,
    IEnumerable<DistribucionEstacionDto> Distribucion);

// ── Ventana ─────────────────────────────────────────────────
public record VentanaDto(
    int Id,
    Guid CodigoQR,
    int OrdenProduccionId,
    string? EstacionActual,
    int? OrdenEstacionActual,
    string Estado,
    DateTime FechaCreacion);

public record MoverVentanaRequest(Guid CodigoQR);

public record MoverVentanaResponse(
    bool Exito,
    string Mensaje);

// ── Historial / Trazabilidad ─────────────────────────────────
public record MovimientoDto(
    int MovimientoId,
    string Estacion,
    int OrdenEstacion,
    DateTime FechaIngreso,
    DateTime? FechaSalida,
    int? DuracionMinutos,
    string RegistradoPor);

public record HistorialVentanaDto(
    VentanaDto Ventana,
    IEnumerable<MovimientoDto> Movimientos);

// ── Dashboard ────────────────────────────────────────────────
public record DashboardDto(
    IEnumerable<OrdenResumenDto> OrdenesActivas,
    IEnumerable<DistribucionEstacionDto> DistribucionGlobal);

// ── Resultado genérico ───────────────────────────────────────
public record Result<T>(bool Exito, T? Data, string? Error)
{
    public static Result<T> Ok(T data) => new(true, data, null);
    public static Result<T> Fail(string error) => new(false, default, error);
}
