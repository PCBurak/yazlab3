using yazlab3.web.Data;
using yazlab3.web.Models;
using System.Linq;

namespace yazlab3.web.Services
{
    public class CostService : ICostService
    {
        private readonly AppDbContext _db;

        // Veritabanı bağlantısını Constructor üzerinden enjekte ediyoruz
        public CostService(AppDbContext db)
        {
            _db = db;
        }

        public double CalculateRouteCost(double distanceKm, bool isRented)
        {
            // 1. Veritabanındaki ayarları çekiyoruz
            var settings = _db.SystemSettings.ToDictionary(s => s.Key, s => s.Value);

            // 2. Yol maliyetini (KM başı) al (Varsayılan: 1.0)
            double fuelCost = double.Parse(settings.GetValueOrDefault("FuelCost", "1.0"));

            // 3. Kiralama maliyetini al (Varsayılan: 200.0)
            double rentalCostSetting = double.Parse(settings.GetValueOrDefault("RentalCost", "200.0"));

            // 4. Hesaplama
            var travelCost = distanceKm * fuelCost;
            var rentalCost = isRented ? rentalCostSetting : 0.0;

            return travelCost + rentalCost;
        }
    }
}