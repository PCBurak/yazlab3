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

        // --- SENARYO ÇALIŞTIRMA ---
        [HttpPost("run-scenario")]
        public IActionResult RunScenario([FromBody] ScenarioRunRequestDto dto)
        {
            var rows = ScenarioData.GetScenario(dto.ScenarioId);

            var stations = _db.Stations.AsNoTracking().ToList();
            var stationMap = stations.ToDictionary(s => Normalize(s.Name), s => s);

            var cargoEntities = new List<CargoRequest>();
            var missing = new List<string>();

            int tempIdCounter = 100000;
            var rng = new Random();

            foreach (var r in rows)
            {
                if (r.CargoCount <= 0 || r.TotalWeightKg <= 0) continue;

                if (!stationMap.TryGetValue(Normalize(r.StationName), out var station))
                {
                    missing.Add(r.StationName);
                    continue;
                }

                double avgWeight = (double)r.TotalWeightKg / r.CargoCount;

                for (int i = 0; i < r.CargoCount; i++)
                {
                    cargoEntities.Add(new CargoRequest
                    {
                        Id = tempIdCounter++,
                        StationId = station.Id,
                        Station = station,
                        CargoCount = 1,
                        TotalWeightKg = Math.Max(1, (int)Math.Round(avgWeight)),
                        RequestDate = DateTime.Now.AddMinutes(-rng.Next(1, 1000))
                    });
                }
            }

            if (missing.Count > 0)
                return BadRequest(new { message = "Stations missing in DB", missing });

            var result = _routeService.PlanRoutes(cargoEntities, dto.UnlimitedVehicles, dto.Strategy);

            var routesDto = result.Routes.Select(r => MapToDto(r, cargoEntities)).ToList();

            // Rejected özetini istasyon bazında grupla
            var rejectedSummary = result.RejectedRequests
                .GroupBy(x => x.StationId)
                .Select(g => new
                {
                    stationName = g.First().Station?.Name ?? "Bilinmiyor",
                    cargoCount = g.Sum(x => x.CargoCount),
                    weight = g.Sum(x => x.TotalWeightKg),
                    reason = "Kapasite Yetersiz"
                })
                .ToList();

            int totalInputKg = cargoEntities.Sum(x => x.TotalWeightKg);
            int shippedKg = result.Routes.SelectMany(r => r.ExactCargoIds)
                .Join(cargoEntities, id => id, c => c.Id, (id, c) => c.TotalWeightKg)
                .Sum();

            int rejectedKg = result.RejectedRequests.Sum(x => x.TotalWeightKg);

            return Ok(new
            {
                routes = routesDto,
                rejectedCargos = rejectedSummary,
                meta = new
                {
                    scenarioId = dto.ScenarioId,
                    unlimitedVehicles = dto.UnlimitedVehicles,
                    strategy = dto.Strategy,
                    totalInputKg,
                    shippedKg,
                    rejectedKg,
                    shippedCount = result.Routes.SelectMany(r => r.ExactCargoIds).Distinct().Count(),
                    rejectedCount = result.RejectedRequests.Count
                }
            });
        }


        [HttpPost("plan-dynamic")]
        public IActionResult PlanDynamicRoutes([FromBody] bool unlimitedVehicles)
        {
            var dbRequests = _db.CargoRequests.Include(c => c.Station).ToList();
            if (!dbRequests.Any()) return BadRequest(new { message = "No cargo requests found." });

            var result = _routeService.PlanRoutes(dbRequests, unlimitedVehicles, 0);

            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            // DB modu: sourceList=null
            return Ok(result.Routes.Select(r => MapToDto(r, null)).ToList());
        }

        [HttpPost("plan-routes")]
        public IActionResult PlanRoutes([FromBody] PlanRequestDto dto)
        {
            var pendingRequests = _db.CargoRequests
                .Include(c => c.User)
                .Include(c => c.Station)
                .ToList();

            if (!pendingRequests.Any())
            {
                return BadRequest(new { message = "Planlanacak kargo talebi bulunamadı. Önce kullanıcı panelinden kargo ekleyin." });
            }

            var result = _routeService.PlanRoutes(pendingRequests, dto.UnlimitedVehicles, dto.Strategy);

            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            var response = new
            {
                routes = result.Routes.Select(r => MapToDto(r, null)).ToList(),
                rejectedCargos = result.RejectedRequests
                    .GroupBy(x => x.StationId)
                    .Select(g => new
                    {
                        stationName = g.First().Station?.Name ?? "Bilinmiyor",
                        cargoCount = g.Sum(x => x.CargoCount),
                        weight = g.Sum(x => x.TotalWeightKg),
                        reason = "Kapasite Yetersiz"
                    })
                    .OrderByDescending(x => x.weight)
                    .ToList()
            };

            return Ok(response);
        }

        // sourceList doluysa senaryo modundan okur, null ise DB'den okur
        private UserRouteResponseDto MapToDto(Route r, List<CargoRequest> sourceList)
        {
            var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();
            var fullPathCoordinates = new List<double[]>();

            if (sortedStops.Any())
            {
                var first = sortedStops.First();
                var last = sortedStops.Last();

                fullPathCoordinates.AddRange(_routeService.GetPathCoordinates(99, first.StationId));

                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    fullPathCoordinates.AddRange(_routeService.GetPathCoordinates(sortedStops[i].StationId, sortedStops[i + 1].StationId));
                }

                fullPathCoordinates.AddRange(_routeService.GetPathCoordinates(last.StationId, 99));
            }

            return new UserRouteResponseDto
            {
                VehicleId = r.VehicleId,
                TotalDistanceKm = r.TotalDistanceKm,
                TotalCost = r.TotalCost,
                PathCoordinates = fullPathCoordinates,
                Route = sortedStops.Select(rs => new StationRouteDto
                {
                    StationId = rs.StationId,
                    StationName = rs.Station?.Name ?? "Bilinmiyor",
                    Order = rs.Order,
                    Latitude = rs.Station?.Latitude ?? 0,
                    Longitude = rs.Station?.Longitude ?? 0,

                    LoadedCargos = (sourceList != null)
                        ? sourceList
                            .Where(c => r.ExactCargoIds.Contains(c.Id) && c.StationId == rs.StationId)
                            .Select(c => new CargoDetailDto
                            {
                                CargoId = c.Id,
                                UserName = "Senaryo Kullanıcısı",
                                Count = c.CargoCount,
                                Weight = c.TotalWeightKg,
                                RequestDate = c.RequestDate
                            }).ToList()
                        : _db.CargoRequests
                            .Include(c => c.User)
                            .Where(c => r.ExactCargoIds.Contains(c.Id) && c.StationId == rs.StationId)
                            .Select(c => new CargoDetailDto
                            {
                                CargoId = c.Id,
                                UserName = c.User != null ? c.User.Username : "Bilinmeyen",
                                Count = c.CargoCount,
                                Weight = c.TotalWeightKg,
                                RequestDate = c.RequestDate
                            }).ToList()

                }).ToList()
            };
        }

        private static string Normalize(string s)
            => (s ?? "").Trim().ToLowerInvariant()
                .Replace("ı", "i").Replace("İ", "i").Replace("ç", "c")
                .Replace("ğ", "g").Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");


        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var stationCount = await _db.Stations.CountAsync();
            var vehicleCount = await _db.Vehicles.CountAsync();
            var routeCount = await _db.Routes.CountAsync();
            var cargoCount = await _db.CargoRequests.CountAsync();

            return Ok(new
            {
                totalStations = stationCount,
                totalVehicles = vehicleCount,
                totalRoutes = routeCount,
                pendingCargos = cargoCount
            });
        }

        public class PlanRequestDto
        {
            public bool UnlimitedVehicles { get; set; }
            public int Strategy { get; set; } = 0;
        }
    }

    public class ScenarioRunRequestDto
    {
        public int ScenarioId { get; set; }
        public bool UnlimitedVehicles { get; set; }
        public int Strategy { get; set; } = 0;
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
