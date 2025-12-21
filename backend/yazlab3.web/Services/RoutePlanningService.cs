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

        // Graph adjacency list for Dijkstra
        private readonly Dictionary<int, List<Edge>> _adjacency =
            new Dictionary<int, List<Edge>>();

        private class Edge
        {
            public int ToStationId { get; set; }
            public double DistanceKm { get; set; }
        }

        public RoutePlanningService(AppDbContext db, ICostService costService)
        {
            _db = db;
            _costService = costService;

            // Load the Graph (Edges) from the Database
            var allEdges = _db.StationDistances.ToList();

            foreach (var e in allEdges)
            {
                if (!_adjacency.TryGetValue(e.FromStationId, out var list))
                {
                    list = new List<Edge>();
                    _adjacency[e.FromStationId] = list;
                }

                list.Add(new Edge
                {
                    ToStationId = e.ToStationId,
                    DistanceKm = e.DistanceKm
                });
            }
        }

        // ------------------------------------------------------------
        // MAIN API: Plan Routes
        // ------------------------------------------------------------
        public List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles)
        {
            if (requests == null || requests.Count == 0)
                return new List<Route>();

            // 1. Fetch relevant stations
            var stationIds = requests.Select(r => r.StationId).Distinct().ToList();
            var stationMap = _db.Stations
                .Where(s => stationIds.Contains(s.Id))
                .ToDictionary(s => s.Id);

            // 2. Group cargo requests by station
            var demands = requests
                .GroupBy(r => r.StationId)
                .Select(g => new StationDemandInternal
                {
                    StationId = g.Key,
                    Station = stationMap[g.Key],
                    CargoCount = g.Sum(x => x.CargoCount),
                    TotalWeightKg = g.Sum(x => x.TotalWeightKg)
                })
                .OrderByDescending(d => d.TotalWeightKg)
                .ToList();

            // 3. Get available vehicles
            var availableVehicles = _db.Vehicles
                .Where(v => !v.IsRented)
                .OrderBy(v => v.CapacityKg)
                .ToList();

            var plannedRoutes = new List<PlannedRoute>();

            // 4. Distribute cargo to vehicles
            foreach (var demand in demands)
            {
                if (TryInsertIntoExistingRoute(plannedRoutes, demand))
                    continue;

                var vehicle = availableVehicles
                    .FirstOrDefault(v => v.CapacityKg >= demand.TotalWeightKg);

                if (vehicle == null)
                {
                    if (!unlimitedVehicles) continue;

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

            // 5. Convert to Final Route Entities
            var routes = new List<Route>();

            // --- FETCH THE DEPOT (UMUTTEPE) ---
            // Ensure you have seeded ID 99 as Umuttepe in AppDbContext!
            var depot = _db.Stations.Find(99);
            if (depot == null) throw new Exception("Depot (ID 99) not found in DB!");

            foreach (var planned in plannedRoutes)
            {
                double totalDist = 0;

                // --- NEW LOGIC: START FROM UMUTTEPE ---
                // Distance from Depot -> First Stop
                if (planned.Stops.Count > 0)
                {
                    var firstStop = planned.Stops[0].Station;
                    totalDist += CalculateDistanceKm(depot, firstStop);
                }

                // Distance between subsequent stops
                for (int i = 0; i < planned.Stops.Count - 1; i++)
                {
                    var s1 = planned.Stops[i].Station;
                    var s2 = planned.Stops[i + 1].Station;
                    totalDist += CalculateDistanceKm(s1, s2);
                }

                // Add any extra distance from greedy insertion
                totalDist += planned.TotalDistanceKm;

                var route = new Route
                {
                    VehicleId = planned.Vehicle.Id,
                    Vehicle = planned.Vehicle,
                    TotalDistanceKm = Math.Round(totalDist, 2)
                };

                route.TotalCost = _costService.CalculateRouteCost(
                    route.TotalDistanceKm,
                    planned.Vehicle.IsRented);

                var routeStations = new List<RouteStation>();
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

            return routes;
        }

        // ------------------------------------------------------------
        // Greedy Insertion
        // ------------------------------------------------------------
        private bool TryInsertIntoExistingRoute(
            List<PlannedRoute> plannedRoutes,
            StationDemandInternal demand)
        {
            PlannedRoute bestRoute = null;
            int bestIndex = -1;
            double bestExtra = double.MaxValue;

            foreach (var route in plannedRoutes)
            {
                if (route.UsedCapacityKg + demand.TotalWeightKg > route.Vehicle.CapacityKg)
                    continue;

                for (int i = 0; i <= route.Stops.Count; i++)
                {
                    Station prev = i == 0 ? null : route.Stops[i - 1].Station;
                    Station next = i == route.Stops.Count ? null : route.Stops[i].Station;

                    double removed = 0;
                    if (prev != null && next != null)
                        removed = CalculateDistanceKm(prev, next);

                    double added = 0;
                    if (prev != null)
                        added += CalculateDistanceKm(prev, demand.Station);
                    if (next != null)
                        added += CalculateDistanceKm(demand.Station, next);

                    double extra = added - removed;

                    if (extra < bestExtra)
                    {
                        bestExtra = extra;
                        bestIndex = i;
                        bestRoute = route;
                    }
                }
            }

            if (bestRoute == null) return false;

            bestRoute.Stops.Insert(bestIndex, demand);
            bestRoute.UsedCapacityKg += demand.TotalWeightKg;
            if (bestExtra > 0 && bestExtra < double.MaxValue)
                bestRoute.TotalDistanceKm += bestExtra;

            return true;
        }

        // ------------------------------------------------------------
        // HYBRID DISTANCE CALCULATION (The Important Fix)
        // ------------------------------------------------------------

        private double CalculateDistanceKm(Station a, Station b)
        {
            if (a == null || b == null || a.Id == b.Id) return 0;

            // 1. Try Dijkstra (Graph) First - PDF Requirement
            double graphDist = GetShortestPathDistanceKm(a.Id, b.Id);

            // If Dijkstra found a valid path (> 0), use it.
            if (graphDist > 0) return graphDist;

            // 2. Fallback to Haversine (Math)
            // This handles missing database connections or dynamic new stations.
            return CalculateHaversineDistance(a, b);
        }

        // Standard Haversine Formula (Bird's Eye)
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

        // Dijkstra Algorithm (Path Plotting)
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

            if (dist.TryGetValue(toStationId, out var finalDist) && finalDist < double.PositiveInfinity)
                return finalDist;

            return 0;
        }

        // --- ADD THIS METHOD TO RoutePlanningService CLASS ---

        public List<double[]> GetPathCoordinates(int fromStationId, int toStationId)
        {
            // 1. If same station, just return that point
            if (fromStationId == toStationId)
            {
                var s = _db.Stations.Find(fromStationId);
                return new List<double[]> { new double[] { s.Latitude, s.Longitude } };
            }

            // 2. Run Dijkstra to find the path of IDs
            var pathIds = GetShortestPathIds(fromStationId, toStationId);

            // 3. Convert IDs to Coordinates [Lat, Lng]
            var coords = new List<double[]>();
            foreach (var id in pathIds)
            {
                var s = _db.Stations.Find(id); // Optimizable with dictionary lookup
                if (s != null)
                    coords.Add(new double[] { s.Latitude, s.Longitude });
            }
            return coords;
        }

        // --- NEW HELPER: Dijkstra that returns the PATH (List of IDs) ---
        private List<int> GetShortestPathIds(int startId, int endId)
        {
            var dist = new Dictionary<int, double>();
            var prev = new Dictionary<int, int>(); // Keeps track of "Where did I come from?"
            var visited = new HashSet<int>();
            var pq = new SortedSet<(double distance, int id)>(Comparer<(double distance, int id)>.Create((a, b) =>
                a.distance == b.distance ? a.id.CompareTo(b.id) : a.distance.CompareTo(b.distance)));

            foreach (var node in _adjacency.Keys) dist[node] = double.PositiveInfinity;
            dist[startId] = 0;
            pq.Add((0, startId));

            while (pq.Count > 0)
            {
                var (d, u) = pq.Min;
                pq.Remove(pq.Min);

                if (u == endId) break; // Found target
                if (visited.Contains(u)) continue;
                visited.Add(u);

                if (_adjacency.TryGetValue(u, out var edges))
                {
                    foreach (var edge in edges)
                    {
                        if (visited.Contains(edge.ToStationId)) continue;

                        var newDist = dist[u] + edge.DistanceKm;
                        if (newDist < dist[edge.ToStationId])
                        {
                            // Update distance and Predecessor
                            if (dist[edge.ToStationId] != double.PositiveInfinity)
                                pq.Remove((dist[edge.ToStationId], edge.ToStationId));

                            dist[edge.ToStationId] = newDist;
                            prev[edge.ToStationId] = u; // <--- This is the key! "To get to V, we came from U"
                            pq.Add((newDist, edge.ToStationId));
                        }
                    }
                }
            }

            // Reconstruct path backwards: End -> Start
            var path = new List<int>();
            if (!prev.ContainsKey(endId) && startId != endId) return path; // No path found

            int curr = endId;
            while (curr != startId)
            {
                path.Add(curr);
                curr = prev[curr];
            }
            path.Add(startId);
            path.Reverse(); // Now it is Start -> End
            return path;
        }
    }

    internal class StationDemandInternal
    {
        public int StationId { get; set; }
        public Station Station { get; set; }
        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }
    }

    internal class PlannedRoute
    {
        public Vehicle Vehicle { get; set; }
        public List<StationDemandInternal> Stops { get; } = new List<StationDemandInternal>();
        public double TotalDistanceKm { get; set; }
        public double UsedCapacityKg { get; set; }
    }
}