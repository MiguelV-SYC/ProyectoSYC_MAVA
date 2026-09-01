using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarLogoEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ruta_logo",
                table: "empresas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ruta_logo",
                table: "empresas");
        }
    }
}
