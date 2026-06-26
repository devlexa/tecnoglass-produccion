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
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "1");

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearOrdenRequest request)
    {
        var result = await _service.CrearOrdenAsync(request, UsuarioId);
        return result.Exito
            ? CreatedAtAction(nameof(Detalle), new { id = result.Data!.Id }, result.Data)
            : BadRequest(new { error = result.Error });
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var result = await _service.ListarActivasAsync();
        return Ok(result.Data);
    }

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
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "1");

    [HttpPost("mover")]
    public async Task<IActionResult> Mover([FromBody] MoverVentanaRequest request)
    {
        var result = await _service.MoverVentanaAsync(request, UsuarioId);
        return result.Exito ? Ok(result.Data) : BadRequest(new { error = result.Error });
    }

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

    [HttpGet]
    public async Task<IActionResult> Resumen()
    {
        var result = await _service.ObtenerResumenAsync();
        return Ok(result.Data);
    }
}
