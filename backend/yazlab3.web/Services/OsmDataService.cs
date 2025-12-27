using Newtonsoft.Json.Linq;
using System.IO;
using yazlab3.web.Models;


namespace yazlab3.web.Services
{
 
    public class OsmDataService
    {
        public Dictionary<string, OsmNode> Nodes = new();

        public void LoadFromGeoJson(string filePath)
        {
            var json = JObject.Parse(File.ReadAllText(filePath));
            var features = json["features"];

            foreach (var feature in features)
            {
                if (feature["geometry"]["type"].ToString() == "LineString")
                {
                    var coordinates = feature["geometry"]["coordinates"].ToList();

                    for (int i = 0; i < coordinates.Count - 1; i++)
                    {
                        var p1 = coordinates[i];
                        var p2 = coordinates[i + 1];

                        // ✅ DÜZELTME: Koordinatları yuvarlayarak ID oluştur (Hassasiyet Kaymasını Önler)
                        double lat1 = Math.Round((double)p1[1], 6);
                        double lon1 = Math.Round((double)p1[0], 6);
                        double lat2 = Math.Round((double)p2[1], 6);
                        double lon2 = Math.Round((double)p2[0], 6);

                        string id1 = $"{lat1.ToString("F6")},{lon1.ToString("F6")}";
                        string id2 = $"{lat2.ToString("F6")},{lon2.ToString("F6")}";

                        AddEdge(id1, id2, lat1, lon1, lat2, lon2);
                    }
                }
            }
        }

        private void AddEdge(string id1, string id2, double lat1, double lon1, double lat2, double lon2)
        {
            if (!Nodes.ContainsKey(id1)) Nodes[id1] = new OsmNode { Id = id1, Lat = lat1, Lon = lon1 };
            if (!Nodes.ContainsKey(id2)) Nodes[id2] = new OsmNode { Id = id2, Lat = lat2, Lon = lon2 };

            double dist = CalculateHaversine(lat1, lon1, lat2, lon2);
            Nodes[id1].Edges.Add(new OsmEdge { TargetId = id2, Distance = dist });
            Nodes[id2].Edges.Add(new OsmEdge { TargetId = id1, Distance = dist }); // Çift yönlü yol
        }

        private double CalculateHaversine(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371d;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * (2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a)));
        }
    }
}
