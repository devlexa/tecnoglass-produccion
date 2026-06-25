using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tecnoglass.Application.DTOs;
using Tecnoglass.Application.Interfaces;

namespace Tecnoglass.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>Autentica un usuario y retorna un token JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return result.Exito ? Ok(result.Data) : Unauthorized(new { error = result.Error });
    }
}

[ApiController]
[Route("api/ordenes")]
[Authorize]
[Produces("application/json")]
public class OrdenProduccionController : ControllerBase
{
    private readonly IOrdenProduccionService _service;

    public OrdenProduccionController(IOrdenProduccionService service) => _service = service;

    private int UsuarioId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    /// <summary>Crea una nueva orden de producción con su lote de ventanas.</summary>
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearOrdenRequest request)
    {
        var result = await _service.CrearOrdenAsync(request, UsuarioId);
        return result.Exito
            ? CreatedAtAction(nameof(Detalle), new { id = result.Data!.Id }, result.Data)
            : BadRequest(new { error = result.Error });
    }

    /// <summary>Lista todas las órdenes activas.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var result = await _service.ListarActivasAsync();
        return Ok(result.Data);
    }

    /// <summary>Retorna el detalle de una orden con distribución de ventanas por estación.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detalle(int id)
    {
        var result = await _service.ObtenerDetalleAsync(id);
        return result.Exito ? Ok(result.Data) : NotFound(new { error = result.Error });
    }
}

[ApiController]
[Route("api/ventanas")]
[Authorize]
[Produces("application/json")]
public class VentanaController : ControllerBase
{
    private readonly IVentanaService _service;

    public VentanaController(IVentanaService service) => _service = service;

    private int UsuarioId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    /// <summary>
    /// Mueve una ventana a la siguiente estación del flujo.
    /// Usado al escanear el QR en planta.
    /// </summary>
    [HttpPost("mover")]
    public async Task<IActionResult> Mover([FromBody] MoverVentanaRequest request)
    {
        var result = await _service.MoverVentanaAsync(request, UsuarioId);
        return result.Exito ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

    /// <summary>Retorna el historial completo de movimientos de una ventana por QR.</summary>
    [HttpGet("{codigoQR:guid}/historial")]
    public async Task<IActionResult> Historial(Guid codigoQR)
    {
        var result = await _service.ObtenerHistorialAsync(codigoQR);
        return result.Exito ? Ok(result.Data) : NotFound(new { error = result.Error });
    }
}

[ApiController]
[Route("api/dashboard")]
[Authorize]
[Produces("application/json")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) => _service = service;

    /// <summary>Retorna KPIs globales: órdenes activas y distribución de ventanas por estación.</summary>
    [HttpGet]
    public async Task<IActionResult> Resumen()
    {
        var result = await _service.ObtenerResumenAsync();
        return Ok(result.Data);
    }
}
