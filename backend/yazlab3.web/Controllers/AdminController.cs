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

        // --- 1. SENARYO ÇALIŞTIRMA (ARTIK DETAYLI VE PARÇALI) ---
        [HttpPost("run-scenario")]
        public IActionResult RunScenario([FromBody] ScenarioRunRequestDto dto)
        {
            // 1. Senaryo verisini çek
            var rows = ScenarioData.GetScenario(dto.ScenarioId);

            // 2. İstasyonları map'le (Station objesine ihtiyacımız var)
            var stations = _db.Stations.AsNoTracking().ToList();
            var stationMap = stations.ToDictionary(s => Normalize(s.Name), s => s);

            // 3. Kargo listesini oluştur (PARÇALAYARAK)
            var cargoEntities = new List<CargoRequest>();
            var missing = new List<string>();

            // Çakışma olmasın diye yüksek bir ID'den başlatıyoruz (Sadece RAM'de yaşayacak)
            int tempIdCounter = 100000;

            foreach (var r in rows)
            {
                if (r.CargoCount <= 0 && r.TotalWeightKg <= 0) continue;

                if (!stationMap.TryGetValue(Normalize(r.StationName), out var station))
                {
                    missing.Add(r.StationName);
                    continue;
                }

                // --- DÜZELTME BURADA: Kargoları tek tek oluşturuyoruz ---
                // Örn: 10 adet 120kg ise -> Tanesi 12kg olan 10 ayrı paket oluştur.
                double avgWeight = (double)r.TotalWeightKg / (r.CargoCount == 0 ? 1 : r.CargoCount);

                for (int i = 0; i < r.CargoCount; i++)
                {
                    cargoEntities.Add(new CargoRequest
                    {
                        Id = tempIdCounter++, // Sahte ID atıyoruz ki algoritma takip edebilsin
                        StationId = station.Id,
                        Station = station, // Station objesini elle koyuyoruz (Null hatası almamak için)
                        CargoCount = 1,
                        TotalWeightKg = (int)Math.Round(avgWeight) > 0 ? (int)Math.Round(avgWeight) : 1,
                        RequestDate = DateTime.Now.AddMinutes(-new Random().Next(1, 1000)) // Rastgele tarih
                    });
                }
            }

            if (missing.Count > 0) return BadRequest(new { message = "Stations missing in DB", missing });

            // 4. Rota Planla
            var result = _routeService.PlanRoutes(cargoEntities, dto.UnlimitedVehicles, dto.Strategy);

            // 5. DTO'ya Çevir 
            // DÜZELTME: İkinci parametre olarak 'cargoEntities' listesini gönderiyoruz.
            // Böylece MapToDto, veritabanına bakmak yerine bizim oluşturduğumuz bu listeye bakacak.
            var response = result.Routes.Select(r => MapToDto(r, cargoEntities)).ToList();

            // Reddedilenleri de ekleyebiliriz (İsteğe bağlı, frontend yapına göre)
            // Şimdilik sadece route listesini döndürüyoruz, senin frontend yapın bunu bekliyor olabilir.
            // Eğer rejectedCargos bekleyen bir yapın varsa return tipini değiştirmelisin.
            // Mevcut koduna sadık kalarak liste dönüyorum:
            return Ok(response);
        }

        [HttpPost("plan-dynamic")]
        public IActionResult PlanDynamicRoutes([FromBody] bool unlimitedVehicles)
        {
            var dbRequests = _db.CargoRequests.Include(c => c.Station).ToList();
            if (!dbRequests.Any()) return BadRequest(new { message = "No cargo requests found." });

            var result = _routeService.PlanRoutes(dbRequests, unlimitedVehicles, 0);

            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            // Veritabanından çektiğimiz için ikinci parametre null (DB kullanacak)
            return Ok(result.Routes.Select(r => MapToDto(r, null)).ToList());
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

            // 2. Algoritmayı Çalıştır
            var result = _routeService.PlanRoutes(pendingRequests, dto.UnlimitedVehicles, dto.Strategy);

            // 3. Sonuçları Kaydet (Sadece rotalar)
            _db.Routes.AddRange(result.Routes);
            _db.SaveChanges();

            // 4. Frontend İçin Cevap
            // Veritabanından çektiğimiz için ikinci parametre null
            var response = new
            {
                routes = result.Routes.Select(r => MapToDto(r, null)).ToList(),
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

        // --- YARDIMCI METOT (GÜNCELLENDİ) ---
        // sourceList: Eğer doluysa (Senaryo modu), detayları oradan çeker.
        // sourceList: Eğer null ise (Gerçek mod), detayları DB'den çeker.
        private UserRouteResponseDto MapToDto(Route r, List<CargoRequest> sourceList)
        {
            var sortedStops = r.RouteStations.OrderBy(rs => rs.Order).ToList();
            var fullPathCoordinates = new List<double[]>();

            if (sortedStops.Any())
            {
                var first = sortedStops.First();
                fullPathCoordinates.AddRange(_routeService.GetPathCoordinates(99, first.StationId));
                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    fullPathCoordinates.AddRange(_routeService.GetPathCoordinates(sortedStops[i].StationId, sortedStops[i + 1].StationId));
                }
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

                    // --- KRİTİK DEĞİŞİKLİK BURADA ---
                    LoadedCargos = (sourceList != null)
                        // SENARYO MODU: Hafızadaki listeden bul
                        ? sourceList
                            .Where(c => r.ExactCargoIds.Contains(c.Id) && c.StationId == rs.StationId)
                            .Select(c => new CargoDetailDto
                            {
                                CargoId = c.Id,
                                Count = c.CargoCount,
                                Weight = c.TotalWeightKg,
                                RequestDate = c.RequestDate
                            }).ToList()
                        // GERÇEK MOD: Veritabanından bul
                        : _db.CargoRequests
                            .Where(c => r.ExactCargoIds.Contains(c.Id) && c.StationId == rs.StationId)
                            .Select(c => new CargoDetailDto
                            {
                                CargoId = c.Id,
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