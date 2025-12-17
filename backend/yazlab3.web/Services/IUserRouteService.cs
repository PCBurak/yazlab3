using yazlab3.web.DTOs;

namespace yazlab3.web.Services
{
    public interface IUserRouteService
    {
        UserRouteResponseDto CreateCargoAndAssignRoute(CargoRequestDto dto);
    }

}