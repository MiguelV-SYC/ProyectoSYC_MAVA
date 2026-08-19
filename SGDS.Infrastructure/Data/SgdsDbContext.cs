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
        var proyectoId = ObtenerProyectoId(entrada.Entity);

        Auditorias.Add(new Auditoria
        {
            UsuarioId = usuarioId,
            ProyectoId = proyectoId,
            Accion = $"{accion} {nombreEntidad}",
            Modulo = nombreEntidad,
            FechaHora = DateTime.UtcNow,
            DireccionIp = direccionIp
        });
    }
}

private static int? ObtenerProyectoId(object entidad)
{
    if (entidad is Solicitud solicitud)
        return solicitud.ProyectoId;

    if (entidad is TipoSolicitud tipoSolicitud)
        return tipoSolicitud.ProyectoId;

    return null;
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
    public DbSet<TipoSolicitud> TiposSolicitudes => Set<TipoSolicitud>();
    public DbSet<UsuarioProyecto> UsuarioProyectos => Set<UsuarioProyecto>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<SolicitudAcceso> SolicitudesAcceso => Set<SolicitudAcceso>();
    public DbSet<SolicitudAccesoProyecto> SolicitudAccesoProyectos => Set<SolicitudAccesoProyecto>();
    public DbSet<Reporte> Reportes => Set<Reporte>();
    public DbSet<TornaguiaInfoconsumo> TornaguiasInfoconsumo => Set<TornaguiaInfoconsumo>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Solicitud>()
            .Property(s => s.DatosAdicionales)
            .HasColumnType("jsonb");

        modelBuilder.Entity<TipoSolicitud>().ToTable("tipos_solicitud");

        // Restricciones UNIQUE ya existentes en la base de datos real (creadas a mano antes de
        // introducir EF Core Migrations) — se declaran aquí para que el modelo las refleje.
        modelBuilder.Entity<Ciudadano>().HasIndex(c => c.NumeroDocumento).IsUnique();
        modelBuilder.Entity<Empresa>().HasIndex(e => e.Nit).IsUnique();
        modelBuilder.Entity<Proyecto>().HasIndex(p => p.Codigo).IsUnique();
        modelBuilder.Entity<Rol>().HasIndex(r => r.Nombre).IsUnique();
        modelBuilder.Entity<Usuario>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Vehiculo>().HasIndex(v => v.Placa).IsUnique();

        // Catálogo de tipos de solicitud del proyecto Estampillas (id 10 en la BD real).
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 16, ProyectoId = 10, Nombre = "Contrato", Activo = true },
            new TipoSolicitud { Id = 17, ProyectoId = 10, Nombre = "Convenio", Activo = true },
            new TipoSolicitud { Id = 18, ProyectoId = 10, Nombre = "Acto sin cuantía", Activo = true }
        );

        // Catálogo de tipos de trámite (tornaguía) del proyecto Infoconsumo (id 8 en la BD real).
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 20, ProyectoId = 8, Nombre = "Movilización", Activo = true },
            new TipoSolicitud { Id = 21, ProyectoId = 8, Nombre = "Reenvío", Activo = true },
            new TipoSolicitud { Id = 22, ProyectoId = 8, Nombre = "Tránsito", Activo = true },
            new TipoSolicitud { Id = 23, ProyectoId = 8, Nombre = "Tránsito local", Activo = true },
            new TipoSolicitud { Id = 24, ProyectoId = 8, Nombre = "Tránsito declarado", Activo = true }
        );

        modelBuilder.Entity<TornaguiaInfoconsumo>().ToTable("tornaguias_infoconsumo");
        modelBuilder.Entity<TornaguiaInfoconsumo>().HasIndex(t => t.SolicitudId).IsUnique();
        modelBuilder.Entity<TornaguiaInfoconsumo>().HasIndex(t => new { t.PlacaVehiculo, t.NitTransportador });
        modelBuilder.Entity<TornaguiaInfoconsumo>()
            .HasOne(t => t.Solicitud)
            .WithOne(s => s.TornaguiaInfoconsumo)
            .HasForeignKey<TornaguiaInfoconsumo>(t => t.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UsuarioProyecto>()
            .HasKey(up => new { up.UsuarioId, up.ProyectoId });

        modelBuilder.Entity<SolicitudAccesoProyecto>()
            .HasKey(sap => new { sap.SolicitudAccesoId, sap.ProyectoId});

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
        modelBuilder.Entity<TipoSolicitud>().ToTable("tipos_solicitud");
        modelBuilder.Entity<UsuarioProyecto>().ToTable("usuario_proyecto");
        modelBuilder.Entity<Vehiculo>().ToTable("vehiculos");
        modelBuilder.Entity<SolicitudAcceso>().ToTable("solicitud_acceso");
        modelBuilder.Entity<SolicitudAccesoProyecto>().ToTable("solicitud_acceso_proyecto");
        modelBuilder.Entity<Reporte>().ToTable("reportes");


    }
}