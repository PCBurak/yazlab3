using System.Collections.Generic;

namespace yazlab3.web.DTOs
{
    public class UserRouteResponseDto
    {
        public int VehicleId { get; set; }
        public double TotalDistanceKm { get; set; }
        public double TotalCost { get; set; }

        public List<StationRouteDto> Route { get; set; } = new();
    }

    public class StationRouteDto
    {
        public int StationId { get; set; }
        public string StationName { get; set; }
        public int Order { get; set; }
    }
}
