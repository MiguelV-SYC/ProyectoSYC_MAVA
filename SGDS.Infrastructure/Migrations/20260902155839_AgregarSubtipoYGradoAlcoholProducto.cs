using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarSubtipoYGradoAlcoholProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "grado_alcoholimetrico",
                table: "productos",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subtipo",
                table: "productos",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "grado_alcoholimetrico",
                table: "productos");

            migrationBuilder.DropColumn(
                name: "subtipo",
                table: "productos");
        }
    }
}
