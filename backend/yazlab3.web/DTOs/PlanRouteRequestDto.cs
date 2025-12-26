using System;
using System.Collections.Generic;

namespace yazlab3.web.DTOs
{
    public class PlanRouteRequestDto
    {
        public bool UnlimitedVehicles { get; set; }

        // --- YENİ EKLENEN KISIM ---
        // 0: Max Weight (Varsayılan - Ağırlık Odaklı)
        // 1: Max Count (Adet Odaklı - Küçük Paketler Önce)
        public int Strategy { get; set; } = 0;

        // “next day” cargo list
        public List<CargoRequestDto> CargoRequests { get; set; } = new();
    }

    public class CargoRequestDto
    {
        public int StationId { get; set; }
        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    }
}