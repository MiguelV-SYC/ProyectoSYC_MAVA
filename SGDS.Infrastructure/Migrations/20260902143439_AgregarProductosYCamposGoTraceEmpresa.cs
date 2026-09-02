using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarProductosYCamposGoTraceEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "modo_generacion_uid",
                table: "lotes_gotrace",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "producto_catalogo_id",
                table: "lotes_gotrace",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "departamento",
                table: "empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "estado",
                table: "empresas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_empresa",
                table: "empresas",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "productos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    empresa_id = table.Column<int>(type: "integer", nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    presentacion = table.Column<string>(type: "text", nullable: false),
                    contenido = table.Column<decimal>(type: "numeric", nullable: false),
                    unidad_medida = table.Column<string>(type: "text", nullable: false),
                    relacion = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_productos", x => x.id);
                    table.ForeignKey(
                        name: "fk_productos_empresas_empresa_id",
                        column: x => x.empresa_id,
                        principalTable: "empresas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_lotes_gotrace_producto_catalogo_id",
                table: "lotes_gotrace",
                column: "producto_catalogo_id");

            migrationBuilder.CreateIndex(
                name: "ix_productos_empresa_id",
                table: "productos",
                column: "empresa_id");

            migrationBuilder.AddForeignKey(
                name: "fk_lotes_gotrace_productos_producto_catalogo_id",
                table: "lotes_gotrace",
                column: "producto_catalogo_id",
                principalTable: "productos",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_lotes_gotrace_productos_producto_catalogo_id",
                table: "lotes_gotrace");

            migrationBuilder.DropTable(
                name: "productos");

            migrationBuilder.DropIndex(
                name: "ix_lotes_gotrace_producto_catalogo_id",
                table: "lotes_gotrace");

            migrationBuilder.DropColumn(
                name: "modo_generacion_uid",
                table: "lotes_gotrace");

            migrationBuilder.DropColumn(
                name: "producto_catalogo_id",
                table: "lotes_gotrace");

            migrationBuilder.DropColumn(
                name: "departamento",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "estado",
                table: "empresas");

            migrationBuilder.DropColumn(
                name: "tipo_empresa",
                table: "empresas");
        }
    }
}
