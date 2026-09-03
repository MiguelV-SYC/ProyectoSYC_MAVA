using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSubcategoriaYPesoEstampillaFisica : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "peso_gramos",
                table: "estampillas_fisicas",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subcategoria_producto",
                table: "estampillas_fisicas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "peso_gramos",
                table: "estampillas_fisicas");

            migrationBuilder.DropColumn(
                name: "subcategoria_producto",
                table: "estampillas_fisicas");
        }
    }
}
