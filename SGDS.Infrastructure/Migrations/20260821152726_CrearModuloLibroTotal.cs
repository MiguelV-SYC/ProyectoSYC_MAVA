using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CrearModuloLibroTotal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sedes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    ciudad = table.Column<string>(type: "text", nullable: false),
                    es_principal = table.Column<bool>(type: "boolean", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_sedes", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "turnos_libro_total",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    solicitud_id = table.Column<int>(type: "integer", nullable: false),
                    sede_id = table.Column<int>(type: "integer", nullable: false),
                    motivo = table.Column<string>(type: "text", nullable: false),
                    fecha_hora_cita = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_inicio_atencion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fecha_fin_atencion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tipificacion = table.Column<string>(type: "text", nullable: true),
                    motivo_no_asistio = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_turnos_libro_total", x => x.id);
                    table.ForeignKey(
                        name: "fk_turnos_libro_total_sedes_sede_id",
                        column: x => x.sede_id,
                        principalTable: "sedes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_turnos_libro_total_solicitudes_solicitud_id",
                        column: x => x.solicitud_id,
                        principalTable: "solicitudes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "sedes",
                columns: new[] { "id", "activo", "ciudad", "es_principal", "nombre" },
                values: new object[,]
                {
                    { 1, true, "Santander", true, "Bucaramanga" },
                    { 2, true, "Santander", false, "San Gil" },
                    { 3, true, "Santander", false, "Barrancabermeja" },
                    { 4, true, "Sucre", false, "Sincelejo" },
                    { 5, true, "Caquetá", false, "Florencia" },
                    { 6, true, "Huila", false, "Neiva" }
                });

            migrationBuilder.InsertData(
                table: "tipos_solicitud",
                columns: new[] { "id", "activo", "nombre", "proyecto_id" },
                values: new object[] { 30, true, "Atención en sede", 11 });

            migrationBuilder.CreateIndex(
                name: "ix_turnos_libro_total_sede_id",
                table: "turnos_libro_total",
                column: "sede_id");

            migrationBuilder.CreateIndex(
                name: "ix_turnos_libro_total_solicitud_id",
                table: "turnos_libro_total",
                column: "solicitud_id",
                unique: true);

            migrationBuilder.Sql("SELECT setval('tipos_solicitud_id_seq', (SELECT MAX(id) FROM tipos_solicitud));");
            migrationBuilder.Sql("SELECT setval('sedes_id_seq', (SELECT MAX(id) FROM sedes));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "turnos_libro_total");

            migrationBuilder.DropTable(
                name: "sedes");

            migrationBuilder.DeleteData(
                table: "tipos_solicitud",
                keyColumn: "id",
                keyValue: 30);
        }
    }
}
