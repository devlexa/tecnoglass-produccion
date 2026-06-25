using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using BCrypt.Net;
using Tecnoglass.Application.DTOs;
using Tecnoglass.Application.Interfaces;
using Tecnoglass.Domain.Entities;
using Tecnoglass.Infrastructure.Repositories;

namespace Tecnoglass.Application.Services;

// ── Token Service ────────────────────────────────────────────
public class TokenService : ITokenService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiresHours;

    public TokenService(string secret, string issuer, string audience, int expiresHours = 8)
    {
        _secret      = secret;
        _issuer      = issuer;
        _audience    = audience;
        _expiresHours = expiresHours;
    }

    public string GenerarToken(int usuarioId, string email, string nombre, string rol)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   usuarioId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("nombre",                      nombre),
            new Claim(ClaimTypes.Role,               rol),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(_expiresHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ── Auth Service ─────────────────────────────────────────────
public class AuthService : IAuthService
{
    private readonly UsuarioRepository _usuarioRepo;
    private readonly ITokenService     _tokenService;

    public AuthService(UsuarioRepository usuarioRepo, ITokenService tokenService)
    {
        _usuarioRepo  = usuarioRepo;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var usuario = await _usuarioRepo.ObtenerPorEmailAsync(request.Email);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            return Result<LoginResponse>.Fail("Credenciales inválidas.");

        var rol   = await _usuarioRepo.ObtenerNombreRolAsync(usuario.RolId) ?? "Operario";
        var token = _tokenService.GenerarToken(usuario.Id, usuario.Email, usuario.Nombre, rol);

        return Result<LoginResponse>.Ok(new LoginResponse(
            Token:  token,
            Nombre: usuario.Nombre,
            Email:  usuario.Email,
            Rol:    rol,
            Expira: DateTime.UtcNow.AddHours(8)));
    }
}

// ── Orden Producción Service ──────────────────────────────────
public class OrdenProduccionService : IOrdenProduccionService
{
    private readonly OrdenProduccionRepository _ordenRepo;

    public OrdenProduccionService(OrdenProduccionRepository ordenRepo)
        => _ordenRepo = ordenRepo;

    public async Task<Result<OrdenResumenDto>> CrearOrdenAsync(CrearOrdenRequest request, int usuarioId)
    {
        if (request.CantidadVentanas <= 0)
            return Result<OrdenResumenDto>.Fail("La cantidad de ventanas debe ser mayor a cero.");

        var orden = new OrdenProduccion
        {
            Codigo        = request.Codigo.Trim().ToUpper(),
            Descripcion   = request.Descripcion,
            CantidadTotal = request.CantidadVentanas,
            CreadoPorId   = usuarioId
        };

        var ordenId = await _ordenRepo.CrearOrdenAsync(orden);
        await _ordenRepo.CrearVentanasLoteAsync(ordenId, request.CantidadVentanas);

        var detalle = await _ordenRepo.ObtenerDetalleAsync(ordenId);
        return detalle is null
            ? Result<OrdenResumenDto>.Fail("Error al recuperar la orden creada.")
            : Result<OrdenResumenDto>.Ok(detalle.Orden);
    }

    public async Task<Result<OrdenDetalleDto>> ObtenerDetalleAsync(int ordenId)
    {
        var detalle = await _ordenRepo.ObtenerDetalleAsync(ordenId);
        return detalle is null
            ? Result<OrdenDetalleDto>.Fail("Orden no encontrada.")
            : Result<OrdenDetalleDto>.Ok(detalle);
    }

    public async Task<Result<IEnumerable<OrdenResumenDto>>> ListarActivasAsync()
    {
        var ordenes = await _ordenRepo.ListarActivasAsync();
        return Result<IEnumerable<OrdenResumenDto>>.Ok(ordenes);
    }
}

// ── Ventana Service ───────────────────────────────────────────
public class VentanaService : IVentanaService
{
    private readonly VentanaRepository _ventanaRepo;

    public VentanaService(VentanaRepository ventanaRepo)
        => _ventanaRepo = ventanaRepo;

    public async Task<Result<MoverVentanaResponse>> MoverVentanaAsync(MoverVentanaRequest request, int usuarioId)
    {
        var (resultado, mensaje) = await _ventanaRepo.MoverVentanaAsync(request.CodigoQR, usuarioId);

        return resultado == 0
            ? Result<MoverVentanaResponse>.Ok(new MoverVentanaResponse(true,  mensaje))
            : Result<MoverVentanaResponse>.Fail(mensaje);
    }

    public async Task<Result<HistorialVentanaDto>> ObtenerHistorialAsync(Guid codigoQR)
    {
        var historial = await _ventanaRepo.ObtenerHistorialAsync(codigoQR);
        return historial is null
            ? Result<HistorialVentanaDto>.Fail("Ventana no encontrada.")
            : Result<HistorialVentanaDto>.Ok(historial);
    }
}

// ── Dashboard Service ─────────────────────────────────────────
public class DashboardService : IDashboardService
{
    private readonly DashboardRepository _dashRepo;

    public DashboardService(DashboardRepository dashRepo)
        => _dashRepo = dashRepo;

    public async Task<Result<DashboardDto>> ObtenerResumenAsync()
    {
        var resumen = await _dashRepo.ObtenerResumenAsync();
        return Result<DashboardDto>.Ok(resumen);
    }
}
