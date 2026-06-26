namespace Tecnoglass.Domain.Entities;

public class OrdenProduccion
{
    public int       Id                { get; set; }
    public string    Codigo            { get; set; } = string.Empty;
    public string?   Descripcion       { get; set; }
    public int       CantidadTotal     { get; set; }
    public string    Estado            { get; set; } = "ACTIVA";
    public DateTime  FechaCreacion     { get; set; }
    public DateTime? FechaFinalizacion { get; set; }
    public int       CreadoPorId       { get; set; }
}

public class Ventana
{
    public int      Id                { get; set; }
    public Guid     CodigoQR          { get; set; }
    public int      OrdenProduccionId { get; set; }
    public int?     EstacionActualId  { get; set; }
    public string   Estado            { get; set; } = "EN_PROCESO";
    public DateTime FechaCreacion     { get; set; }
}

public class Estacion
{
    public int    Id     { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int    Orden  { get; set; }
}

public class Usuario
{
    public int    Id           { get; set; }
    public string Nombre       { get; set; } = string.Empty;
    public string Email        { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int    RolId        { get; set; }
    public bool   Activo       { get; set; }
}
