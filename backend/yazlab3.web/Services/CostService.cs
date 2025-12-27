using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using yazlab3.web.Data;

namespace yazlab3.web.Services
{
    public class CostService : ICostService
    {
        private readonly AppDbContext _db;

        public CostService(AppDbContext db)
        {
            _db = db;
        }

        public double CalculateRouteCost(double distanceKm, bool isRented)
        {
            // ✅ Settings'i "trim + case-insensitive" çek (FuelCost / fuelcost / FuelCost  vs.)
            var settings = LoadSettingsDictionary();

            // ✅ parse güvenli (., , fark etmez)
            double fuelCost = ReadDouble(settings, "FuelCost", 1.0);
            double rentalCostSetting = ReadDouble(settings, "RentalCost", 200.0);

            var travelCost = distanceKm * fuelCost;
            var rentalCost = isRented ? rentalCostSetting : 0.0;

            return travelCost + rentalCost;
        }

        private Dictionary<string, string> LoadSettingsDictionary()
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // AsNoTracking = performans + gereksiz tracking yok
            foreach (var s in _db.SystemSettings.AsNoTracking())
            {
                var key = (s.Key ?? string.Empty).Trim();
                if (key.Length == 0) continue;

                dict[key] = (s.Value ?? string.Empty).Trim(); // duplicate key varsa son değer geçerli
            }

            return dict;
        }

        private static double ReadDouble(Dictionary<string, string> settings, string key, double defaultValue)
        {
            if (settings == null) return defaultValue;
            if (!settings.TryGetValue(key, out var raw) || string.IsNullOrWhiteSpace(raw)) return defaultValue;

            raw = raw.Trim();

            // 1) Invariant (nokta) dene
            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var v)) return v;

            // 2) CurrentCulture (virgül) dene
            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.CurrentCulture, out v)) return v;

            // 3) "1,5" -> "1.5" normalize edip tekrar dene
            var normalized = raw.Replace(',', '.');
            if (double.TryParse(normalized, NumberStyles.Float, CultureInfo.InvariantCulture, out v)) return v;

            return defaultValue;
        }
    }
}
