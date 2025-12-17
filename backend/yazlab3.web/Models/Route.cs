using yazlab3.web.Models;

public class Route
{
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public Vehicle Vehicle { get; set; }

    public double TotalDistanceKm { get; set; }
    public double TotalCost { get; set; }

    public ICollection<RouteStation> RouteStations { get; set; }
}
