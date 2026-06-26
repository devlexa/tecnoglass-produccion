using Tecnoglass.Application.DTOs;

namespace Tecnoglass.Application.Interfaces;

public interface IAuthService            { Task<Result<LoginResponse>>               LoginAsync(LoginRequest request); }
public interface IOrdenProduccionService
{
    Task<Result<OrdenResumenDto>>               CrearOrdenAsync(CrearOrdenRequest request, int usuarioId);
    Task<Result<OrdenDetalleDto>>               ObtenerDetalleAsync(int ordenId);
    Task<Result<IEnumerable<OrdenResumenDto>>>  ListarActivasAsync();
}
public interface IVentanaService
{
    Task<Result<MoverVentanaResponse>>  MoverVentanaAsync(MoverVentanaRequest request, int usuarioId);
    Task<Result<HistorialVentanaDto>>   ObtenerHistorialAsync(Guid codigoQR);
}
public interface IDashboardService { Task<Result<DashboardDto>> ObtenerResumenAsync(); }
public interface ITokenService     { string GenerarToken(int usuarioId, string email, string nombre, string rol); }
