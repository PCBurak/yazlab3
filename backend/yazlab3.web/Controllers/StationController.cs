using Microsoft.AspNetCore.Mvc;
using System.Linq;
using yazlab3.web.Data;
using yazlab3.web.Models;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/stations")]
    public class StationController : ControllerBase
    {
        private readonly AppDbContext _db;

        public StationController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var stations = _db.Stations
                              .OrderBy(s => s.Name)
                              .ToList();
            return Ok(stations);
        }

        [HttpPost]
        public IActionResult Create([FromBody] Station station)
        {
            if (string.IsNullOrEmpty(station.Name) || station.Latitude == 0 || station.Longitude == 0)
            {
                return BadRequest(new { message = "Lütfen isim ve koordinat bilgilerini eksiksiz girin." });
            }

            _db.Stations.Add(station);
            _db.SaveChanges();

            return Ok(new { message = "İstasyon başarıyla eklendi.", data = station });
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var station = _db.Stations.Find(id);
            if (station == null) return NotFound(new { message = "İstasyon bulunamadı." });

            _db.Stations.Remove(station);
            _db.SaveChanges();

            return Ok(new { message = "İstasyon silindi." });
        }
    }
}