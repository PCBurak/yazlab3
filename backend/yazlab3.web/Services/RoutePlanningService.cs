using yazlab3.web.DTOs;
using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public class RoutePlanningService : IRoutePlanningService
    {
        public List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles)
        {
            // TODO:
            // 1. Cluster stations
            // 2. Assign to vehicles
            // 3. Compute distances
            return new List<Route>();
        }
    }

}