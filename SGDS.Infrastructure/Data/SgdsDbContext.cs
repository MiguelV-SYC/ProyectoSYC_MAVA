using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SGDS.Domain.Entities;
using System.Security.Claims;

namespace SGDS.Infrastructure.Data;

public class SgdsDbContext : DbContext
{
    private readonly IHttpContextAccessor? _httpContextAccessor;

public SgdsDbContext(DbContextOptions<SgdsDbContext> options) : base(options)
    {
        
    }

public SgdsDbContext(DbContextOptions<SgdsDbContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    RegistrarAuditoria();
    return await base.SaveChangesAsync(cancellationToken);
}

private void RegistrarAuditoria()
{
    if (_httpContextAccessor?.HttpContext == null)
        return;

    var usuarioIdClaim = _httpContextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)
        ?? _httpContextAccessor.HttpContext.User.FindFirst("sub");

    if (usuarioIdClaim == null)
        return;

    var usuarioId = int.Parse(usuarioIdClaim.Value);
    var direccionIp = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress?.ToString();

    var entradasAuditables = ChangeTracker.Entries()
        .Where(e => e.Entity is not Auditoria
                 && e.Entity is not HistorialEstado
                 && (e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted))
        .ToList();

    foreach (var entrada in entradasAuditables)
    {
        var accion = entrada.State switch
        {
            EntityState.Added => "Creó",
            EntityState.Modified => "Editó",
            EntityState.Deleted => "Eliminó",
            _ => "Desconocida"
        };

        var nombreEntidad = entrada.Entity.GetType().Name;

        Auditorias.Add(new Auditoria
        {
            UsuarioId = usuarioId,
            Accion = $"{accion} {nombreEntidad}",
            Modulo = nombreEntidad,
            FechaHora = DateTime.UtcNow,
            DireccionIp = direccionIp
        });
    }
}


    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Ciudadano> Ciudadanos => Set<Ciudadano>();
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<HistorialEstado> HistorialEstados => Set<HistorialEstado>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();
    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<TipoSolicitud> TipoSolicitudes => Set<TipoSolicitud>();
    public DbSet<UsuarioProyecto> UsuarioProyectos => Set<UsuarioProyecto>();
    public DbSet<TipoSolicitud> TiposSolicitud => Set<TipoSolicitud>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Solicitud>()
            .Property(s => s.DatosAdicionales)
            .HasColumnType("jsonb");

        modelBuilder.Entity<UsuarioProyecto>()
            .HasKey(up => new { up.UsuarioId, up.ProyectoId });

        // Mapeo de nombres de tabla a snake_case (igual que en pgAdmin)
        modelBuilder.Entity<Usuario>().ToTable("usuarios");
        modelBuilder.Entity<Rol>().ToTable("roles");
        modelBuilder.Entity<Ciudadano>().ToTable("ciudadanos");
        modelBuilder.Entity<Empresa>().ToTable("empresas");
        modelBuilder.Entity<Solicitud>().ToTable("solicitudes");
        modelBuilder.Entity<Documento>().ToTable("documentos");
        modelBuilder.Entity<HistorialEstado>().ToTable("historial_estados");
        modelBuilder.Entity<Auditoria>().ToTable("auditoria");
        modelBuilder.Entity<Proyecto>().ToTable("proyectos");
        modelBuilder.Entity<TipoSolicitud>().ToTable("tipo_solicitudes");
        modelBuilder.Entity<UsuarioProyecto>().ToTable("usuario_proyecto");
    }
}