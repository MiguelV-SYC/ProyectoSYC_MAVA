using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SGDS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PuenteGoTraceInfoconsumo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "lote_go_trace_solicitud_id",
                table: "tornaguias_infoconsumo",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_tornaguias_infoconsumo_lote_go_trace_solicitud_id",
                table: "tornaguias_infoconsumo",
                column: "lote_go_trace_solicitud_id");

            migrationBuilder.AddForeignKey(
                name: "fk_tornaguias_infoconsumo_solicitudes_lote_go_trace_solicitud_",
                table: "tornaguias_infoconsumo",
                column: "lote_go_trace_solicitud_id",
                principalTable: "solicitudes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_tornaguias_infoconsumo_solicitudes_lote_go_trace_solicitud_",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropIndex(
                name: "ix_tornaguias_infoconsumo_lote_go_trace_solicitud_id",
                table: "tornaguias_infoconsumo");

            migrationBuilder.DropColumn(
                name: "lote_go_trace_solicitud_id",
                table: "tornaguias_infoconsumo");
        }
    }
}
