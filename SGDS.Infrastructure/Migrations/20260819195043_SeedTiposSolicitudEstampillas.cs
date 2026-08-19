using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedTiposSolicitudEstampillas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "tipos_solicitud",
                columns: new[] { "id", "activo", "nombre", "proyecto_id" },
                values: new object[,]
                {
                    { 16, true, "Contrato", 10 },
                    { 17, true, "Convenio", 10 },
                    { 18, true, "Acto sin cuantía", 10 }
                });

            // InsertData usa IDs explícitos y no avanza la secuencia de identidad de Postgres —
            // se sincroniza manualmente para que los próximos INSERT (vía la API) no colisionen.
            migrationBuilder.Sql("SELECT setval('tipos_solicitud_id_seq', (SELECT MAX(id) FROM tipos_solicitud));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "tipos_solicitud",
                keyColumn: "id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "tipos_solicitud",
                keyColumn: "id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "tipos_solicitud",
                keyColumn: "id",
                keyValue: 18);
        }
    }
}
