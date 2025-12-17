using Microsoft.AspNetCore.Mvc;
using yazlab3.web.DTOs;
using yazlab3.web.Models;
using yazlab3.web.Services;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IRoutePlanningService _routeService;

        public AdminController(IRoutePlanningService routeService)
        {
            _routeService = routeService;
        }

        [HttpPost("plan-routes")]
        public IActionResult PlanRoutes([FromBody] PlanRouteRequestDto dto)
        {
            var cargoEntities = dto.CargoRequests.Select(c => new CargoRequest
            {
                StationId = c.StationId,
                CargoCount = c.CargoCount,
                TotalWeightKg = c.TotalWeightKg,
                RequestDate = c.RequestDate
            }).ToList();

            var routes = _routeService.PlanRoutes(cargoEntities, dto.UnlimitedVehicles);
            return Ok(routes);
        }
    }
}
