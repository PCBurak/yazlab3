using Microsoft.AspNetCore.Mvc;
using yazlab3.web.Data;
using yazlab3.web.Models;
using System.Linq;

namespace yazlab3.web.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuthController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDto request)
        {
            var user = _db.Users.FirstOrDefault(u => u.Username == request.Username && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid username or password" });

            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                role = user.Role
            });
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequestDto request)
        {
            if (_db.Users.Any(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var newUser = new User
            {
                Username = request.Username,
                Password = request.Password,
                Role = request.Role
            };

            _db.Users.Add(newUser);
            _db.SaveChanges();

            return Ok(new { message = "Registration successful" });
        }
    }

    public class LoginRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequestDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Role { get; set; } = "User";
    }
}