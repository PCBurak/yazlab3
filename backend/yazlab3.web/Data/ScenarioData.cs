using System.Collections.Generic;
using yazlab3.web.DTOs;

namespace yazlab3.web.Data
{
    public static class ScenarioData
    {
        public static Dictionary<int, List<CargoRequestDto>> Scenarios =
            new Dictionary<int, List<CargoRequestDto>>
        {
            {
                1, new List<CargoRequestDto>
                {
                    new() { StationId = 1, CargoCount = 10, TotalWeightKg = 120 },
                    new() { StationId = 2, CargoCount = 8,  TotalWeightKg = 80  },
                    new() { StationId = 3, CargoCount = 15, TotalWeightKg = 200 },
                    new() { StationId = 4, CargoCount = 10, TotalWeightKg = 150 },
                    new() { StationId = 5, CargoCount = 12, TotalWeightKg = 180 },
                    new() { StationId = 6, CargoCount = 5,  TotalWeightKg = 70  },
                    new() { StationId = 7, CargoCount = 7,  TotalWeightKg = 90  },
                    new() { StationId = 8, CargoCount = 6,  TotalWeightKg = 60  },
                    new() { StationId = 9, CargoCount = 9,  TotalWeightKg = 110 },
                    new() { StationId = 10, CargoCount = 11, TotalWeightKg = 130 },
                    new() { StationId = 11, CargoCount = 6,  TotalWeightKg = 75  },
                    new() { StationId = 12, CargoCount = 14, TotalWeightKg = 160 }
                }
            },
            {
                2, new List<CargoRequestDto>
                {
                    new() { StationId = 1, CargoCount = 40, TotalWeightKg = 200 },
                    new() { StationId = 2, CargoCount = 35, TotalWeightKg = 175 },
                    new() { StationId = 3, CargoCount = 10, TotalWeightKg = 150 },
                    new() { StationId = 4, CargoCount = 5,  TotalWeightKg = 100 },
                    new() { StationId = 12, CargoCount = 20, TotalWeightKg = 160 }
                }
            },
            {
                3, new List<CargoRequestDto>
                {
                    new() { StationId = 2, CargoCount = 3, TotalWeightKg = 700 },
                    new() { StationId = 5, CargoCount = 4, TotalWeightKg = 800 },
                    new() { StationId = 6, CargoCount = 5, TotalWeightKg = 900 },
                    new() { StationId = 12, CargoCount = 5, TotalWeightKg = 300 }
                }
            },
            {
                4, new List<CargoRequestDto>
                {
                    new() { StationId = 1, CargoCount = 30, TotalWeightKg = 300 },
                    new() { StationId = 7, CargoCount = 15, TotalWeightKg = 220 },
                    new() { StationId = 8, CargoCount = 5,  TotalWeightKg = 250 },
                    new() { StationId = 9, CargoCount = 20, TotalWeightKg = 180 },
                    new() { StationId = 10, CargoCount = 10, TotalWeightKg = 200 },
                    new() { StationId = 11, CargoCount = 8,  TotalWeightKg = 400 }
                }
            }
        };
    }
}
