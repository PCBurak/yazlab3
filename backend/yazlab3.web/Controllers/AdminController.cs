using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using yazlab3.web.Data;
using yazlab3.web.DTOs;
using yazlab3.web.Models;
using yazlab3.web.Services;
using System;
using System.Linq;
using System.Collections.Generic;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IRoutePlanningService _routeService;
        private readonly AppDbContext _db;

        public AdminController(IRoutePlanningService routeService, AppDbContext db)
        {
            _routeService = routeService;
            _db = db;
        }

        [HttpPost("run-scenario")]
        public IActionResult RunScenario([FromBody] ScenarioRunRequestDto dto)
        {
            // 1) Pull scenario rows (district name -> cargo/weight)
            var rows = ScenarioData.GetScenario(dto.ScenarioId);

            // 2) Map StationName -> StationId from DB
            var stationMap = _db.Stations
                .AsNoTracking()
                .ToList()
                .ToDictionary(s => Normalize(s.Name), s => s.Id);

            // 3) Build CargoRequest list using REAL StationIds
            var cargoEntities = new List<CargoRequest>();
            var missing = new List<string>();

            foreach (var r in rows)
            {
                if (r.CargoCount == 0 && r.TotalWeightKg == 0) continue;

                if (!stationMap.TryGetValue(Normalize(r.StationName), out var stationId))
                {
                    missing.Add(r.StationName);
                    continue;
                }

                cargoEntities.Add(new CargoRequest
                {
                    StationId = stationId,
                    CargoCount = r.CargoCount,
                    TotalWeightKg = r.TotalWeightKg,
                    RequestDate = DateTime.UtcNow,
                    Station = null
                });
            }

            if (missing.Count > 0)
            {
                return BadRequest(new { message = "Stations missing in DB", missing });
            }

            // 4) Execute Route Planning
            var routes = _routeService.PlanRoutes(cargoEntities, dto.UnlimitedVehicles);

            // 5) CONVERT TO DTO (WITH MAP PATHS)
            var response = routes.Select(r =>
            {
                // FIX: Convert ICollection to List and Sort by Order to allow Indexing [0]
                var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();

                var routeDto = new UserRouteResponseDto
                {
                    VehicleId = r.VehicleId,
                    TotalDistanceKm = r.TotalDistanceKm,
                    TotalCost = r.TotalCost,
                    Route = sortedStops.Select(rs => new StationRouteDto
                    {
                        StationId = rs.StationId,
                        StationName = rs.Station.Name,
                        Order = rs.Order,
                        Latitude = rs.Station.Latitude,
                        Longitude = rs.Station.Longitude
                    }).ToList()
                };

                // --- MAP LOGIC ---
                // A. Path from Depot (Umuttepe ID 99) to First Stop
                if (sortedStops.Count > 0)
                {
                    var firstStop = sortedStops[0];
                    // Fetch path coordinates from 99 -> First Stop
                    var startPath = _routeService.GetPathCoordinates(99, firstStop.StationId);
                    routeDto.PathCoordinates.AddRange(startPath);
                }

                // B. Path between Stops
                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    var currentStop = sortedStops[i];
                    var nextStop = sortedStops[i + 1];

                    var segmentPoints = _routeService.GetPathCoordinates(currentStop.StationId, nextStop.StationId);
                    routeDto.PathCoordinates.AddRange(segmentPoints);
                }

                return routeDto;
            }).ToList();

            return Ok(response);
        }

        private static string Normalize(string s)
            => (s ?? "").Trim().ToLowerInvariant()
                .Replace("ı", "i").Replace("İ", "i").Replace("ç", "c")
                .Replace("ğ", "g").Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");


        [HttpPost("plan-dynamic")]
        public IActionResult PlanDynamicRoutes([FromBody] bool unlimitedVehicles)
        {
            // 1. Fetch ALL cargo requests from the Database (Simulating "Next Day" planning)
            // In a real app, you might filter by Date, e.g., .Where(r => r.RequestDate.Date == DateTime.Today.AddDays(1))
            var dbRequests = _db.CargoRequests.ToList();

            if (!dbRequests.Any())
            {
                return BadRequest(new { message = "No cargo requests found in the database. Go to the User page and add some!" });
            }

            // 2. Run the existing Route Algorithm on this Real Data
            var routes = _routeService.PlanRoutes(dbRequests, unlimitedVehicles);

                        // 3. SAVE to Database (Requirement: "All expeditions must be recorded" [cite: 27])
                        // We clear old routes for this demo to avoid duplicates, or you can append them.
                        // _db.Routes.RemoveRange(_db.Routes); 
                        // _db.SaveChanges();

            _db.Routes.AddRange(routes);
            _db.SaveChanges();

            // 4. Convert to DTO for the Map (Same logic as RunScenario)
            var response = routes.Select(r =>
            {
                // Sort stops by Order
                var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();

                var routeDto = new UserRouteResponseDto
                {
                    VehicleId = r.VehicleId,
                    TotalDistanceKm = r.TotalDistanceKm,
                    TotalCost = r.TotalCost,
                    Route = sortedStops.Select(rs => new StationRouteDto
                    {
                        StationId = rs.StationId,
                        StationName = rs.Station?.Name ?? "Unknown", // Handle nulls safely
                        Order = rs.Order,
                        Latitude = rs.Station?.Latitude ?? 0,
                        Longitude = rs.Station?.Longitude ?? 0
                    }).ToList()
                };

                // Add Path from Depot (99) -> First Stop
                if (sortedStops.Any())
                {
                    var first = sortedStops.First();
                    var startPath = _routeService.GetPathCoordinates(99, first.StationId);
                    routeDto.PathCoordinates.AddRange(startPath);
                }

                // Add Paths between stops
                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    var cur = sortedStops[i];
                    var next = sortedStops[i + 1];
                    var seg = _routeService.GetPathCoordinates(cur.StationId, next.StationId);
                    routeDto.PathCoordinates.AddRange(seg);
                }

                return routeDto;
            }).ToList();

            return Ok(response);
        }

        [HttpPost("plan-routes")] // Ensure this matches your frontend call
        public IActionResult PlanRoutes([FromBody] PlanRequestDto dto)
        {
            // 1. Fetch pending cargo requests
            var pendingRequests = _db.CargoRequests.Include(c => c.Station).ToList();

            if (!pendingRequests.Any())
            {
                return BadRequest(new { message = "Planlanacak kargo talebi bulunamadı." });
            }

            // 2. Run the Algorithm
            var routes = _routeService.PlanRoutes(pendingRequests, dto.UnlimitedVehicles);

            // 3. Save to DB (Optional but recommended)
            // _db.Routes.RemoveRange(_db.Routes); // Optional: Clear old routes
            _db.Routes.AddRange(routes);
            _db.SaveChanges();

            // 4. Map to DTO for Frontend
            var response = routes.Select(r =>
            {
                // Sort stops strictly by Order
                var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();

                // Initialize the path list
                var fullPathCoordinates = new List<double[]>();

                // A. Path from Depot (99) to First Stop
                if (sortedStops.Any())
                {
                    var first = sortedStops.First();
                    // 99 is Umuttepe ID. Ensure this ID exists in your DB or change it.
                    var startPath = _routeService.GetPathCoordinates(99, first.StationId);
                    fullPathCoordinates.AddRange(startPath);
                }

                // B. Path between subsequent stops
                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    var current = sortedStops[i];
                    var next = sortedStops[i + 1];
                    var segment = _routeService.GetPathCoordinates(current.StationId, next.StationId);
                    fullPathCoordinates.AddRange(segment);
                }

                return new UserRouteResponseDto
                {
                    VehicleId = r.VehicleId,
                    TotalDistanceKm = r.TotalDistanceKm,
                    TotalCost = r.TotalCost,
                    // Pass the detailed coordinates to frontend
                    PathCoordinates = fullPathCoordinates,

                    // Map stops to DTO
                    Route = sortedStops.Select(rs => new StationRouteDto
                    {
                        StationId = rs.StationId,
                        StationName = rs.Station?.Name ?? "Bilinmiyor",
                        Order = rs.Order,
                        Latitude = rs.Station?.Latitude ?? 0,
                        Longitude = rs.Station?.Longitude ?? 0
                    }).ToList()
                };
            }).ToList();

            return Ok(response);
        }

        public class PlanRequestDto
        {
            public bool UnlimitedVehicles { get; set; } // true: Sınırsız, false: Sabit 3 Araç
        }
    }

    public class ScenarioRunRequestDto
    {
        public int ScenarioId { get; set; }
        public bool UnlimitedVehicles { get; set; }
    }

    public class ScenarioCargoRow
    {
        public string StationName { get; set; } = "";
        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }
    }

    public static class ScenarioData
    {
        public static List<ScenarioCargoRow> GetScenario(int scenarioId)
        {
            return scenarioId switch
            {
                1 => new()
                {
                    new() { StationName="Başiskele", CargoCount=10, TotalWeightKg=120 },
                    new() { StationName="Çayırova", CargoCount=8, TotalWeightKg=80 },
                    new() { StationName="Darıca", CargoCount=15, TotalWeightKg=200 },
                    new() { StationName="Derince", CargoCount=10, TotalWeightKg=150 },
                    new() { StationName="Dilovası", CargoCount=12, TotalWeightKg=180 },
                    new() { StationName="Gebze", CargoCount=5, TotalWeightKg=70 },
                    new() { StationName="Gölcük", CargoCount=7, TotalWeightKg=90 },
                    new() { StationName="Kandıra", CargoCount=6, TotalWeightKg=60 },
                    new() { StationName="Karamürsel", CargoCount=9, TotalWeightKg=110 },
                    new() { StationName="Kartepe", CargoCount=11, TotalWeightKg=130 },
                    new() { StationName="Körfez", CargoCount=6, TotalWeightKg=75 },
                    new() { StationName="İzmit", CargoCount=14, TotalWeightKg=160 },
                },
                2 => new()
                {
                    new() { StationName="Başiskele", CargoCount=40, TotalWeightKg=200 },
                    new() { StationName="Çayırova", CargoCount=35, TotalWeightKg=175 },
                    new() { StationName="Darıca", CargoCount=10, TotalWeightKg=150 },
                    new() { StationName="Derince", CargoCount=5, TotalWeightKg=100 },
                    new() { StationName="Dilovası", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Gebze", CargoCount=8, TotalWeightKg=120 },
                    new() { StationName="Gölcük", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Kandıra", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Karamürsel", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Kartepe", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Körfez", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="İzmit", CargoCount=20, TotalWeightKg=160 },
                },
                3 => new()
                {
                    new() { StationName="Başiskele", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Çayırova", CargoCount=3, TotalWeightKg=700 },
                    new() { StationName="Darıca", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Derince", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Dilovası", CargoCount=4, TotalWeightKg=800 },
                    new() { StationName="Gebze", CargoCount=5, TotalWeightKg=900 },
                    new() { StationName="Gölcük", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Kandıra", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Karamürsel", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Kartepe", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Körfez", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="İzmit", CargoCount=5, TotalWeightKg=300 },
                },
                4 => new()
                {
                    new() { StationName="Başiskele", CargoCount=30, TotalWeightKg=300 },
                    new() { StationName="Çayırova", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Darıca", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Derince", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Dilovası", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Gebze", CargoCount=0, TotalWeightKg=0 },
                    new() { StationName="Gölcük", CargoCount=15, TotalWeightKg=220 },
                    new() { StationName="Kandıra", CargoCount=5, TotalWeightKg=250 },
                    new() { StationName="Karamürsel", CargoCount=20, TotalWeightKg=180 },
                    new() { StationName="Kartepe", CargoCount=10, TotalWeightKg=200 },
                    new() { StationName="Körfez", CargoCount=8, TotalWeightKg=400 },
                    new() { StationName="İzmit", CargoCount=0, TotalWeightKg=0 },
                },
                _ => new()
            };
        }
    }
}