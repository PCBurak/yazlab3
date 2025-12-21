using yazlab3.web.DTOs;
using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public class ScenarioService
    {
        // Returns the list of cargo requests defined in the PDF for a specific scenario
        public List<CargoRequest> GetScenarioRequests(int scenarioId)
        {
            var requests = new List<CargoRequest>();

            switch (scenarioId)
            {
                case 1: // PDF Scenario 1 Data
                    requests.Add(CreateReq(1, 10, 120));  // Başiskele
                    requests.Add(CreateReq(2, 8, 80));    // Çayırova
                    requests.Add(CreateReq(3, 15, 200));  // Darıca
                    requests.Add(CreateReq(4, 10, 150));  // Derince
                    requests.Add(CreateReq(5, 12, 180));  // Dilovası
                    requests.Add(CreateReq(6, 5, 70));    // Gebze
                    requests.Add(CreateReq(7, 7, 90));    // Gölcük
                    requests.Add(CreateReq(8, 6, 60));    // Kandıra
                    requests.Add(CreateReq(9, 9, 110));   // Karamürsel
                    requests.Add(CreateReq(10, 11, 130)); // Kartepe
                    requests.Add(CreateReq(11, 6, 75));   // Körfez
                    requests.Add(CreateReq(12, 14, 160)); // İzmit
                    break;

                case 2: // PDF Scenario 2 Data
                    requests.Add(CreateReq(1, 40, 200));  // Başiskele
                    requests.Add(CreateReq(2, 35, 175));  // Çayırova
                    requests.Add(CreateReq(3, 10, 150));  // Darıca
                    requests.Add(CreateReq(4, 5, 100));   // Derince
                    requests.Add(CreateReq(6, 8, 120));   // Gebze
                    requests.Add(CreateReq(12, 20, 160)); // İzmit
                    // Others are 0
                    break;

                case 3: // PDF Scenario 3 Data
                    requests.Add(CreateReq(2, 3, 700));   // Çayırova
                    requests.Add(CreateReq(5, 4, 800));   // Dilovası
                    requests.Add(CreateReq(6, 5, 900));   // Gebze
                    requests.Add(CreateReq(12, 5, 300));  // İzmit
                    break;

                case 4: // PDF Scenario 4 Data
                    requests.Add(CreateReq(1, 30, 300));  // Başiskele
                    requests.Add(CreateReq(7, 15, 220));  // Gölcük
                    requests.Add(CreateReq(8, 5, 250));   // Kandıra
                    requests.Add(CreateReq(9, 20, 180));  // Karamürsel
                    requests.Add(CreateReq(10, 10, 200)); // Kartepe
                    requests.Add(CreateReq(11, 8, 400));  // Körfez
                    break;
            }

            return requests;
        }

        private CargoRequest CreateReq(int stationId, int count, int weight)
        {
            return new CargoRequest
            {
                StationId = stationId,
                CargoCount = count,
                TotalWeightKg = weight,
                RequestDate = DateTime.Now
            };
        }
    }
}