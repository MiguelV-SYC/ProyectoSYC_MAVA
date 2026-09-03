using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCaracteristicasVehiculoIUVAyBasesGravables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "blindado",
                table: "vehiculos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "cilindraje",
                table: "vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "departamento_matricula",
                table: "vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "es_clasico_antiguo",
                table: "vehiculos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "municipio_matricula",
                table: "vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subtipo",
                table: "vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_vehiculo",
                table: "vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "bases_gravables_vehiculos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    clase = table.Column<string>(type: "text", nullable: false),
                    marca = table.Column<string>(type: "text", nullable: false),
                    linea = table.Column<string>(type: "text", nullable: false),
                    cilindraje = table.Column<string>(type: "text", nullable: false),
                    tonelaje = table.Column<decimal>(type: "numeric", nullable: true),
                    pasajeros = table.Column<int>(type: "integer", nullable: true),
                    valor2001o_anterior = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2002 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2003 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2004 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2005 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2006 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2007 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2008 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2009 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2010 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2011 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2012 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2013 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2014 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2015 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2016 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2017 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2018 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2019 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2020 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2021 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2022 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2023 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2024 = table.Column<decimal>(type: "numeric", nullable: true),
                    valor2025 = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bases_gravables_vehiculos", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bases_gravables_vehiculos_tipo_marca_linea_cilindraje",
                table: "bases_gravables_vehiculos",
                columns: new[] { "tipo", "marca", "linea", "cilindraje" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bases_gravables_vehiculos");

            migrationBuilder.DropColumn(
                name: "blindado",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "cilindraje",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "departamento_matricula",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "es_clasico_antiguo",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "municipio_matricula",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "subtipo",
                table: "vehiculos");

            migrationBuilder.DropColumn(
                name: "tipo_vehiculo",
                table: "vehiculos");
        }
    }
}
