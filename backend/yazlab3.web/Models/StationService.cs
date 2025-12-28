using yazlab3.web.Models;

namespace yazlab3.web.Models
{
    public class StationDistance
    {
        public int Id { get; set; }

        public int FromStationId { get; set; }
        public Station FromStation { get; set; }

        public int ToStationId { get; set; }
        public Station ToStation { get; set; }

        public double DistanceKm { get; set; }
    }
}
