using System.Collections.Generic;
using System.Linq;
using yazlab3.web.Data;
using yazlab3.web.DTOs;
using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public class UserRouteService : IUserRouteService
    {
        private readonly AppDbContext _db;
        private readonly IRoutePlanningService _routePlanningService;

        public UserRouteService(AppDbContext db, IRoutePlanningService routePlanningService)
        {
            _db = db;
            _routePlanningService = routePlanningService;
        }

        public UserRouteResponseDto CreateCargoAndAssignRoute(CargoRequestDto dto)
        {
            var cargo = new CargoRequest
            {
                StationId = dto.StationId,
                CargoCount = dto.CargoCount,
                TotalWeightKg = dto.TotalWeightKg,
                RequestDate = dto.RequestDate
            };

            _db.CargoRequests.Add(cargo);
            _db.SaveChanges();

            _db.Entry(cargo).Reference(c => c.Station).Load();

            var planResult = _routePlanningService.PlanRoutes(
                new List<CargoRequest> { cargo },
                unlimitedVehicles: true
            );

            var route = planResult.Routes.FirstOrDefault();

            if (route == null)
            {
                var fallbackVehicle = _db.Vehicles.FirstOrDefault();

                return new UserRouteResponseDto
                {
                    VehicleId = fallbackVehicle?.Id ?? 0,
                    TotalCost = 0,
                    TotalDistanceKm = 0,
                    Route = new List<StationRouteDto>(),
                    PathCoordinates = new List<double[]>()
                };
            }

            _db.Routes.Add(route);
            _db.SaveChanges();

            var sortedStops = route.RouteStations.OrderBy(rs => rs.Order).ToList();
            var fullPath = new List<double[]>();

            if (sortedStops.Any())
            {
                fullPath.AddRange(_routePlanningService.GetPathCoordinates(99, sortedStops[0].StationId));

                for (int i = 0; i < sortedStops.Count - 1; i++)
                {
                    fullPath.AddRange(_routePlanningService.GetPathCoordinates(sortedStops[i].StationId, sortedStops[i + 1].StationId));
                }
            }

            var response = new UserRouteResponseDto
            {
                VehicleId = route.VehicleId,
                TotalCost = route.TotalCost,
                TotalDistanceKm = route.TotalDistanceKm,
                PathCoordinates = fullPath,
                Route = sortedStops
                    .Select(rs => new StationRouteDto
                    {
                        StationId = rs.StationId,
                        StationName = rs.Station?.Name ?? string.Empty,
                        Order = rs.Order,
                        Latitude = rs.Station?.Latitude ?? 0,
                        Longitude = rs.Station?.Longitude ?? 0
                    })
                    .ToList()
            };

            return response;
        }
    }
}
