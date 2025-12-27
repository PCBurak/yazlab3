using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace yazlab3.web.Migrations
{
    /// <inheritdoc />
    public partial class Cargo5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_CargoRequests_UserId",
                table: "CargoRequests",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CargoRequests_Users_UserId",
                table: "CargoRequests",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CargoRequests_Users_UserId",
                table: "CargoRequests");

            migrationBuilder.DropIndex(
                name: "IX_CargoRequests_UserId",
                table: "CargoRequests");
        }
    }
}
