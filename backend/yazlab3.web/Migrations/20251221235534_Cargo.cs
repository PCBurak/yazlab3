using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace yazlab3.web.Migrations
{
    /// <inheritdoc />
    public partial class Cargo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Stations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CapacityKg = table.Column<int>(type: "int", nullable: false),
                    IsRented = table.Column<bool>(type: "bit", nullable: false),
                    RentalCost = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CargoRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StationId = table.Column<int>(type: "int", nullable: false),
                    CargoCount = table.Column<int>(type: "int", nullable: false),
                    TotalWeightKg = table.Column<int>(type: "int", nullable: false),
                    RequestDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CargoRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CargoRequests_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StationDistances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FromStationId = table.Column<int>(type: "int", nullable: false),
                    ToStationId = table.Column<int>(type: "int", nullable: false),
                    DistanceKm = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StationDistances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StationDistances_Stations_FromStationId",
                        column: x => x.FromStationId,
                        principalTable: "Stations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StationDistances_Stations_ToStationId",
                        column: x => x.ToStationId,
                        principalTable: "Stations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Routes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VehicleId = table.Column<int>(type: "int", nullable: false),
                    TotalDistanceKm = table.Column<double>(type: "float", nullable: false),
                    TotalCost = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Routes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Routes_Vehicles_VehicleId",
                        column: x => x.VehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RouteStations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RouteId = table.Column<int>(type: "int", nullable: false),
                    StationId = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RouteStations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RouteStations_Routes_RouteId",
                        column: x => x.RouteId,
                        principalTable: "Routes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RouteStations_Stations_StationId",
                        column: x => x.StationId,
                        principalTable: "Stations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Stations",
                columns: new[] { "Id", "Latitude", "Longitude", "Name" },
                values: new object[,]
                {
                    { 1, 40.715000000000003, 29.927, "Başiskele" },
                    { 2, 40.819000000000003, 29.373000000000001, "Çayırova" },
                    { 3, 40.773000000000003, 29.399999999999999, "Darıca" },
                    { 4, 40.756, 29.829999999999998, "Derince" },
                    { 5, 40.786999999999999, 29.544, "Dilovası" },
                    { 6, 40.802, 29.43, "Gebze" },
                    { 7, 40.716999999999999, 29.818000000000001, "Gölcük" },
                    { 8, 41.07, 30.149999999999999, "Kandıra" },
                    { 9, 40.692, 29.616, "Karamürsel" },
                    { 10, 40.753, 30.015999999999998, "Kartepe" },
                    { 11, 40.771000000000001, 29.742999999999999, "Körfez" },
                    { 12, 40.765000000000001, 29.940000000000001, "İzmit" },
                    { 99, 40.822200000000002, 29.921700000000001, "Umuttepe" }
                });

            migrationBuilder.InsertData(
                table: "Vehicles",
                columns: new[] { "Id", "CapacityKg", "IsRented", "RentalCost" },
                values: new object[,]
                {
                    { 1, 500, false, 0.0 },
                    { 2, 750, false, 0.0 },
                    { 3, 1000, false, 0.0 }
                });

            migrationBuilder.InsertData(
                table: "StationDistances",
                columns: new[] { "Id", "DistanceKm", "FromStationId", "ToStationId" },
                values: new object[,]
                {
                    { 1, 10.0, 1, 12 },
                    { 2, 15.0, 1, 7 },
                    { 3, 12.0, 1, 10 },
                    { 4, 15.0, 7, 1 },
                    { 5, 18.0, 7, 9 },
                    { 6, 18.0, 9, 7 },
                    { 7, 10.0, 12, 1 },
                    { 8, 10.0, 12, 10 },
                    { 9, 13.0, 12, 4 },
                    { 10, 40.0, 12, 8 },
                    { 11, 13.0, 4, 12 },
                    { 12, 8.0, 4, 11 },
                    { 13, 8.0, 11, 4 },
                    { 14, 16.0, 11, 5 },
                    { 15, 16.0, 5, 11 },
                    { 16, 10.0, 5, 6 },
                    { 17, 10.0, 6, 5 },
                    { 18, 7.0, 6, 2 },
                    { 19, 6.0, 6, 3 },
                    { 20, 7.0, 2, 6 },
                    { 21, 9.0, 2, 3 },
                    { 22, 6.0, 3, 6 },
                    { 23, 9.0, 3, 2 },
                    { 24, 40.0, 8, 12 },
                    { 25, 10.0, 10, 12 },
                    { 26, 12.0, 10, 1 },
                    { 100, 15.0, 99, 12 },
                    { 101, 15.0, 12, 99 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_CargoRequests_StationId",
                table: "CargoRequests",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_Routes_VehicleId",
                table: "Routes",
                column: "VehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_RouteStations_RouteId",
                table: "RouteStations",
                column: "RouteId");

            migrationBuilder.CreateIndex(
                name: "IX_RouteStations_StationId",
                table: "RouteStations",
                column: "StationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationDistances_FromStationId",
                table: "StationDistances",
                column: "FromStationId");

            migrationBuilder.CreateIndex(
                name: "IX_StationDistances_ToStationId",
                table: "StationDistances",
                column: "ToStationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CargoRequests");

            migrationBuilder.DropTable(
                name: "RouteStations");

            migrationBuilder.DropTable(
                name: "StationDistances");

            migrationBuilder.DropTable(
                name: "Routes");

            migrationBuilder.DropTable(
                name: "Stations");

            migrationBuilder.DropTable(
                name: "Vehicles");
        }
    }
}
