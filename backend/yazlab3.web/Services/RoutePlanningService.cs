using System;
using System.Collections.Generic;
using System.Linq;
using yazlab3.web.Data;
using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public class RoutePlanningService : IRoutePlanningService
    {
        private readonly AppDbContext _db;
        private readonly ICostService _costService;
        private readonly OsmDataService _osmParser;

        // Graph adjacency list for Dijkstra
        private readonly Dictionary<int, List<Edge>> _adjacency = new Dictionary<int, List<Edge>>();

        private class Edge
        {
            public int ToStationId { get; set; }
            public double DistanceKm { get; set; }
        }

        public RoutePlanningService(AppDbContext db, ICostService costService, OsmDataService osmParser)
        {
            _db = db;
            _costService = costService;
            _osmParser = osmParser;

            // Load Graph
            if (_db.StationDistances.Any())
            {
                var allEdges = _db.StationDistances.ToList();
                foreach (var e in allEdges)
                {
                    if (!_adjacency.TryGetValue(e.FromStationId, out var list))
                    {
                        list = new List<Edge>();
                        _adjacency[e.FromStationId] = list;
                    }
                    list.Add(new Edge { ToStationId = e.ToStationId, DistanceKm = e.DistanceKm });
                }
            }
        }

        // ------------------------------------------------------------
        // MAIN API: Plan Routes
        // ------------------------------------------------------------
        // strategy: 0 = Max Ağırlık (Varsayılan), 1 = Max Adet (Küçük Kargolar Önce)
        public List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles, int strategy = 0)
        {
            if (requests == null || requests.Count == 0)
                return new List<Route>();

            // --- ADIM 1: KARGO ELEME (KNAPSACK MANTIĞI) ---
            List<CargoRequest> acceptedRequests;
            List<CargoRequest> rejectedRequests = new List<CargoRequest>(); // İleride bunu da döndüreceğiz

            if (!unlimitedVehicles)
            {
                // Sabit 3 Aracın Toplam Kapasitesi: 500 + 750 + 1000 = 2250 KG
                double maxSystemCapacity = 2250;
                double currentLoad = 0;
                acceptedRequests = new List<CargoRequest>();

                // STRATEJİ BELİRLEME
                List<CargoRequest> sortedCargos;
                if (strategy == 1)
                {
                    // Max Adet: En hafifleri öne al ki daha çok paket sığsın
                    sortedCargos = requests.OrderBy(r => r.TotalWeightKg).ToList();
                }
                else
                {
                    // Max Ağırlık: En ağırları öne al (Varsayılan)
                    sortedCargos = requests.OrderByDescending(r => r.TotalWeightKg).ToList();
                }

                foreach (var req in sortedCargos)
                {
                    if (currentLoad + req.TotalWeightKg <= maxSystemCapacity)
                    {
                        acceptedRequests.Add(req);
                        currentLoad += req.TotalWeightKg;
                    }
                    else
                    {
                        rejectedRequests.Add(req); // Bu kargo kapasite dışı kaldı
                    }
                }
            }
            else
            {
                // Sınırsız modda hepsini kabul et
                acceptedRequests = requests;
            }

            // --- ADIM 2: GRUPLAMA (DETAYLARI KORUYARAK) ---
            var stationIds = acceptedRequests.Select(r => r.StationId).Distinct().ToList();
            var stationMap = _db.Stations
                .Where(s => stationIds.Contains(s.Id))
                .ToDictionary(s => s.Id);

            var demands = acceptedRequests
                .GroupBy(r => r.StationId)
                .Select(g => new StationDemandInternal
                {
                    StationId = g.Key,
                    Station = stationMap[g.Key],
                    CargoCount = g.Sum(x => x.CargoCount),
                    TotalWeightKg = g.Sum(x => x.TotalWeightKg),

                    // KRİTİK: Hangi kargoların bu gruba dahil olduğunu saklıyoruz
                    IncludedRequestIds = g.Select(x => x.Id).ToList()
                })
                .OrderByDescending(d => d.TotalWeightKg)
                .ToList();

            // --- ADIM 3: ARAÇLARA DAĞITIM (VRP) ---
            var availableVehicles = _db.Vehicles
                .Where(v => !v.IsRented)
                .OrderBy(v => v.CapacityKg)
                .ToList();

            var plannedRoutes = new List<PlannedRoute>();

            foreach (var demand in demands)
            {
                if (TryInsertIntoExistingRoute(plannedRoutes, demand))
                    continue;

                var vehicle = availableVehicles.FirstOrDefault(v => v.CapacityKg >= demand.TotalWeightKg);

                if (vehicle == null)
                {
                    if (!unlimitedVehicles) continue; // Zaten başta eledik ama güvenlik için

                    // Kiralık araç
                    vehicle = new Vehicle { CapacityKg = 500, IsRented = true, RentalCost = 200 };
                    _db.Vehicles.Add(vehicle);
                    _db.SaveChanges();
                }
                else
                {
                    availableVehicles.Remove(vehicle);
                }

                var newRoute = new PlannedRoute
                {
                    Vehicle = vehicle,
                    UsedCapacityKg = demand.TotalWeightKg,
                    TotalDistanceKm = 0
                };
                newRoute.Stops.Add(demand);
                plannedRoutes.Add(newRoute);
            }

            // --- ADIM 4: ROUTE NESNESİNE DÖNÜŞTÜRME ---
            var routes = new List<Route>();
            var depot = _db.Stations.Find(99);

            foreach (var planned in plannedRoutes)
            {
                double totalDist = 0;
                List<double[]> fullPathCoordinates = new List<double[]>();

                // A) Depo -> İlk Durak
                if (planned.Stops.Count > 0)
                {
                    var firstStop = planned.Stops[0].Station;
                    totalDist += CalculateDistanceKm(depot, firstStop);
                    fullPathCoordinates.AddRange(GetPathCoordinates(99, firstStop.Id));
                }

                // B) Duraklar Arası
                for (int i = 0; i < planned.Stops.Count - 1; i++)
                {
                    var s1 = planned.Stops[i].Station;
                    var s2 = planned.Stops[i + 1].Station;
                    totalDist += CalculateDistanceKm(s1, s2);
                    fullPathCoordinates.AddRange(GetPathCoordinates(s1.Id, s2.Id));
                }

                totalDist += planned.TotalDistanceKm;

                var route = new Route
                {
                    VehicleId = planned.Vehicle.Id,
                    Vehicle = planned.Vehicle,
                    TotalDistanceKm = Math.Round(totalDist, 2),
                    PathCoordinates = fullPathCoordinates
                };

                route.TotalCost = _costService.CalculateRouteCost(route.TotalDistanceKm, planned.Vehicle.IsRented);

                // Hangi kargoların bu araçta olduğunu burada detaylandırabiliriz
                var routeStations = new List<RouteStation>();

                // Bu araçtaki toplam kargo ID'lerini toplamak istersen:
                // List<int> cargoIdsInThisTruck = planned.Stops.SelectMany(s => s.IncludedRequestIds).ToList();

                for (int i = 0; i < planned.Stops.Count; i++)
                {
                    var stop = planned.Stops[i];
                    routeStations.Add(new RouteStation
                    {
                        StationId = stop.StationId,
                        Station = stop.Station,
                        Order = i + 1
                    });
                }
                route.RouteStations = routeStations;
                routes.Add(route);
            }

            // NOT: İleride 'rejectedRequests' listesini de döndürmek için return tipini değiştireceğiz.
            // Şimdilik sistem çalışsın diye sadece routes dönüyoruz.
            return routes;
        }

        // ... (TryInsertIntoExistingRoute, CalculateInsertionExtraDistance, Dijkstra kodları AYNI KALACAK) ...

        // Sadece internal class güncellemesi gerekiyor:

        private bool TryInsertIntoExistingRoute(List<PlannedRoute> plannedRoutes, StationDemandInternal demand)
        {
            // (Buradaki kodların değişmesine gerek yok, mantık aynı)
            PlannedRoute bestRoute = null;
            double minCostIncrease = double.MaxValue;

            foreach (var route in plannedRoutes)
            {
                if (route.UsedCapacityKg + demand.TotalWeightKg > route.Vehicle.CapacityKg)
                    continue;

                double extraDistance = CalculateInsertionExtraDistance(route, demand);
                double extraCost = _costService.CalculateRouteCost(extraDistance, route.Vehicle.IsRented);

                if (extraCost < minCostIncrease)
                {
                    minCostIncrease = extraCost;
                    bestRoute = route;
                }
            }

            if (bestRoute != null)
            {
                bestRoute.Stops.Add(demand);
                bestRoute.UsedCapacityKg += demand.TotalWeightKg;
                return true;
            }
            return false;
        }

        private double CalculateInsertionExtraDistance(PlannedRoute route, StationDemandInternal demand)
        {
            if (route.Stops.Count == 0)
            {
                var depot = _db.Stations.Find(99);
                return CalculateDistanceKm(depot, demand.Station) * 2;
            }

            double bestExtra = double.MaxValue;
            for (int i = 0; i <= route.Stops.Count; i++)
            {
                Station prev = (i == 0) ? _db.Stations.Find(99) : route.Stops[i - 1].Station;
                Station next = (i == route.Stops.Count) ? _db.Stations.Find(99) : route.Stops[i].Station;

                double currentDist = CalculateDistanceKm(prev, next);
                double newDist = CalculateDistanceKm(prev, demand.Station) + CalculateDistanceKm(demand.Station, next);
                double extra = newDist - currentDist;

                if (extra < bestExtra) bestExtra = extra;
            }
            return bestExtra;
        }

        private double CalculateDistanceKm(Station a, Station b)
        {
            if (a == null || b == null || a.Id == b.Id) return 0;
            double graphDist = GetShortestPathDistanceKm(a.Id, b.Id);
            if (graphDist > 0) return graphDist;
            return CalculateHaversineDistance(a, b);
        }

        private double CalculateHaversineDistance(Station a, Station b)
        {
            var R = 6371;
            var dLat = ToRadians(b.Latitude - a.Latitude);
            var dLon = ToRadians(b.Longitude - a.Longitude);
            var aVal = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(ToRadians(a.Latitude)) * Math.Cos(ToRadians(b.Latitude)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(aVal), Math.Sqrt(1 - aVal));
            return Math.Round(R * c, 2);
        }
        private double ToRadians(double deg) => deg * (Math.PI / 180);

        // ... (GetShortestPathDistanceKm, GetPathCoordinates, FindNearestOsmNode, RunDijkstraOnOsm, GetShortestPathIds kodları AYNI) ...
        // (Buraya kopyalamadım yer kaplamasın diye, senin kodundaki aynı kısımlar kalacak)

        // --- BU KISMI EKSİK UNUTMA ---
        private double GetShortestPathDistanceKm(int fromStationId, int toStationId)
        {
            var dist = new Dictionary<int, double>();
            var visited = new HashSet<int>();
            foreach (var nodeId in _adjacency.Keys) dist[nodeId] = double.PositiveInfinity;
            if (!dist.ContainsKey(fromStationId)) return 0;
            dist[fromStationId] = 0;

            while (true)
            {
                int current = -1;
                double bestDist = double.PositiveInfinity;
                foreach (var kvp in dist)
                {
                    if (!visited.Contains(kvp.Key) && kvp.Value < bestDist)
                    {
                        bestDist = kvp.Value;
                        current = kvp.Key;
                    }
                }
                if (current == -1 || bestDist == double.PositiveInfinity) break;
                if (current == toStationId) return bestDist;
                visited.Add(current);
                if (_adjacency.TryGetValue(current, out var edges))
                {
                    foreach (var edge in edges)
                    {
                        var newDist = bestDist + edge.DistanceKm;
                        if (!dist.TryGetValue(edge.ToStationId, out var oldDist) || newDist < oldDist)
                        {
                            dist[edge.ToStationId] = newDist;
                        }
                    }
                }
            }
            if (dist.TryGetValue(toStationId, out var finalDist) && finalDist < double.PositiveInfinity) return finalDist;
            return 0;
        }

        public List<double[]> GetPathCoordinates(int fromStationId, int toStationId)
        {
            var startStation = _db.Stations.Find(fromStationId);
            var endStation = _db.Stations.Find(toStationId);
            if (startStation == null || endStation == null) return new List<double[]>();
            string startNodeId = FindNearestOsmNode(startStation.Latitude, startStation.Longitude);
            string endNodeId = FindNearestOsmNode(endStation.Latitude, endStation.Longitude);
            var pathNodeIds = RunDijkstraOnOsm(startNodeId, endNodeId);
            return pathNodeIds.Select(id => new double[] { _osmParser.Nodes[id].Lat, _osmParser.Nodes[id].Lon }).ToList();
        }

        private string FindNearestOsmNode(double lat, double lon)
        {
            if (_osmParser.Nodes == null || !_osmParser.Nodes.Any()) return null;
            return _osmParser.Nodes.Values.OrderBy(n => Math.Pow(n.Lat - lat, 2) + Math.Pow(n.Lon - lon, 2)).FirstOrDefault()?.Id;
        }

        private List<string> RunDijkstraOnOsm(string startId, string endId)
        {
            // (Senin mevcut kodundaki aynı mantık)
            var dist = new Dictionary<string, double>();
            var prev = new Dictionary<string, string>();
            var pq = new SortedSet<(double d, string id)>(Comparer<(double d, string id)>.Create((a, b) => a.d == b.d ? a.id.CompareTo(b.id) : a.d.CompareTo(b.d)));

            foreach (var id in _osmParser.Nodes.Keys) dist[id] = double.PositiveInfinity;
            if (!dist.ContainsKey(startId)) return new List<string> { startId };

            dist[startId] = 0;
            pq.Add((0, startId));

            while (pq.Count > 0)
            {
                var current = pq.Min;
                pq.Remove(current);
                if (current.id == endId) break;
                foreach (var edge in _osmParser.Nodes[current.id].Edges)
                {
                    double alt = dist[current.id] + edge.Distance;
                    if (alt < dist[edge.TargetId])
                    {
                        pq.Remove((dist[edge.TargetId], edge.TargetId));
                        dist[edge.TargetId] = alt;
                        prev[edge.TargetId] = current.id;
                        pq.Add((alt, edge.TargetId));
                    }
                }
            }
            var path = new List<string>();
            string curr = endId;
            while (curr != null && prev.ContainsKey(curr)) { path.Add(curr); curr = prev[curr]; }
            path.Add(startId);
            path.Reverse();
            return path;
        }

    }

    // --- YARDIMCI SINIFLAR ---

    internal class StationDemandInternal
    {
        public int StationId { get; set; }
        public Station Station { get; set; }
        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }

        // YENİ ÖZELLİK: Bu istasyondaki hangi kargoları aldık?
        public List<int> IncludedRequestIds { get; set; } = new List<int>();
    }

    internal class PlannedRoute
    {
        public Vehicle Vehicle { get; set; }
        public List<StationDemandInternal> Stops { get; } = new List<StationDemandInternal>();
        public double TotalDistanceKm { get; set; }
        public double UsedCapacityKg { get; set; }
    }
}