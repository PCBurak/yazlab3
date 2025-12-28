using yazlab3.web.DTOs;
using yazlab3.web.Models;

namespace yazlab3.web.Services
{
    public class ScenarioService
    {
        public List<CargoRequest> GetScenarioRequests(int scenarioId)
        {
            var requests = new List<CargoRequest>();

            switch (scenarioId)
            {
                case 1:
                    requests.Add(CreateReq(1, 10, 120));
                    requests.Add(CreateReq(2, 8, 80));
                    requests.Add(CreateReq(3, 15, 200));
                    requests.Add(CreateReq(4, 10, 150));
                    requests.Add(CreateReq(5, 12, 180));
                    requests.Add(CreateReq(6, 5, 70));
                    requests.Add(CreateReq(7, 7, 90));
                    requests.Add(CreateReq(8, 6, 60));
                    requests.Add(CreateReq(9, 9, 110));
                    requests.Add(CreateReq(10, 11, 130));
                    requests.Add(CreateReq(11, 6, 75));
                    requests.Add(CreateReq(12, 14, 160));
                    break;

                case 2:
                    requests.Add(CreateReq(1, 40, 200));
                    requests.Add(CreateReq(2, 35, 175));
                    requests.Add(CreateReq(3, 10, 150));
                    requests.Add(CreateReq(4, 5, 100));
                    requests.Add(CreateReq(6, 8, 120));
                    requests.Add(CreateReq(12, 20, 160));
                    break;

                case 3:
                    requests.Add(CreateReq(2, 3, 700));
                    requests.Add(CreateReq(5, 4, 800));
                    requests.Add(CreateReq(6, 5, 900));
                    requests.Add(CreateReq(12, 5, 300));
                    break;

                case 4:
                    requests.Add(CreateReq(1, 30, 300));
                    requests.Add(CreateReq(7, 15, 220));
                    requests.Add(CreateReq(8, 5, 250));
                    requests.Add(CreateReq(9, 20, 180));
                    requests.Add(CreateReq(10, 10, 200));
                    requests.Add(CreateReq(11, 8, 400));
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