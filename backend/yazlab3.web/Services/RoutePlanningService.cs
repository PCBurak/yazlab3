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

        // StationDistance tablosunu adjacency-list'e çevireceğiz
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

            // StationDistance tablosundan yol grafiğini oluştur
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
        // ANA API: CargoRequest listesi -> Route listesi
        // ------------------------------------------------------------
        public List<Route> PlanRoutes(List<CargoRequest> requests, bool unlimitedVehicles)
        {
            if (requests == null || requests.Count == 0)
                return new List<Route>();

            // 1) Bu isteklerde kullanılan istasyonlar
            var stationIds = requests
                .Select(r => r.StationId)
                .Distinct()
                .ToList();

            var stationMap = _db.Stations
                .Where(s => stationIds.Contains(s.Id))
                .ToDictionary(s => s.Id);

            // 2) Aynı istasyondaki kargoları grupla
            var demands = requests
                .GroupBy(r => r.StationId)
                .Select(g => new StationDemandInternal
                {
                    StationId = g.Key,
                    Station = stationMap[g.Key],
                    CargoCount = g.Sum(x => x.CargoCount),
                    TotalWeightKg = g.Sum(x => x.TotalWeightKg)
                })
                .OrderByDescending(d => d.TotalWeightKg) // ağırdan hafife
                .ToList();

            // 3) Temel (kiralı olmayan) araçlar
            var availableVehicles = _db.Vehicles
                .Where(v => !v.IsRented)
                .OrderBy(v => v.CapacityKg)
                .ToList();

            var plannedRoutes = new List<PlannedRoute>();

            // 4) Her istasyon talebini sırayla rota/araçlara dağıt
            foreach (var demand in demands)
            {
                // Önce mevcut rotalara greedy insertion ile eklemeyi dene
                if (TryInsertIntoExistingRoute(plannedRoutes, demand))
                    continue;

                // Hiçbir rotaya sığmadı -> yeni araç
                var vehicle = availableVehicles
                    .FirstOrDefault(v => v.CapacityKg >= demand.TotalWeightKg);

                if (vehicle == null)
                {
                    if (!unlimitedVehicles)
                    {
                        // sınırlı araç probleminde bu istasyon taşınamayacak
                        // (istersen burada "Unserved" listesi tutabilirsin)
                        continue;
                    }

                    // sınırsız araç modunda 500kg kapasiteli kiralık araç
                    vehicle = new Vehicle
                    {
                        CapacityKg = 500,
                        IsRented = true,
                        RentalCost = 200
                    };

                    _db.Vehicles.Add(vehicle);
                    _db.SaveChanges();
                }
                else
                {
                    // bu base aracı yeni rota açarken tekrar kullanma
                    availableVehicles.Remove(vehicle);
                }

                var newRoute = new PlannedRoute
                {
                    Vehicle = vehicle,
                    UsedCapacityKg = demand.TotalWeightKg,
                    TotalDistanceKm = 0
                };

                // ilk rota: depo yoksa bile şimdilik sadece istasyon listesi
                newRoute.Stops.Add(demand);
                plannedRoutes.Add(newRoute);
            }

            // 5) PlannedRoute -> Route (EF entity) dönüşümü
            var routes = new List<Route>();

            foreach (var planned in plannedRoutes)
            {
                // toplam mesafe: depo yoksa istasyonlar arası zincir
                double totalDist = 0;

                for (int i = 0; i < planned.Stops.Count - 1; i++)
                {
                    var s1 = planned.Stops[i].Station;
                    var s2 = planned.Stops[i + 1].Station;
                    totalDist += CalculateDistanceKm(s1, s2);
                }

                // planned.TotalDistanceKm algoritma sırasında artmış olabilir,
                // onu da ekleyelim (fazladan bir şey yapmadıysan çoğu zaman 0)
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
        // Mevcut rotaya istasyon ekleme (greedy insertion)
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
                // kapasite kontrolü
                if (route.UsedCapacityKg + demand.TotalWeightKg > route.Vehicle.CapacityKg)
                    continue;

                // rota içindeki her pozisyona eklemeyi dene
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

            if (bestRoute == null)
                return false;

            bestRoute.Stops.Insert(bestIndex, demand);
            bestRoute.UsedCapacityKg += demand.TotalWeightKg;

            if (bestExtra > 0 && bestExtra < double.MaxValue)
                bestRoute.TotalDistanceKm += bestExtra;

            return true;
        }

        // ------------------------------------------------------------
        // DİJKSTRA: StationDistance grafiği üzerinde en kısa yol (km)
        // ------------------------------------------------------------

        private double CalculateDistanceKm(Station a, Station b)
        {
            if (a == null || b == null)
                return 0;

            if (a.Id == b.Id)
                return 0;

            return GetShortestPathDistanceKm(a.Id, b.Id);
        }

        private double GetShortestPathDistanceKm(int fromStationId, int toStationId)
        {
            // İstasyonların sayısı az olduğu için (Kocaeli ilçeleri),
            // klasik Dijkstra'yı basit bir "min arama" ile yazmak yeterli.

            var dist = new Dictionary<int, double>();
            var visited = new HashSet<int>();

            // Başlangıç mesafeleri
            foreach (var nodeId in _adjacency.Keys)
            {
                dist[nodeId] = double.PositiveInfinity;
            }

            if (!dist.ContainsKey(fromStationId))
                return 0; // grafikte yoksa

            dist[fromStationId] = 0;

            while (true)
            {
                // Henüz ziyaret edilmemiş en küçük mesafeli düğümü bul
                int current = -1;
                double bestDist = double.PositiveInfinity;

                foreach (var kvp in dist)
                {
                    if (visited.Contains(kvp.Key))
                        continue;

                    if (kvp.Value < bestDist)
                    {
                        bestDist = kvp.Value;
                        current = kvp.Key;
                    }
                }

                if (current == -1 || bestDist == double.PositiveInfinity)
                    break; // ulaşılacak düğüm kalmadı

                if (current == toStationId)
                    break; // hedefe ulaştık

                visited.Add(current);

                if (!_adjacency.TryGetValue(current, out var edges))
                    continue;

                foreach (var edge in edges)
                {
                    var neighbor = edge.ToStationId;
                    var newDist = bestDist + edge.DistanceKm;

                    if (!dist.TryGetValue(neighbor, out var oldDist) ||
                        newDist < oldDist)
                    {
                        dist[neighbor] = newDist;
                    }
                }
            }

            if (dist.TryGetValue(toStationId, out var finalDist) &&
                finalDist < double.PositiveInfinity)
            {
                return finalDist;
            }

            // Ulaşılamıyorsa 0 döndür (istersen burada büyük bir sayı da verebilirsin)
            return 0;
        }
    }

    // ------------------------------------------------------------
    // Algoritma içi yardımcı sınıflar
    // ------------------------------------------------------------

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
