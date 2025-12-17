using yazlab3.web.Models;

public interface IRoutePlanningService
{
    List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles);
}
