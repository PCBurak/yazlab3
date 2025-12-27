using System.ComponentModel.DataAnnotations.Schema;

public class RouteStation
{
    public int Id { get; set; }

    public int RouteId { get; set; }
    public Route Route { get; set; }

    public int StationId { get; set; }
    public Station Station { get; set; }
    [NotMapped]
    public List<object> LoadedCargos { get; set; } = new List<object>();
    public int Order { get; set; }
}
