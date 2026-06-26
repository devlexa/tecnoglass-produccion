namespace Tecnoglass.Application.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string Nombre, string Email, string Rol, DateTime Expira);
public record CrearOrdenRequest(string Codigo, string? Descripcion, int CantidadVentanas);
public record MoverVentanaRequest(Guid CodigoQR);
public record MoverVentanaResponse(bool Exito, string Mensaje);
public record OrdenDetalleDto(OrdenResumenDto Orden, IEnumerable<DistribucionEstacionDto> Distribucion);
public record HistorialVentanaDto(VentanaDto Ventana, IEnumerable<MovimientoDto> Movimientos);
public record DashboardDto(IEnumerable<OrdenResumenDto> OrdenesActivas, IEnumerable<DistribucionEstacionDto> DistribucionGlobal);

public record Result<T>(bool Exito, T? Data, string? Error)
{
    public static Result<T> Ok(T data)      => new(true,  data,    null);
    public static Result<T> Fail(string e)  => new(false, default, e);
}

public class OrdenResumenDto
{
    public int       Id                   { get; set; }
    public string    Codigo               { get; set; } = string.Empty;
    public string?   Descripcion          { get; set; }
    public int       CantidadTotal        { get; set; }
    public string    Estado               { get; set; } = string.Empty;
    public DateTime  FechaCreacion        { get; set; }
    public DateTime? FechaFinalizacion    { get; set; }
    public int       VentanasCompletadas  { get; set; }
    public decimal   PorcentajeAvance     { get; set; }
}

public class DistribucionEstacionDto
{
    public string  Estacion        { get; set; } = string.Empty;
    public int     OrdenEstacion   { get; set; }
    public int     CantidadVentanas { get; set; }
    public decimal Porcentaje      { get; set; }
}

public class VentanaDto
{
    public int      Id                   { get; set; }
    public Guid     CodigoQR             { get; set; }
    public int      OrdenProduccionId    { get; set; }
    public string?  EstacionActual       { get; set; }
    public int?     OrdenEstacionActual  { get; set; }
    public string   Estado               { get; set; } = string.Empty;
    public DateTime FechaCreacion        { get; set; }
}

public class MovimientoDto
{
    public int      MovimientoId    { get; set; }
    public string   Estacion        { get; set; } = string.Empty;
    public int      OrdenEstacion   { get; set; }
    public DateTime FechaIngreso    { get; set; }
    public DateTime? FechaSalida    { get; set; }
    public int?     DuracionMinutos { get; set; }
    public string   RegistradoPor   { get; set; } = string.Empty;
}
