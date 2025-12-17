public class CargoRequest
{
    public int Id { get; set; }

    public int StationId { get; set; }
    public Station Station { get; set; }

    public int CargoCount { get; set; }
    public int TotalWeightKg { get; set; }

    public DateTime RequestDate { get; set; }
}
