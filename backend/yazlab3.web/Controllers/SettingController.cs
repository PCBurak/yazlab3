using Microsoft.AspNetCore.Mvc;
using yazlab3.web.Data;
using yazlab3.web.Models;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/settings")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public SettingsController(AppDbContext db) => _db = db;

        [HttpGet]
        public IActionResult GetSettings() => Ok(_db.SystemSettings.ToList());

        [HttpPost("update")]
        public IActionResult UpdateSettings([FromBody] List<SystemSetting> settings)
        {
            foreach (var item in settings)
            {
                var dbSetting = _db.SystemSettings.FirstOrDefault(s => s.Key == item.Key);
                if (dbSetting != null) dbSetting.Value = item.Value;
            }
            _db.SaveChanges();
            return Ok(new { message = "Ayarlar güncellendi." });
        }
        [HttpPost("update-vehicles")]
        public IActionResult UpdateVehicles([FromBody] List<Vehicle> updatedVehicles)
        {
            // 1. Veritabanındaki mevcut tüm sabit araçları (IsRented: false) getir
            var currentVehicles = _db.Vehicles.Where(v => !v.IsRented).ToList();

            // 2. Silinecekleri Belirle: Veritabanında olup da Frontend'den gelen listede olmayanlar
            var updatedIds = updatedVehicles.Select(uv => uv.Id).ToList();
            var toDelete = currentVehicles.Where(cv => !updatedIds.Contains(cv.Id)).ToList();

            foreach (var vehicleItem in toDelete)
            {
                // 🔥 KRİTİK ADIM: Rotaları Temizle
                // Bu aracı silmeden önce, ona bağlı tüm rota kayıtlarını buluyoruz
                var relatedRoutes = _db.Routes.Where(r => r.VehicleId == vehicleItem.Id).ToList();

                if (relatedRoutes.Any())
                {
                    // Eğer bu rotalara bağlı 'RouteStations' (duraklar) varsa ve SQL'de 'Cascade' açık değilse, 
                    // onları da burada silmen gerekebilir.
                    _db.Routes.RemoveRange(relatedRoutes);
                }

                // Artık engel kalmadı, aracı silebiliriz
                _db.Vehicles.Remove(vehicleItem);
            }

            // 3. Ekleme veya Güncelleme İşlemleri
            foreach (var v in updatedVehicles)
            {
                if (v.Id == 0)
                {
                    // Yeni araç ekleme (Frontend id: 0 gönderir)
                    v.IsRented = false;
                    _db.Vehicles.Add(v);
                }
                else
                {
                    // Mevcut aracın kapasitesini güncelle
                    var dbVehicle = _db.Vehicles.Find(v.Id);
                    if (dbVehicle != null)
                    {
                        dbVehicle.CapacityKg = v.CapacityKg;
                    }
                }
            }

            // 4. Tüm değişiklikleri (Delete, Insert, Update) tek seferde veritabanına gönder
            _db.SaveChanges();

            return Ok(new { message = "Araç filosu ve ilişkili veriler başarıyla güncellendi." });
        }
        [HttpGet("vehicles")]
        public IActionResult GetFixedVehicles()
        {
            // Sadece kiralık olmayan (sabit) araçları getir
            var vehicles = _db.Vehicles.Where(v => !v.IsRented).ToList();
            return Ok(vehicles);
        }
    }
}
