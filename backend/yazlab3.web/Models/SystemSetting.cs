namespace yazlab3.web.Models
{
    public class SystemSetting
    {
        public int Id { get; set; }
        public string Key { get; set; } // Örn: "FuelCost", "RentalCost"
        public string Value { get; set; }
    }
}
