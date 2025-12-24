using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace yazlab3.web.Migrations
{
    /// <inheritdoc />
    public partial class Cargo3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CargoType",
                table: "CargoRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverName",
                table: "CargoRequests",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "CargoRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CargoType",
                table: "CargoRequests");

            migrationBuilder.DropColumn(
                name: "ReceiverName",
                table: "CargoRequests");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CargoRequests");
        }
    }
}
