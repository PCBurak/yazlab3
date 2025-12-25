namespace yazlab3.web.Models
{
    public class OsmNode
    {
        public string Id { get; set; }
        public double Lat { get; set; }
        public double Lon { get; set; }
        public List<OsmEdge> Edges { get; set; } = new List<OsmEdge>();
    }
}
