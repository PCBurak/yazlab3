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
            var settings = LoadSettingsDictionary();

            double fuelCost = ReadDouble(settings, "FuelCost", 1.0);
            double rentalCostSetting = ReadDouble(settings, "RentalCost", 200.0);

            var travelCost = distanceKm * fuelCost;
            var rentalCost = isRented ? rentalCostSetting : 0.0;

            return travelCost + rentalCost;
        }

        private Dictionary<string, string> LoadSettingsDictionary()
        {
            var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var s in _db.SystemSettings.AsNoTracking())
            {
                var key = (s.Key ?? string.Empty).Trim();
                if (key.Length == 0) continue;

                dict[key] = (s.Value ?? string.Empty).Trim();
            }

            return dict;
        }

        private static double ReadDouble(Dictionary<string, string> settings, string key, double defaultValue)
        {
            if (settings == null) return defaultValue;
            if (!settings.TryGetValue(key, out var raw) || string.IsNullOrWhiteSpace(raw)) return defaultValue;

            raw = raw.Trim();

            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var v)) return v;

            if (double.TryParse(raw, NumberStyles.Float, CultureInfo.CurrentCulture, out v)) return v;

            var normalized = raw.Replace(',', '.');
            if (double.TryParse(normalized, NumberStyles.Float, CultureInfo.InvariantCulture, out v)) return v;

            return defaultValue;
        }
    }
}
