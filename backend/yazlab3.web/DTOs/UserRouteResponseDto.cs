using System.Collections.Generic;

namespace yazlab3.web.DTOs
{
    public class UserRouteResponseDto
    {
        public int VehicleId { get; set; }
        public double TotalDistanceKm { get; set; }
        public double TotalCost { get; set; }

        public List<StationRouteDto> Route { get; set; } = new();

        // NEW: Full zig-zag path for the map line
        public List<double[]> PathCoordinates { get; set; } = new();
    }

    public class StationRouteDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public int Order { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }
}
