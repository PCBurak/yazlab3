using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public interface ICostService
    {
        double CalculateRouteCost(double distanceKm, bool isRented);
    }

}