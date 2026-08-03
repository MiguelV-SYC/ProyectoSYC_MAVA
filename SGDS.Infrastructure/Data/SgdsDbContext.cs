using Microsoft.EntityFrameworkCore;
using SGDS.Domain.Entities;

namespace SGDS.Infrastructure.Data;

public class SgdsDbContext : DbContext
{
    public SgdsDbContext(DbContextOptions<SgdsDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<Ciudadano> Ciudadanos => Set<Ciudadano>();
    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<HistorialEstado> HistorialEstados => Set<HistorialEstado>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {

        modelBuilder.Entity<UsuarioRol>()
            .HasKey(ur => new { ur.UsuarioId, ur.RolId });

        // Mapeo de nombres de tabla a snake_case (igual que en pgAdmin)
        modelBuilder.Entity<Usuario>().ToTable("usuarios");
        modelBuilder.Entity<Rol>().ToTable("roles");
        modelBuilder.Entity<UsuarioRol>().ToTable("usuario_roles");
        modelBuilder.Entity<Ciudadano>().ToTable("ciudadanos");
        modelBuilder.Entity<Empresa>().ToTable("empresas");
        modelBuilder.Entity<Solicitud>().ToTable("solicitudes");
        modelBuilder.Entity<Documento>().ToTable("documentos");
        modelBuilder.Entity<HistorialEstado>().ToTable("historial_estados");
        modelBuilder.Entity<Auditoria>().ToTable("auditoria");
    }
}