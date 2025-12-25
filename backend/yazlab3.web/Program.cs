using Microsoft.EntityFrameworkCore;
using yazlab3.web.Data;
using yazlab3.web.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddSingleton<OsmDataService>(sp =>
{
    var parser = new OsmDataService();
    // GeoJSON dosyasının yolunu belirtin (Data klasöründe olduğunu varsayıyoruz)
    var filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "kocaeli.geojson");

    if (File.Exists(filePath))
    {
        parser.LoadFromGeoJson(filePath);
    }
    return parser;
});

builder.Services.AddScoped<ICostService, CostService>();
builder.Services.AddScoped<IRoutePlanningService, RoutePlanningService>();
builder.Services.AddScoped<IUserRouteService, UserRouteService>();

// ✅ CORS: allow React dev server (Vite)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();

    // ✅ Only redirect to HTTPS in Production
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseRouting();

// ✅ CORS must be after routing and before auth/endpoints
app.UseCors("AllowReact");

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
