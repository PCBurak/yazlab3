using System.Collections.Generic;

namespace yazlab3.web.DTOs
{
    public class UserRouteResponseDto
    {
        public int VehicleId { get; set; }
        public double TotalDistanceKm { get; set; }
        public double TotalCost { get; set; }

        public List<StationRouteDto> Route { get; set; } = new();

        public List<double[]> PathCoordinates { get; set; } = new();
    }

    public class StationRouteDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public int Order { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public List<CargoDetailDto> LoadedCargos { get; set; } = new();
    }

    public class CargoDetailDto
    {
        public int CargoId { get; set; }
        public int Count { get; set; }
        public string UserName { get; set; }
        public int Weight { get; set; }
        public DateTime RequestDate { get; set; }
    }
}
