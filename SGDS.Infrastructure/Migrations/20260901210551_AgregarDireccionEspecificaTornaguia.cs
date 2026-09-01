using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDireccionEspecificaTornaguia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "direccion_especifica_destino",
                table: "tornaguias_infoconsumo",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "direccion_especifica_origen",
                table: "tornaguias_infoconsumo",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "lat_destino",
                table: "tornaguias_infoconsumo",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "lat_origen",
                table: "tornaguias_infoconsumo",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "lng_destino",
                table: "tornaguias_infoconsumo",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "lng_origen",
                table: "tornaguias_infoconsumo",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "direccion_especifica_destino",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "direccion_especifica_origen",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "lat_destino",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "lat_origen",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "lng_destino",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "lng_origen",
                table: "tornaguias_infoconsumo");
        }
    }
}
