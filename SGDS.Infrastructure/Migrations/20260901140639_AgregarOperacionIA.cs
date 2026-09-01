using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarOperacionIA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "operaciones_ia",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario_id = table.Column<int>(type: "integer", nullable: false),
                    proyecto_id = table.Column<int>(type: "integer", nullable: true),
                    tipo_analisis = table.Column<string>(type: "text", nullable: false),
                    modelo = table.Column<string>(type: "text", nullable: false),
                    entrada = table.Column<string>(type: "text", nullable: false),
                    resultado = table.Column<string>(type: "text", nullable: false),
                    fecha_hora = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_operaciones_ia", x => x.id);
                    table.ForeignKey(
                        name: "fk_operaciones_ia_proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "proyectos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_operaciones_ia_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_operaciones_ia_proyecto_id",
                table: "operaciones_ia",
                column: "proyecto_id");

            migrationBuilder.CreateIndex(
                name: "ix_operaciones_ia_usuario_id",
                table: "operaciones_ia",
                column: "usuario_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "operaciones_ia");
        }
    }
}
