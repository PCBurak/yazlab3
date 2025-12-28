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
        private readonly ICostService _costService; // dependency kalsın (senin yapını bozmayalım)
        private readonly OsmDataService _osmParser;

        // Dijkstra için Graph yapısı
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

            // Veritabanındaki mesafeleri Graph'a yükle
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

        public RoutePlanResult PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles, int strategy = 0)
        {
            if (requests == null || requests.Count == 0)
                return new RoutePlanResult();

            // --- 1) AYARLARI VERİTABANINDAN ÇEK ---
            var settings = _db.SystemSettings.ToDictionary(s => s.Key, s => s.Value);

            double rentedCapacity = double.Parse(settings.GetValueOrDefault("RentedCapacity", "500"));
            double rentalCost = double.Parse(settings.GetValueOrDefault("RentalCost", "200"));
            double fuelCost = double.Parse(settings.GetValueOrDefault("FuelCost", "1"));

            // --- 2) FIXED MOD = SADECE 3 ÖZMAL ARAÇ (DB'de kaç tane olursa olsun) ---
            // unlimitedVehicles=false iken kesin 3 araç olsun diye burada sabitliyoruz
            var ownedFleet = _db.Vehicles
                .Where(v => !v.IsRented)
                .OrderBy(v => v.Id)
                .Take(3)
                .ToList();

            // --- 3) KARGO ELEME (TOPLAM SİSTEM KAPASİTESİNE GÖRE) ---
            List<CargoRequest> acceptedRequests;
            if (!unlimitedVehicles)
            {
                double maxSystemCapacity = ownedFleet.Sum(v => (double)v.CapacityKg);
                double currentLoad = 0;
                acceptedRequests = new List<CargoRequest>();

                List<CargoRequest> sortedCargos =
                    (strategy == 1)
                        ? requests.OrderBy(r => r.TotalWeightKg).ToList()            // Max Adet (hafifler önce)
                        : requests.OrderByDescending(r => r.TotalWeightKg).ToList(); // Max Ağırlık

                foreach (var req in sortedCargos)
                {
                    if (currentLoad + req.TotalWeightKg <= maxSystemCapacity)
                    {
                        acceptedRequests.Add(req);
                        currentLoad += req.TotalWeightKg;
                    }
                    // burada rejected'a eklemeye gerek yok:
                    // çünkü en sonda "gerçek rejected = input - shipped" hesaplayacağız
                }
            }
            else
            {
                acceptedRequests = requests;
            }

            // --- 4) GRUPLAMA (İSTASYON DEMAND) ---
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
                    IncludedRequestIds = g.Select(x => x.Id).ToList(),
                    LoadedCargos = g.Select(x => new
                    {
                        cargoId = x.Id,
                        userName = x.User?.Username ?? "Bilinmeyen",
                        weight = x.TotalWeightKg,
                        count = x.CargoCount,
                        requestDate = x.RequestDate
                    }).Cast<object>().ToList()
                })
                .OrderByDescending(d => d.TotalWeightKg)
                .ToList();

            // --- 5) ARAÇ ATAMA ---
            // unlimitedVehicles=false => sadece 3 özmal
            // unlimitedVehicles=true  => DB'deki tüm özmal + gerekirse kiralık oluştur
            var availableVehicles = unlimitedVehicles
                ? _db.Vehicles.Where(v => !v.IsRented).OrderBy(v => v.CapacityKg).ToList()
                : ownedFleet.OrderBy(v => v.CapacityKg).ToList();

            var plannedRoutes = new List<PlannedRoute>();

            foreach (var demand in demands)
            {
                // Mevcut rotalara eklenebiliyorsa ekle
                if (TryInsertIntoExistingRoute(plannedRoutes, demand, rentalCost, fuelCost))
                    continue;

                // Yeni araç seç
                var vehicle = availableVehicles.FirstOrDefault(v => v.CapacityKg >= demand.TotalWeightKg);

                if (vehicle == null)
                {
                    if (!unlimitedVehicles)
                    {
                        // fixed mod: kiralık yok => bu demand taşınamayacak
                        // (Rejected hesaplamasını en sonda input-shipped ile yapacağız)
                        continue;
                    }

                    // unlimited: kiralık aç
                    vehicle = new Vehicle
                    {
                        CapacityKg = (int)rentedCapacity,
                        IsRented = true,
                        RentalCost = (int)rentalCost
                    };
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

            // --- 6) ROTA OLUŞTURMA ---
            var routes = new List<Route>();
            var depot = _db.Stations.Find(99);
            if (depot == null)
                depot = new Station { Id = 99, Name = "Depo", Latitude = 40.765, Longitude = 29.940 };

            foreach (var planned in plannedRoutes)
            {
                double totalDist = 0;
                List<double[]> fullPathCoordinates = new List<double[]>();

                if (planned.Stops.Count > 0)
                {
                    var firstStop = planned.Stops[0].Station;
                    totalDist += CalculateDistanceKm(depot, firstStop);
                    fullPathCoordinates.AddRange(GetPathCoordinates(99, firstStop.Id));
                }

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
                    PathCoordinates = fullPathCoordinates,
                    ExactCargoIds = planned.Stops.SelectMany(s => s.IncludedRequestIds).ToList()
                };

                double baseCost = route.TotalDistanceKm * fuelCost;
                double extraRent = planned.Vehicle.IsRented ? planned.Vehicle.RentalCost : 0;
                route.TotalCost = Math.Round(baseCost + extraRent, 2);

                var routeStations = new List<RouteStation>();
                for (int i = 0; i < planned.Stops.Count; i++)
                {
                    var stop = planned.Stops[i];
                    routeStations.Add(new RouteStation
                    {
                        StationId = stop.StationId,
                        Station = stop.Station,
                        Order = i + 1,
                        LoadedCargos = stop.LoadedCargos
                    });
                }
                route.RouteStations = routeStations;

                routes.Add(route);
            }

            // --- 7) ✅ GERÇEK REJECTED = INPUT - SHIPPED (asla kaçmaz) ---
            var shippedIds = routes
                .SelectMany(r => r.ExactCargoIds ?? new List<int>())
                .ToHashSet();

            var trueRejected = requests
                .Where(req => !shippedIds.Contains(req.Id))
                .ToList();

            return new RoutePlanResult
            {
                Routes = routes,
                RejectedRequests = trueRejected
            };
        }

        // --- YARDIMCI METOTLAR ---

        private bool TryInsertIntoExistingRoute(List<PlannedRoute> plannedRoutes, StationDemandInternal demand, double rentalCost, double fuelCost)
        {
            PlannedRoute bestRoute = null;
            double minCostIncrease = double.MaxValue;

            foreach (var route in plannedRoutes)
            {
                if (route.UsedCapacityKg + demand.TotalWeightKg > route.Vehicle.CapacityKg) continue;

                double extraDistance = CalculateInsertionExtraDistance(route, demand);
                double extraCost = extraDistance * fuelCost;

                // ekstra cost kiralamadan ucuzsa ekle
                if (extraCost < minCostIncrease && extraCost < rentalCost)
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
            var depot = _db.Stations.Find(99) ?? new Station { Latitude = 40.765, Longitude = 29.940 };

            if (route.Stops.Count == 0) return CalculateDistanceKm(depot, demand.Station) * 2;

            double bestExtra = double.MaxValue;
            for (int i = 0; i <= route.Stops.Count; i++)
            {
                Station prev = (i == 0) ? depot : route.Stops[i - 1].Station;
                Station next = (i == route.Stops.Count) ? depot : route.Stops[i].Station;

                double currentDist = CalculateDistanceKm(prev, next);
                double newDist = CalculateDistanceKm(prev, demand.Station) + CalculateDistanceKm(demand.Station, next);

                if (newDist - currentDist < bestExtra)
                    bestExtra = newDist - currentDist;
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

            var aVal =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(a.Latitude)) * Math.Cos(ToRadians(b.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(aVal), Math.Sqrt(1 - aVal));
            return Math.Round(R * c, 2);
        }

        private double ToRadians(double deg) => deg * (Math.PI / 180);

        public List<double[]> GetPathCoordinates(int fromStationId, int toStationId)
        {
            var startStation = _db.Stations.Find(fromStationId);
            var endStation = _db.Stations.Find(toStationId);
            if (startStation == null || endStation == null) return new List<double[]>();

            if (_osmParser.Nodes == null || !_osmParser.Nodes.Any())
            {
                return new List<double[]> {
                    new double[] { startStation.Latitude, startStation.Longitude },
                    new double[] { endStation.Latitude, endStation.Longitude }
                };
            }

            try
            {
                int candidateLimit = 3;
                var startCandidates = FindSmartCandidates(startStation.Latitude, startStation.Longitude, candidateLimit);
                var endCandidates = FindSmartCandidates(endStation.Latitude, endStation.Longitude, candidateLimit);

                if (!startCandidates.Any() || !endCandidates.Any()) throw new Exception("Yol yok");

                foreach (var startId in startCandidates)
                {
                    foreach (var endId in endCandidates)
                    {
                        if (startId == endId) continue;
                        var pathNodeIds = RunDijkstraOnOsm(startId, endId);

                        if (pathNodeIds != null && pathNodeIds.Count > 1)
                        {
                            return pathNodeIds
                                .Where(id => _osmParser.Nodes.ContainsKey(id))
                                .Select(id => new double[] { _osmParser.Nodes[id].Lat, _osmParser.Nodes[id].Lon })
                                .ToList();
                        }
                    }
                }

                throw new Exception("Rota bulunamadı");
            }
            catch
            {
                if (fromStationId != toStationId)
                {
                    return new List<double[]> {
                        new double[] { startStation.Latitude, startStation.Longitude },
                        new double[] { endStation.Latitude, endStation.Longitude }
                    };
                }
                return new List<double[]>();
            }
        }

        private double GetShortestPathDistanceKm(int fromStationId, int toStationId)
        {
            if (_adjacency == null || !_adjacency.Any()) return 0;

            var dist = new Dictionary<int, double>();
            var visited = new HashSet<int>();

            foreach (var nodeId in _adjacency.Keys)
                dist[nodeId] = double.PositiveInfinity;

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
                            dist[edge.ToStationId] = newDist;
                    }
                }
            }

            if (dist.TryGetValue(toStationId, out var finalDist) && finalDist < double.PositiveInfinity)
                return finalDist;

            return 0;
        }

        private List<string> FindSmartCandidates(double lat, double lon, int limit)
        {
            if (_osmParser.Nodes == null || !_osmParser.Nodes.Any()) return new List<string>();

            return _osmParser.Nodes.Values
                .Where(n => n.Edges != null && n.Edges.Count > 0)
                .OrderBy(n => Math.Pow(n.Lat - lat, 2) + Math.Pow(n.Lon - lon, 2))
                .Take(limit)
                .Select(n => n.Id)
                .ToList();
        }

        private List<string> RunDijkstraOnOsm(string startId, string endId)
        {
            var dist = new Dictionary<string, double>();
            var prev = new Dictionary<string, string>();
            var pq = new SortedSet<(double d, string id)>(
                Comparer<(double d, string id)>.Create((a, b) => a.d == b.d ? a.id.CompareTo(b.id) : a.d.CompareTo(b.d))
            );

            dist[startId] = 0;
            pq.Add((0, startId));

            while (pq.Count > 0)
            {
                var (currentDist, currentId) = pq.Min;
                pq.Remove(pq.Min);

                if (currentId == endId) break;
                if (currentDist > dist.GetValueOrDefault(currentId, double.PositiveInfinity)) continue;

                if (_osmParser.Nodes.TryGetValue(currentId, out var currentNode))
                {
                    foreach (var edge in currentNode.Edges)
                    {
                        double newDist = currentDist + edge.Distance;
                        double oldDist = dist.GetValueOrDefault(edge.TargetId, double.PositiveInfinity);

                        if (newDist < oldDist)
                        {
                            if (oldDist < double.PositiveInfinity) pq.Remove((oldDist, edge.TargetId));
                            dist[edge.TargetId] = newDist;
                            prev[edge.TargetId] = currentId;
                            pq.Add((newDist, edge.TargetId));
                        }
                    }
                }
            }

            if (!prev.ContainsKey(endId)) return null;

            var path = new List<string>();
            string curr = endId;

            while (curr != null)
            {
                path.Add(curr);
                if (curr == startId) break;
                if (!prev.TryGetValue(curr, out curr)) break;
            }

            if (path.Last() != startId) return null;

            path.Reverse();
            return path;
        }
    }

    internal class StationDemandInternal
    {
        public int StationId { get; set; }
        public Station Station { get; set; }
        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }
        public List<int> IncludedRequestIds { get; set; } = new List<int>();
        public List<object> LoadedCargos { get; set; } = new List<object>();
    }

    internal class PlannedRoute
    {
        public Vehicle Vehicle { get; set; }
        public List<StationDemandInternal> Stops { get; } = new List<StationDemandInternal>();
        public double TotalDistanceKm { get; set; }
        public double UsedCapacityKg { get; set; }
    }

    public class RoutePlanResult
    {
        public List<Route> Routes { get; set; } = new();
        public List<CargoRequest> RejectedRequests { get; set; } = new();
    }
}
