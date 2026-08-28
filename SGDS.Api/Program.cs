using Microsoft.EntityFrameworkCore;
using SGDS.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using SGDS.Application.Interfaces;
using SGDS.Application.Helpers;
using SGDS.Infrastructure.Services;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingresa el token JWT así: Bearer {tu token}"
    });

    options.AddSecurityRequirement(document => new()
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = []
    });
});

builder.Services.AddDbContext<SgdsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SgdsConnection"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

//acá se trabaja JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.Configure<ConfiguracionEstampillas>(builder.Configuration.GetSection("Estampillas"));
builder.Services.Configure<ConfiguracionImpuestoConsumo>(builder.Configuration.GetSection("ImpuestoConsumo"));

//adición de esta variable para enrutamiento para el almacenamiento de documentos.
var rutaAlmacenamiento = Path.Combine(builder.Environment.ContentRootPath, "Almacenamiento");
builder.Services.AddSingleton<IAlmacenamientoService>(new AlmacenamientoLocalService(rutaAlmacenamiento));

QuestPDF.Settings.License = LicenseType.Community;

var app = builder.Build();

// Aplica automáticamente cualquier migración pendiente de EF Core al arrancar la API.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<SgdsDbContext>().Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI (options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "SGDS API v1");   
    });
}



app.UseHttpsRedirection();
app.UseAuthentication();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.Run();
