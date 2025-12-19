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
            // 1️⃣ Kargo talebini kaydet
            var cargo = new CargoRequest
            {
                StationId = dto.StationId,
                CargoCount = dto.CargoCount,
                TotalWeightKg = dto.TotalWeightKg,
                RequestDate = dto.RequestDate
            };

            _db.CargoRequests.Add(cargo);
            _db.SaveChanges();

            // 2️⃣ Sadece bu kargonun dahil olduğu küçük bir senaryo oluşturup
            //     planlama algoritmasını çalıştır (unlimitedVehicles: true)
            var routes = _routePlanningService.PlanRoutes(
                new List<CargoRequest> { cargo },
                unlimitedVehicles: true);

            var route = routes.FirstOrDefault();

            if (route == null)
            {
                // Algoritma bir şey üretemezse en azından bir araç döndür
                var fallbackVehicle = _db.Vehicles.First();

                return new UserRouteResponseDto
                {
                    VehicleId = fallbackVehicle.Id,
                    TotalCost = 0,
                    TotalDistanceKm = 0,
                    Route = new()
                };
            }

            // 3️⃣ Oluşan rotayı veritabanına kaydet
            _db.Routes.Add(route);
            _db.SaveChanges();

            // 4️⃣ Kullanıcıya döneceğimiz DTO'yu hazırla
            var response = new UserRouteResponseDto
            {
                VehicleId = route.VehicleId,
                TotalCost = route.TotalCost,
                TotalDistanceKm = route.TotalDistanceKm,
                Route = route.RouteStations
                    .OrderBy(rs => rs.Order)
                    .Select(rs => new StationRouteDto
                    {
                        StationId = rs.StationId,
                        StationName = rs.Station?.Name ?? string.Empty,
                        Order = rs.Order
                    })
                    .ToList()
            };

            return response;
        }
    }
}
