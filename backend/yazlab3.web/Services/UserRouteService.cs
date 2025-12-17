using yazlab3.web.Data;
using yazlab3.web.DTOs;
using yazlab3.web.Models;


namespace yazlab3.web.Services
{
    public class UserRouteService : IUserRouteService
    {
        private readonly AppDbContext _db;

        public UserRouteService(AppDbContext db)
        {
            _db = db;
        }

        public UserRouteResponseDto CreateCargoAndAssignRoute(CargoRequestDto dto)
        {
            // 1️⃣ Save cargo request
            var cargo = new CargoRequest
            {
                StationId = dto.StationId,
                CargoCount = dto.CargoCount,
                TotalWeightKg = dto.TotalWeightKg,
                RequestDate = dto.RequestDate
            };

            _db.CargoRequests.Add(cargo);
            _db.SaveChanges();

            // 2️⃣ TEMP assignment (no algorithm yet)
            var vehicle = _db.Vehicles.First();

            return new UserRouteResponseDto
            {
                VehicleId = vehicle.Id,
                TotalCost = 0,
                TotalDistanceKm = 0,
                Route = new()
            };
        }
    }

}