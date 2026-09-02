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
    public DbSet<OperacionIA> OperacionesIA => Set<OperacionIA>();
    public DbSet<TornaguiaInfoconsumo> TornaguiasInfoconsumo => Set<TornaguiaInfoconsumo>();
    public DbSet<EstampillaFisica> EstampillasFisicas => Set<EstampillaFisica>();
    public DbSet<LoteGoTrace> LotesGoTrace => Set<LoteGoTrace>();
    public DbSet<PuntoControlGoTrace> PuntosControlGoTrace => Set<PuntoControlGoTrace>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<InstrumentoPasivoLaboral> InstrumentosPasivoLaboral => Set<InstrumentoPasivoLaboral>();
    public DbSet<Sede> Sedes => Set<Sede>();
    public DbSet<TurnoLibroTotal> TurnosLibroTotal => Set<TurnoLibroTotal>();

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
        modelBuilder.Entity<TornaguiaInfoconsumo>()
            .HasOne(t => t.LoteGoTraceSolicitud)
            .WithMany()
            .HasForeignKey(t => t.LoteGoTraceSolicitudId)
            .OnDelete(DeleteBehavior.Restrict);

        // Catálogo de tipos de trámite del proyecto SYCTrace (id 7 en la BD real) — un único
        // tipo, coherente con el mockup ("SYCTrace solo maneja este único tipo de trámite").
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 25, ProyectoId = 7, Nombre = "Expedición de estampilla", Activo = true }
        );

        modelBuilder.Entity<EstampillaFisica>().ToTable("estampillas_fisicas");
        modelBuilder.Entity<EstampillaFisica>().HasIndex(e => e.SolicitudId).IsUnique();
        modelBuilder.Entity<EstampillaFisica>().HasIndex(e => e.SolicitudInfoconsumoId);
        modelBuilder.Entity<EstampillaFisica>()
            .HasOne(e => e.Solicitud)
            .WithOne(s => s.EstampillaFisica)
            .HasForeignKey<EstampillaFisica>(e => e.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<EstampillaFisica>()
            .HasOne(e => e.SolicitudInfoconsumo)
            .WithMany()
            .HasForeignKey(e => e.SolicitudInfoconsumoId)
            .OnDelete(DeleteBehavior.Restrict);

        // Catálogo de tipos de trámite del proyecto Gotrace (id 9 en la BD real) — un único
        // tipo, coherente con el mockup ("Gotrace está en reingeniería — por ahora maneja un
        // único tipo de solicitud").
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 26, ProyectoId = 9, Nombre = "Registro de trazabilidad de lote", Activo = true }
        );

        modelBuilder.Entity<LoteGoTrace>().ToTable("lotes_gotrace");
        modelBuilder.Entity<LoteGoTrace>().HasIndex(l => l.SolicitudId).IsUnique();
        modelBuilder.Entity<LoteGoTrace>()
            .HasOne(l => l.Solicitud)
            .WithOne(s => s.LoteGoTrace)
            .HasForeignKey<LoteGoTrace>(l => l.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PuntoControlGoTrace>().ToTable("puntos_control_gotrace");
        modelBuilder.Entity<PuntoControlGoTrace>()
            .HasOne(p => p.LoteGoTrace)
            .WithMany(l => l.PuntosControl)
            .HasForeignKey(p => p.LoteGoTraceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Catálogo de productos por empresa (RN GoTrace "Nueva Empresa") — un lote referencia
        // opcionalmente la fila del catálogo que lo originó; si esa fila se borra, el lote
        // conserva su copia de texto en LoteGoTrace.Producto (SetNull, no cascada).
        modelBuilder.Entity<Producto>().ToTable("productos");
        modelBuilder.Entity<Producto>()
            .HasOne(p => p.Empresa)
            .WithMany(e => e.Productos)
            .HasForeignKey(p => p.EmpresaId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<LoteGoTrace>()
            .HasOne(l => l.ProductoCatalogo)
            .WithMany()
            .HasForeignKey(l => l.ProductoCatalogoId)
            .OnDelete(DeleteBehavior.SetNull);

        // Catálogo de tipos de trámite del proyecto Pasivos Laborales (id 6 en la BD real).
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 27, ProyectoId = 6, Nombre = "Gestión de pasivo pensional", Activo = true },
            new TipoSolicitud { Id = 28, ProyectoId = 6, Nombre = "Gestión de pasivo laboral", Activo = true },
            new TipoSolicitud { Id = 29, ProyectoId = 6, Nombre = "Consulta de expediente digital", Activo = true }
        );

        modelBuilder.Entity<InstrumentoPasivoLaboral>().ToTable("instrumentos_pasivo_laboral");
        modelBuilder.Entity<InstrumentoPasivoLaboral>().HasIndex(i => i.SolicitudId).IsUnique();
        modelBuilder.Entity<InstrumentoPasivoLaboral>()
            .HasOne(i => i.Solicitud)
            .WithOne(s => s.InstrumentoPasivoLaboral)
            .HasForeignKey<InstrumentoPasivoLaboral>(i => i.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<InstrumentoPasivoLaboral>()
            .HasOne(i => i.SolicitudColpensiones)
            .WithMany()
            .HasForeignKey(i => i.SolicitudColpensionesId)
            .OnDelete(DeleteBehavior.Restrict);

        // Catálogo de tipos de trámite del proyecto Libro Total (id 11 en la BD real) — un
        // único tipo ("la solicitud nace cuando el ciudadano llega a la sede"), coherente con
        // el patrón ya usado en SYCTrace/Gotrace para proyectos de un solo tipo de trámite.
        modelBuilder.Entity<TipoSolicitud>().HasData(
            new TipoSolicitud { Id = 30, ProyectoId = 11, Nombre = "Atención en sede", Activo = true }
        );

        modelBuilder.Entity<Sede>().ToTable("sedes");
        modelBuilder.Entity<Sede>().HasData(
            new Sede { Id = 1, Nombre = "Bucaramanga", Ciudad = "Santander", EsPrincipal = true, Activo = true },
            new Sede { Id = 2, Nombre = "San Gil", Ciudad = "Santander", EsPrincipal = false, Activo = true },
            new Sede { Id = 3, Nombre = "Barrancabermeja", Ciudad = "Santander", EsPrincipal = false, Activo = true },
            new Sede { Id = 4, Nombre = "Sincelejo", Ciudad = "Sucre", EsPrincipal = false, Activo = true },
            // Florencia se retira de la red de sedes activas (novedad: la red pasa de 6 a 9
            // sedes, sumando Arauca/Armenia/Mocoa/Riohacha y descontinuando Florencia) — se
            // inactiva en vez de eliminarse para no romper turnos históricos que la referencian.
            new Sede { Id = 5, Nombre = "Florencia", Ciudad = "Caquetá", EsPrincipal = false, Activo = false },
            new Sede { Id = 6, Nombre = "Neiva", Ciudad = "Huila", EsPrincipal = false, Activo = true },
            new Sede { Id = 7, Nombre = "Arauca", Ciudad = "Arauca", EsPrincipal = false, Activo = true },
            new Sede { Id = 8, Nombre = "Armenia", Ciudad = "Quindío", EsPrincipal = false, Activo = true },
            new Sede { Id = 9, Nombre = "Mocoa", Ciudad = "Putumayo", EsPrincipal = false, Activo = true },
            new Sede { Id = 10, Nombre = "Riohacha", Ciudad = "La Guajira", EsPrincipal = false, Activo = true }
        );

        modelBuilder.Entity<TurnoLibroTotal>().ToTable("turnos_libro_total");
        modelBuilder.Entity<TurnoLibroTotal>().HasIndex(t => t.SolicitudId).IsUnique();
        modelBuilder.Entity<TurnoLibroTotal>()
            .HasOne(t => t.Solicitud)
            .WithOne(s => s.TurnoLibroTotal)
            .HasForeignKey<TurnoLibroTotal>(t => t.SolicitudId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TurnoLibroTotal>()
            .HasOne(t => t.Sede)
            .WithMany(s => s.Turnos)
            .HasForeignKey(t => t.SedeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Perfil Gerencial: visibilidad de solo lectura sobre los 9 proyectos activos, creado
        // exclusivamente por un Administrador SYC desde Gestión de Usuarios — nunca vía
        // login/solicitar-acceso (bloqueado explícitamente en SolicitudesAccesoController).
        modelBuilder.Entity<Rol>().HasData(
            new Rol { Id = 4, Nombre = "Gerencial" }
        );

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
        modelBuilder.Entity<OperacionIA>().ToTable("operaciones_ia");


    }
}