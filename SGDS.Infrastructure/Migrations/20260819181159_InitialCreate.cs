using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ciudadanos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipo_documento = table.Column<string>(type: "text", nullable: false),
                    numero_documento = table.Column<string>(type: "text", nullable: false),
                    nombre_completo = table.Column<string>(type: "text", nullable: false),
                    telefono = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    ciudad = table.Column<string>(type: "text", nullable: true),
                    direccion = table.Column<string>(type: "text", nullable: true),
                    fecha_registro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ciudadanos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "empresas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nit = table.Column<string>(type: "text", nullable: false),
                    razon_social = table.Column<string>(type: "text", nullable: false),
                    representante_legal = table.Column<string>(type: "text", nullable: true),
                    telefono = table.Column<string>(type: "text", nullable: true),
                    correo = table.Column<string>(type: "text", nullable: true),
                    ciudad = table.Column<string>(type: "text", nullable: true),
                    direccion = table.Column<string>(type: "text", nullable: true),
                    fecha_registro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_empresas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "proyectos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    codigo = table.Column<string>(type: "text", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    estado_personalizado = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_proyectos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "solicitud_acceso",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre_completo = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    documento_identidad = table.Column<string>(type: "text", nullable: false),
                    telefono = table.Column<string>(type: "text", nullable: true),
                    rol_solicitado = table.Column<string>(type: "text", nullable: false),
                    motivo = table.Column<string>(type: "text", nullable: true),
                    estado = table.Column<string>(type: "text", nullable: false),
                    fecha_solicitud = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_solicitud_acceso", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre_completo = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuarios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "vehiculos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ciudadano_id = table.Column<int>(type: "integer", nullable: true),
                    empresa_id = table.Column<int>(type: "integer", nullable: true),
                    placa = table.Column<string>(type: "text", nullable: false),
                    marca = table.Column<string>(type: "text", nullable: true),
                    linea = table.Column<string>(type: "text", nullable: true),
                    modelo = table.Column<int>(type: "integer", nullable: true),
                    numero_chasis = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_vehiculos", x => x.id);
                    table.ForeignKey(
                        name: "fk_vehiculos_ciudadanos_ciudadano_id",
                        column: x => x.ciudadano_id,
                        principalTable: "ciudadanos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_vehiculos_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "tipos_solicitud",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    proyecto_id = table.Column<int>(type: "integer", nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tipos_solicitud", x => x.id);
                    table.ForeignKey(
                        name: "fk_tipos_solicitud_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "solicitud_acceso_proyecto",
                columns: table => new
                {
                    solicitud_acceso_id = table.Column<int>(type: "integer", nullable: false),
                    proyecto_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_solicitud_acceso_proyecto", x => new { x.solicitud_acceso_id, x.proyecto_id });
                    table.ForeignKey(
                        name: "fk_solicitud_acceso_proyecto_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_solicitud_acceso_proyecto_solicitud_acceso_solicitud_acceso",
                        column: x => x.solicitud_acceso_id,
                        principalTable: "solicitud_acceso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "auditoria",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<int>(type: "integer", nullable: true),
                    accion = table.Column<string>(type: "text", nullable: false),
                    modulo = table.Column<string>(type: "text", nullable: true),
                    fecha_hora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    direccion_ip = table.Column<string>(type: "text", nullable: true),
                    proyecto_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_auditoria", x => x.id);
                    table.ForeignKey(
                        name: "fk_auditoria_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_auditoria_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "reportes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    proyecto_id = table.Column<int>(type: "integer", nullable: true),
                    usuario_id = table.Column<int>(type: "integer", nullable: true),
                    nombre_archivo = table.Column<string>(type: "text", nullable: false),
                    formato = table.Column<string>(type: "text", nullable: false),
                    ruta_archivo = table.Column<string>(type: "text", nullable: false),
                    total_registros = table.Column<int>(type: "integer", nullable: false),
                    fecha_generacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_reportes", x => x.id);
                    table.ForeignKey(
                        name: "fk_reportes_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_reportes_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "usuario_proyecto",
                columns: table => new
                {
                    usuario_id = table.Column<int>(type: "integer", nullable: false),
                    proyecto_id = table.Column<int>(type: "integer", nullable: false),
                    rol_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuario_proyecto", x => new { x.usuario_id, x.proyecto_id });
                    table.ForeignKey(
                        name: "fk_usuario_proyecto_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_usuario_proyecto_roles_rol_id",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_usuario_proyecto_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "solicitudes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ciudadano_id = table.Column<int>(type: "integer", nullable: true),
                    empresa_id = table.Column<int>(type: "integer", nullable: true),
                    usuario_asignado_id = table.Column<int>(type: "integer", nullable: true),
                    estado = table.Column<string>(type: "text", nullable: false),
                    fecha_creacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_cierre = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fecha_limite = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    proyecto_id = table.Column<int>(type: "integer", nullable: true),
                    tipo_solicitud_id = table.Column<int>(type: "integer", nullable: true),
                    datos_adicionales = table.Column<string>(type: "jsonb", nullable: true),
                    vehiculo_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_solicitudes", x => x.id);
                    table.ForeignKey(
                        name: "fk_solicitudes_ciudadanos_ciudadano_id",
                        column: x => x.ciudadano_id,
                        principalTable: "ciudadanos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_solicitudes_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_solicitudes_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_solicitudes_tipos_solicitudes_tipo_solicitud_id",
                        column: x => x.tipo_solicitud_id,
                        principalTable: "tipos_solicitud",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_solicitudes_usuarios_usuario_asignado_id",
                        column: x => x.usuario_asignado_id,
                        principalTable: "usuarios",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_solicitudes_vehiculos_vehiculo_id",
                        column: x => x.vehiculo_id,
                        principalTable: "vehiculos",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "documentos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    solicitud_id = table.Column<int>(type: "integer", nullable: false),
                    nombre_archivo = table.Column<string>(type: "text", nullable: false),
                    ruta_archivo = table.Column<string>(type: "text", nullable: false),
                    fecha_carga = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tamano_bytes = table.Column<long>(type: "bigint", nullable: true),
                    tipo_archivo = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_documentos", x => x.id);
                    table.ForeignKey(
                        name: "fk_documentos_solicitudes_solicitud_id",
                        column: x => x.solicitud_id,
                        principalTable: "solicitudes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "historial_estados",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    solicitud_id = table.Column<int>(type: "integer", nullable: false),
                    estado_anterior = table.Column<string>(type: "text", nullable: true),
                    estado_nuevo = table.Column<string>(type: "text", nullable: false),
                    fecha_cambio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    usuario_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_historial_estados", x => x.id);
                    table.ForeignKey(
                        name: "fk_historial_estados_solicitudes_solicitud_id",
                        column: x => x.solicitud_id,
                        principalTable: "solicitudes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_historial_estados_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateIndex(
                name: "ix_auditoria_proyecto_id",
                table: "auditoria",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_auditoria_usuario_id",
                table: "auditoria",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_ciudadanos_numero_documento",
                table: "ciudadanos",
                column: "numero_documento",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_documentos_solicitud_id",
                table: "documentos",
                column: "solicitud_id");

            migrationBuilder.CreateIndex(
                name: "ix_empresas_nit",
                table: "empresas",
                column: "nit",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_historial_estados_solicitud_id",
                table: "historial_estados",
                column: "solicitud_id");

            migrationBuilder.CreateIndex(
                name: "ix_historial_estados_usuario_id",
                table: "historial_estados",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_proyectos_codigo",
                table: "proyectos",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_reportes_proyecto_id",
                table: "reportes",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_reportes_usuario_id",
                table: "reportes",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "ix_roles_nombre",
                table: "roles",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_solicitud_acceso_proyecto_proyecto_id",
                table: "solicitud_acceso_proyecto",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_ciudadano_id",
                table: "solicitudes",
                column: "ciudadano_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_empresa_id",
                table: "solicitudes",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_proyecto_id",
                table: "solicitudes",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_tipo_solicitud_id",
                table: "solicitudes",
                column: "tipo_solicitud_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_usuario_asignado_id",
                table: "solicitudes",
                column: "usuario_asignado_id");

            migrationBuilder.CreateIndex(
                name: "ix_solicitudes_vehiculo_id",
                table: "solicitudes",
                column: "vehiculo_id");

            migrationBuilder.CreateIndex(
                name: "ix_tipos_solicitud_proyecto_id",
                table: "tipos_solicitud",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuario_proyecto_proyecto_id",
                table: "usuario_proyecto",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuario_proyecto_rol_id",
                table: "usuario_proyecto",
                column: "rol_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_email",
                table: "usuarios",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_vehiculos_ciudadano_id",
                table: "vehiculos",
                column: "ciudadano_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehiculos_empresa_id",
                table: "vehiculos",
                column: "empresa_id");

            migrationBuilder.CreateIndex(
                name: "ix_vehiculos_placa",
                table: "vehiculos",
                column: "placa",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditoria");

            migrationBuilder.DropTable(
                name: "documentos");

            migrationBuilder.DropTable(
                name: "historial_estados");

            migrationBuilder.DropTable(
                name: "reportes");

            migrationBuilder.DropTable(
                name: "solicitud_acceso_proyecto");

            migrationBuilder.DropTable(
                name: "usuario_proyecto");

            migrationBuilder.DropTable(
                name: "solicitudes");

            migrationBuilder.DropTable(
                name: "solicitud_acceso");

            migrationBuilder.DropTable(
                name: "roles");

            migrationBuilder.DropTable(
                name: "tipos_solicitud");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "vehiculos");

            migrationBuilder.DropTable(
                name: "proyectos");

            migrationBuilder.DropTable(
                name: "ciudadanos");

            migrationBuilder.DropTable(
                name: "empresas");
        }
    }
}
