using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public interface IRoutePlanningService
    {
        RoutePlanResult PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles, int strategy = 0);

        List<double[]> GetPathCoordinates(int fromStationId, int toStationId);
    }

}