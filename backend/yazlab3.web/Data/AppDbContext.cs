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

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }
    }
}
