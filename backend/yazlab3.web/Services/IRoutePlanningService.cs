using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public interface IRoutePlanningService
    {
        List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles);
    }

}