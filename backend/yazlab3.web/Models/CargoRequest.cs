using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace yazlab3.web.Models
{
    public class CargoRequest
    {
        public int Id { get; set; }

        public int StationId { get; set; }
        public Station Station { get; set; }

        public int CargoCount { get; set; }
        public int TotalWeightKg { get; set; }

        public DateTime RequestDate { get; set; } = DateTime.Now;

        public string ReceiverName { get; set; } = "";

        public string CargoType { get; set; } = "Standart";

        public int UserId { get; set; }
        public User User { get; set; }
    }
}