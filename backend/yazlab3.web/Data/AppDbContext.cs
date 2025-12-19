using Microsoft.EntityFrameworkCore;
using yazlab3.web.Models;

namespace yazlab3.web.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<Station> Stations { get; set; }
        public DbSet<Vehicle> Vehicles { get; set; }
        public DbSet<CargoRequest> CargoRequests { get; set; }
        public DbSet<Route> Routes { get; set; }
        public DbSet<RouteStation> RouteStations { get; set; }

        public DbSet<StationDistance> StationDistances { get; set; }


        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

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
        }
    }

    

}
