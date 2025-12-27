using Microsoft.EntityFrameworkCore;
using yazlab3.web.Models;

namespace yazlab3.web.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Station> Stations { get; set; }
        public DbSet<StationDistance> StationDistances { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<CargoRequest> CargoRequests { get; set; }
        public DbSet<Route> Routes { get; set; }
        public DbSet<RouteStation> RouteStations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // CargoRequest → Station
            modelBuilder.Entity<CargoRequest>()
                .HasOne(c => c.Station)
                .WithMany()
                .HasForeignKey(c => c.StationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Route → Vehicle
            modelBuilder.Entity<Route>()
                .HasOne(r => r.Vehicle)
                .WithMany()
                .HasForeignKey(r => r.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            // RouteStation → Route
            modelBuilder.Entity<RouteStation>()
                .HasOne(rs => rs.Route)
                .WithMany(r => r.RouteStations)
                .HasForeignKey(rs => rs.RouteId)
                .OnDelete(DeleteBehavior.Cascade);

            // RouteStation → Station
            modelBuilder.Entity<RouteStation>()
                .HasOne(rs => rs.Station)
                .WithMany()
                .HasForeignKey(rs => rs.StationId)
                .OnDelete(DeleteBehavior.Restrict);

            // StationDistance (graph edges)
            modelBuilder.Entity<StationDistance>()
                .HasOne(sd => sd.FromStation)
                .WithMany()
                .HasForeignKey(sd => sd.FromStationId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StationDistance>()
                .HasOne(sd => sd.ToStation)
                .WithMany()
                .HasForeignKey(sd => sd.ToStationId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1. SEED STATIONS (Districts of Kocaeli)
            modelBuilder.Entity<Station>().HasData(
                new Station { Id = 1, Name = "Başiskele", Latitude = 40.7150, Longitude = 29.9270 },
                new Station { Id = 2, Name = "Çayırova", Latitude = 40.8190, Longitude = 29.3730 },
                new Station { Id = 3, Name = "Darıca", Latitude = 40.7730, Longitude = 29.4000 },
                new Station { Id = 4, Name = "Derince", Latitude = 40.7560, Longitude = 29.8300 },
                new Station { Id = 5, Name = "Dilovası", Latitude = 40.7870, Longitude = 29.5440 },
                new Station { Id = 6, Name = "Gebze", Latitude = 40.8020, Longitude = 29.4300 },
                new Station { Id = 7, Name = "Gölcük", Latitude = 40.7170, Longitude = 29.8180 },
                new Station { Id = 8, Name = "Kandıra", Latitude = 41.0700, Longitude = 30.1500 },
                new Station { Id = 9, Name = "Karamürsel", Latitude = 40.6920, Longitude = 29.6160 },
                new Station { Id = 10, Name = "Kartepe", Latitude = 40.7530, Longitude = 30.0160 },
                new Station { Id = 11, Name = "Körfez", Latitude = 40.7710, Longitude = 29.7430 },
                new Station { Id = 12, Name = "İzmit", Latitude = 40.7650, Longitude = 29.9400 },
                new Station { Id = 99, Name = "Umuttepe", Latitude = 40.8222, Longitude = 29.9217 }
            );

            modelBuilder.Entity<StationDistance>().HasData(
    // 1. Başiskele Neighbors
    new StationDistance { Id = 1, FromStationId = 1, ToStationId = 12, DistanceKm = 10 }, // -> İzmit
    new StationDistance { Id = 2, FromStationId = 1, ToStationId = 7, DistanceKm = 15 },  // -> Gölcük
    new StationDistance { Id = 3, FromStationId = 1, ToStationId = 10, DistanceKm = 12 }, // -> Kartepe

    // 2. Gölcük Neighbors
    new StationDistance { Id = 4, FromStationId = 7, ToStationId = 1, DistanceKm = 15 },  // -> Başiskele
    new StationDistance { Id = 5, FromStationId = 7, ToStationId = 9, DistanceKm = 18 },  // -> Karamürsel

    // 3. Karamürsel Neighbors
    new StationDistance { Id = 6, FromStationId = 9, ToStationId = 7, DistanceKm = 18 },  // -> Gölcük

    // 4. İzmit Neighbors (Central Hub)
    new StationDistance { Id = 7, FromStationId = 12, ToStationId = 1, DistanceKm = 10 }, // -> Başiskele
    new StationDistance { Id = 8, FromStationId = 12, ToStationId = 10, DistanceKm = 10 }, // -> Kartepe
    new StationDistance { Id = 9, FromStationId = 12, ToStationId = 4, DistanceKm = 13 }, // -> Derince
    new StationDistance { Id = 10, FromStationId = 12, ToStationId = 8, DistanceKm = 40 }, // -> Kandıra

    // 5. Derince Neighbors
    new StationDistance { Id = 11, FromStationId = 4, ToStationId = 12, DistanceKm = 13 }, // -> İzmit
    new StationDistance { Id = 12, FromStationId = 4, ToStationId = 11, DistanceKm = 8 },  // -> Körfez

    // 6. Körfez Neighbors
    new StationDistance { Id = 13, FromStationId = 11, ToStationId = 4, DistanceKm = 8 },   // -> Derince
    new StationDistance { Id = 14, FromStationId = 11, ToStationId = 5, DistanceKm = 16 },  // -> Dilovası

    // 7. Dilovası Neighbors
    new StationDistance { Id = 15, FromStationId = 5, ToStationId = 11, DistanceKm = 16 },  // -> Körfez
    new StationDistance { Id = 16, FromStationId = 5, ToStationId = 6, DistanceKm = 10 },   // -> Gebze

    // 8. Gebze Neighbors
    new StationDistance { Id = 17, FromStationId = 6, ToStationId = 5, DistanceKm = 10 },   // -> Dilovası
    new StationDistance { Id = 18, FromStationId = 6, ToStationId = 2, DistanceKm = 7 },    // -> Çayırova
    new StationDistance { Id = 19, FromStationId = 6, ToStationId = 3, DistanceKm = 6 },    // -> Darıca

    // 9. Çayırova Neighbors
    new StationDistance { Id = 20, FromStationId = 2, ToStationId = 6, DistanceKm = 7 },    // -> Gebze
    new StationDistance { Id = 21, FromStationId = 2, ToStationId = 3, DistanceKm = 9 },    // -> Darıca

    // 10. Darıca Neighbors
    new StationDistance { Id = 22, FromStationId = 3, ToStationId = 6, DistanceKm = 6 },    // -> Gebze
    new StationDistance { Id = 23, FromStationId = 3, ToStationId = 2, DistanceKm = 9 },    // -> Çayırova

    // 11. Kandıra Neighbors
    new StationDistance { Id = 24, FromStationId = 8, ToStationId = 12, DistanceKm = 40 }, // -> İzmit

    // 12. Kartepe Neighbors
    new StationDistance { Id = 25, FromStationId = 10, ToStationId = 12, DistanceKm = 10 }, // -> İzmit
    new StationDistance { Id = 26, FromStationId = 10, ToStationId = 1, DistanceKm = 12 }  // -> Başiskele
);

            // 2. SEED VEHICLES (Project Requirement: 3 initial vehicles)
            // Capacities: 500, 750, 1000 kg [cite: 39]
            // Rental Cost: 0 [cite: 38]
            modelBuilder.Entity<Vehicle>().HasData(
                new Vehicle { Id = 1, CapacityKg = 500, IsRented = false, RentalCost = 0 },
                new Vehicle { Id = 2, CapacityKg = 750, IsRented = false, RentalCost = 0 },
                new Vehicle { Id = 3, CapacityKg = 1000, IsRented = false, RentalCost = 0 }
            );

            modelBuilder.Entity<User>().HasData(
                new User { Id = 1, Username = "admin", Password = "123", Role = "Admin" },
                new User { Id = 2, Username = "user1", Password = "123", Role = "User" },
                new User { Id = 3, Username = "user2", Password = "123", Role = "User" }
            );



            // 2. CONNECT UMUTTEPE TO THE GRAPH
            modelBuilder.Entity<StationDistance>().HasData(
                // ... keep your existing edges ...

                // Connect Umuttepe <-> İzmit (Approx 10-15km)
                new StationDistance { Id = 100, FromStationId = 99, ToStationId = 12, DistanceKm = 15 },
                new StationDistance { Id = 101, FromStationId = 12, ToStationId = 99, DistanceKm = 15 }
            );
        }
    }
}