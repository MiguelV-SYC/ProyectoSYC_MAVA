using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AmpliarProductoGravadoInfoconsumo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "gravamenes_arancelarios",
                table: "tornaguias_infoconsumo",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "numero_lote",
                table: "tornaguias_infoconsumo",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "origen_producto",
                table: "tornaguias_infoconsumo",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "peso_gramos",
                table: "tornaguias_infoconsumo",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subcategoria_producto",
                table: "tornaguias_infoconsumo",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "valor_aduana",
                table: "tornaguias_infoconsumo",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "gravamenes_arancelarios",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "numero_lote",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "origen_producto",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "peso_gramos",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "subcategoria_producto",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "valor_aduana",
                table: "tornaguias_infoconsumo");
        }
    }
}
