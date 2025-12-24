using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using yazlab3.web.Data;
using yazlab3.web.Models;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/cargo")]
    public class CargoController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CargoController(AppDbContext db)
        {
            _db = db;
        }

        // 1. GET: İstasyonları Listele (Dropdown için)
        [HttpGet("stations")]
        public IActionResult GetStations()
        {
            var stations = _db.Stations
                              .Select(s => new { s.Id, s.Name })
                              .OrderBy(s => s.Name)
                              .ToList();
            return Ok(stations);
        }

        // 2. POST: Kargo Talebi Oluştur
        [HttpPost("create")]
        public IActionResult CreateRequest([FromBody] CreateCargoDto dto)
        {
            if (dto.StationId == 0 || dto.Weight <= 0)
            {
                return BadRequest(new { message = "Lütfen istasyon ve geçerli bir ağırlık giriniz." });
            }

            var request = new CargoRequest
            {
                // Mevcut Değişkenler
                StationId = dto.StationId,
                TotalWeightKg = (int)dto.Weight,
                CargoCount = 1, // Varsayılan 1 adet kabul ediyoruz
                RequestDate = DateTime.Now, // Kayıt anı

                // Yeni Eklenenler
                UserId = dto.UserId,
                ReceiverName = dto.ReceiverName ?? "Belirtilmemiş",
                CargoType = dto.CargoType ?? "Standart"
            };

            _db.CargoRequests.Add(request);
            _db.SaveChanges();

            return Ok(new { message = "Kargo talebi başarıyla oluşturuldu.", requestId = request.Id });
        }


        [HttpGet("my-requests/{userId}")]
        public IActionResult GetUserRequests(int userId)
        {
            // 1. Kullanıcının kargolarını çek
            var requests = _db.CargoRequests
                              .Include(r => r.Station)
                              .Where(r => r.UserId == userId)
                              .OrderByDescending(r => r.RequestDate)
                              .ToList();

            // 2. Her kargo için durum ve rota bilgisi bul
            var result = requests.Select(req =>
            {
                // Bu kargonun çıkış istasyonuna uğrayan bir Rota var mı?
                // (Not: Basitlik adına, o istasyona uğrayan ilk rotayı alıyoruz)
                var assignedRoute = _db.Routes
                                       .Include(r => r.RouteStations)
                                       .ThenInclude(rs => rs.Station)
                                       .AsEnumerable() // Client-side evaluation gerekebilir
                                       .FirstOrDefault(r => r.RouteStations.Any(rs => rs.StationId == req.StationId));

                bool isOnWay = assignedRoute != null;

                return new
                {
                    RequestId = req.Id,
                    StationName = req.Station?.Name,
                    Weight = req.TotalWeightKg,
                    Date = req.RequestDate.ToString("dd.MM.yyyy HH:mm"),
                    Status = isOnWay ? "Yolda (Dağıtımda)" : "Onay Bekliyor",
                    VehicleId = isOnWay ? assignedRoute.VehicleId : (int?)null,

                    // Eğer yoldaysa, o aracın rotasını gönder (Harita çizimi için)
                    RoutePath = isOnWay ? assignedRoute.RouteStations
                                            .OrderBy(rs => rs.Order)
                                            .Select(rs => new { lat = rs.Station.Latitude, lng = rs.Station.Longitude })
                                            .ToList() : null
                };
            });

            return Ok(result);
        }
    }

    // Frontend'den veri taşıyan paket (DTO)
    public class CreateCargoDto
    {
        public int UserId { get; set; }
        public int StationId { get; set; }
        public float Weight { get; set; }
        public string CargoType { get; set; }
        public string ReceiverName { get; set; }
    }
}