using yazlab3.web.DTOs;

public interface IUserRouteService
{
    UserRouteResponseDto CreateCargoAndAssignRoute(CargoRequestDto dto);
}
