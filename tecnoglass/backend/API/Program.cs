using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Tecnoglass.Application.Interfaces;
using Tecnoglass.Application.Services;
using Tecnoglass.Infrastructure.Data;
using Tecnoglass.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// ── Configuración ────────────────────────────────────────────
var jwtSettings  = builder.Configuration.GetSection("Jwt");
var jwtSecret    = jwtSettings["Secret"]   ?? throw new InvalidOperationException("JWT Secret no configurado.");
var jwtIssuer    = jwtSettings["Issuer"]   ?? "tecnoglass";
var jwtAudience  = jwtSettings["Audience"] ?? "tecnoglass-app";
var connString   = builder.Configuration.GetConnectionString("Default")
                   ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");

// ── Infraestructura ──────────────────────────────────────────
builder.Services.AddSingleton(new DbContext(connString));
builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<OrdenProduccionRepository>();
builder.Services.AddScoped<VentanaRepository>();
builder.Services.AddScoped<DashboardRepository>();

// ── Servicios de aplicación ──────────────────────────────────
builder.Services.AddSingleton<ITokenService>(
    _ => new TokenService(jwtSecret, jwtIssuer, jwtAudience));
builder.Services.AddScoped<IAuthService,           AuthService>();
builder.Services.AddScoped<IOrdenProduccionService, OrdenProduccionService>();
builder.Services.AddScoped<IVentanaService,         VentanaService>();
builder.Services.AddScoped<IDashboardService,       DashboardService>();

// ── JWT Authentication ───────────────────────────────────────
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── CORS (para Angular en dev) ───────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ── Controllers + Swagger ────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title   = "Tecnoglass API",
        Version = "v1",
        Description = "API de producción de ventanería — Tecnoglass / Energía Solar S.A."
    });

    // Soporte JWT en Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT",
        In           = ParameterLocation.Header,
        Description  = "Ingrese el token JWT. Ejemplo: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ── Build ────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Tecnoglass API v1"));
}

app.UseCors("Angular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
