using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarRedSedesLibroTotal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 5,
                column: "activo",
                value: false);

            migrationBuilder.InsertData(
                table: "sedes",
                columns: new[] { "id", "activo", "ciudad", "es_principal", "nombre" },
                values: new object[,]
                {
                    { 7, true, "Arauca", false, "Arauca" },
                    { 8, true, "Quindío", false, "Armenia" },
                    { 9, true, "Putumayo", false, "Mocoa" },
                    { 10, true, "La Guajira", false, "Riohacha" }
                });

            migrationBuilder.Sql("SELECT setval('sedes_id_seq', (SELECT MAX(id) FROM sedes));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 10);

            migrationBuilder.UpdateData(
                table: "sedes",
                keyColumn: "id",
                keyValue: 5,
                column: "activo",
                value: true);
        }
    }
}
