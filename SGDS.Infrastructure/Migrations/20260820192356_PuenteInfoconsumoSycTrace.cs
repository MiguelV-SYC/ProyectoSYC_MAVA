using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PuenteInfoconsumoSycTrace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_estampillas_fisicas_solicitudes_solicitud_estampillas_id",
                table: "estampillas_fisicas");

            migrationBuilder.RenameColumn(
                name: "solicitud_estampillas_id",
                table: "estampillas_fisicas",
                newName: "solicitud_infoconsumo_id");

            migrationBuilder.RenameIndex(
                name: "ix_estampillas_fisicas_solicitud_estampillas_id",
                table: "estampillas_fisicas",
                newName: "ix_estampillas_fisicas_solicitud_infoconsumo_id");

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_pago_confirmado",
                table: "tornaguias_infoconsumo",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "pago_confirmado",
                table: "tornaguias_infoconsumo",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "fk_estampillas_fisicas_solicitudes_solicitud_infoconsumo_id",
                table: "estampillas_fisicas",
                column: "solicitud_infoconsumo_id",
                principalTable: "solicitudes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_estampillas_fisicas_solicitudes_solicitud_infoconsumo_id",
                table: "estampillas_fisicas");

            migrationBuilder.DropColumn(
                name: "fecha_pago_confirmado",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "pago_confirmado",
                table: "tornaguias_infoconsumo");

            migrationBuilder.RenameColumn(
                name: "solicitud_infoconsumo_id",
                table: "estampillas_fisicas",
                newName: "solicitud_estampillas_id");

            migrationBuilder.RenameIndex(
                name: "ix_estampillas_fisicas_solicitud_infoconsumo_id",
                table: "estampillas_fisicas",
                newName: "ix_estampillas_fisicas_solicitud_estampillas_id");

            migrationBuilder.AddForeignKey(
                name: "fk_estampillas_fisicas_solicitudes_solicitud_estampillas_id",
                table: "estampillas_fisicas",
                column: "solicitud_estampillas_id",
                principalTable: "solicitudes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
