using Microsoft.AspNetCore.Mvc;
using yazlab3.web.DTOs;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly IUserRouteService _service;

        public UserController(IUserRouteService service)
        {
            _service = service;
        }

        [HttpPost("request-cargo")]
        public IActionResult RequestCargo([FromBody] CargoRequestDto dto)
        {
            var result = _service.CreateCargoAndAssignRoute(dto);
            return Ok(result);
        }
    }
}
