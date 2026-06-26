using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Tecnoglass.Application.Interfaces;
using Tecnoglass.Application.Services;
using Tecnoglass.Infrastructure.Data;
using Tecnoglass.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtSecret   = jwtSettings["Secret"]   ?? throw new InvalidOperationException("JWT Secret no configurado.");
var jwtIssuer   = jwtSettings["Issuer"]   ?? "tecnoglass";
var jwtAudience = jwtSettings["Audience"] ?? "tecnoglass-app";
var connString  = builder.Configuration.GetConnectionString("Default")
                  ?? throw new InvalidOperationException("Connection string 'Default' no configurada.");

builder.Services.AddSingleton(new DbContext(connString));
builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<OrdenProduccionRepository>();
builder.Services.AddScoped<VentanaRepository>();
builder.Services.AddScoped<DashboardRepository>();

builder.Services.AddSingleton<ITokenService>(
    _ => new TokenService(jwtSecret, jwtIssuer, jwtAudience));
builder.Services.AddScoped<IAuthService,            AuthService>();
builder.Services.AddScoped<IOrdenProduccionService, OrdenProduccionService>();
builder.Services.AddScoped<IVentanaService,         VentanaService>();
builder.Services.AddScoped<IDashboardService,       DashboardService>();

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Tecnoglass API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http,
        Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header,
        Description = "Ingrese: Bearer {token}"
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

var app = builder.Build();

app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["Access-Control-Allow-Origin"]  = "*";
    ctx.Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS";
    ctx.Response.Headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type";
    if (ctx.Request.Method == "OPTIONS") { ctx.Response.StatusCode = 200; return; }
    await next();
});

app.UseCors("Angular");
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Tecnoglass API v1"));
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();