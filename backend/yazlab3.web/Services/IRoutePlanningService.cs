using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public interface IRoutePlanningService
    {
        List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles, int strategy = 0);

        // NEW: Helper to get the full coordinate path for the map
        List<double[]> GetPathCoordinates(int fromStationId, int toStationId);
    }

}