using Microsoft.AspNetCore.Mvc;
using yazlab3.web.Data;
using yazlab3.web.Models;
using System.Linq;

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
            if (settings == null || settings.Count == 0)
                return BadRequest(new { message = "Boş ayar listesi gönderildi." });

            foreach (var item in settings)
            {
                var key = item.Key?.Trim();   // ✅ normalize
                var val = item.Value?.Trim(); // ✅ normalize

                if (string.IsNullOrWhiteSpace(key))
                    continue;

                var dbSetting = _db.SystemSettings.FirstOrDefault(s => s.Key == key);

                if (dbSetting != null)
                {
                    dbSetting.Value = val ?? "";
                }
                else
                {
                    // ✅ KRİTİK: Yoksa ekle (Upsert)
                    _db.SystemSettings.Add(new SystemSetting
                    {
                        Key = key,
                        Value = val ?? ""
                    });
                }
            }

            _db.SaveChanges();

            return Ok(new { message = "Ayarlar güncellendi." });
        }

        [HttpPost("update-vehicles")]
        public IActionResult UpdateVehicles([FromBody] List<Vehicle> updatedVehicles)
        {
            var currentVehicles = _db.Vehicles.Where(v => !v.IsRented).ToList();

            var updatedIds = updatedVehicles.Select(uv => uv.Id).ToList();
            var toDelete = currentVehicles.Where(cv => !updatedIds.Contains(cv.Id)).ToList();

            foreach (var vehicleItem in toDelete)
            {
                var relatedRoutes = _db.Routes.Where(r => r.VehicleId == vehicleItem.Id).ToList();
                if (relatedRoutes.Any())
                {
                    _db.Routes.RemoveRange(relatedRoutes);
                }

                _db.Vehicles.Remove(vehicleItem);
            }

            foreach (var v in updatedVehicles)
            {
                if (v.Id == 0)
                {
                    v.IsRented = false;
                    _db.Vehicles.Add(v);
                }
                else
                {
                    var dbVehicle = _db.Vehicles.Find(v.Id);
                    if (dbVehicle != null)
                    {
                        dbVehicle.CapacityKg = v.CapacityKg;
                    }
                }
            }

            _db.SaveChanges();

            return Ok(new { message = "Araç filosu ve ilişkili veriler başarıyla güncellendi." });
        }

        [HttpGet("vehicles")]
        public IActionResult GetFixedVehicles()
        {
            var vehicles = _db.Vehicles.Where(v => !v.IsRented).ToList();
            return Ok(vehicles);
        }
    }
}
