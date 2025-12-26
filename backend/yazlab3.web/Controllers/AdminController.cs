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
            // 1) Senaryo verisini çek
            var rows = ScenarioData.GetScenario(dto.ScenarioId);

            // 2) İstasyonları map'le
            var stationMap = _db.Stations.AsNoTracking().ToList().ToDictionary(s => Normalize(s.Name), s => s.Id);

            // 3) Kargo listesini oluştur
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

            if (missing.Count > 0) return BadRequest(new { message = "Stations missing in DB", missing });

            // 4) Rota Planla (DÜZELTME: RoutePlanResult dönüş tipini karşılıyoruz)
            var result = _routeService.PlanRoutes(cargoEntities, dto.UnlimitedVehicles, dto.Strategy);

            // 5) DTO'ya Çevir (result.Routes kullanıyoruz)
            var response = result.Routes.Select(r => MapToDto(r)).ToList();

            return Ok(response);
        }

        [HttpPost("plan-dynamic")]
        public IActionResult PlanDynamicRoutes([FromBody] bool unlimitedVehicles)
        {
            var dbRequests = _db.CargoRequests.ToList();
            if (!dbRequests.Any()) return BadRequest(new { message = "No cargo requests found." });

            // Varsayılan strateji (0)
            var result = _routeService.PlanRoutes(dbRequests, unlimitedVehicles, 0);

            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            return Ok(result.Routes.Select(r => MapToDto(r)).ToList());
        }

        [HttpPost("plan-routes")]
        public IActionResult PlanRoutes([FromBody] PlanRequestDto dto)
        {
            // 1. Bekleyen kargoları çek
            var pendingRequests = _db.CargoRequests.Include(c => c.Station).ToList();

            if (!pendingRequests.Any())
            {
                return BadRequest(new { message = "Planlanacak kargo talebi bulunamadı. Önce kullanıcı panelinden kargo ekleyin." });
            }

            // 2. Algoritmayı Çalıştır (DÜZELTME: dto.Strategy eklendi)
            var result = _routeService.PlanRoutes(pendingRequests, dto.UnlimitedVehicles, dto.Strategy);

            // 3. Sonuçları Kaydet (Sadece rotalar)
            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            // 4. Frontend İçin Cevap (Rotalar + Reddedilenler)
            var response = new
            {
                routes = result.Routes.Select(r => MapToDto(r)).ToList(),
                rejectedCargos = result.RejectedRequests.Select(req => new
                {
                    stationName = req.Station?.Name ?? "Bilinmiyor",
                    cargoCount = req.CargoCount,
                    weight = req.TotalWeightKg,
                    reason = "Kapasite Yetersiz"
                }).ToList()
            };

            return Ok(response);
        }

        // --- YARDIMCI METOT (Kod Tekrarını Önlemek İçin) ---
        private UserRouteResponseDto MapToDto(Route r)
        {
            var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();
            var fullPathCoordinates = new List<double[]>();

            // A. Depo (99) -> İlk Durak
            if (sortedStops.Any())
            {
                var first = sortedStops.First();
                var startPath = _routeService.GetPathCoordinates(99, first.StationId);
                fullPathCoordinates.AddRange(startPath);
            }

            // B. Duraklar Arası
            for (int i = 0; i < sortedStops.Count - 1; i++)
            {
                var cur = sortedStops[i];
                var next = sortedStops[i + 1];
                var seg = _routeService.GetPathCoordinates(cur.StationId, next.StationId);
                fullPathCoordinates.AddRange(seg);
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
                    Longitude = rs.Station?.Longitude ?? 0
                }).ToList()
            };
        }

        private static string Normalize(string s)
            => (s ?? "").Trim().ToLowerInvariant()
                .Replace("ı", "i").Replace("İ", "i").Replace("ç", "c")
                .Replace("ğ", "g").Replace("ö", "o").Replace("ş", "s").Replace("ü", "u");

        // --- GÜNCELLENMİŞ DTO SINIFLARI ---
        public class PlanRequestDto
        {
            public bool UnlimitedVehicles { get; set; }

            // EKLENDİ: Strateji Parametresi
            public int Strategy { get; set; } = 0;
        }
    }

    public class ScenarioRunRequestDto
    {
        public int ScenarioId { get; set; }
        public bool UnlimitedVehicles { get; set; }

        // EKLENDİ: Strateji Parametresi
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