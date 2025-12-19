using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    // Yol maliyetini hesaplayan basit servis:
    // - km başına 1 birim
    // - araç kiralıksa +200 birim
    public class CostService : ICostService
    {
        private const double CostPerKm = 1.0;
        private const double DefaultRentalCost = 200.0;

        public double CalculateRouteCost(double distanceKm, bool isRented)
        {
            var travelCost = distanceKm * CostPerKm;
            var rentalCost = isRented ? DefaultRentalCost : 0.0;
            return travelCost + rentalCost;
        }
    }
}
