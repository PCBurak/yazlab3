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
            // Simple check: Does a user exist with this Name AND Password?
            var user = _db.Users.FirstOrDefault(u => u.Username == request.Username && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid username or password" });

            // Return the user info so the Frontend knows who is logged in
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
            // 1. Check if user already exists
            if (_db.Users.Any(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // 2. Create User
            var newUser = new User
            {
                Username = request.Username,
                Password = request.Password,
                Role = request.Role // "Admin" or "User"
            };

            _db.Users.Add(newUser);
            _db.SaveChanges();

            return Ok(new { message = "Registration successful" });
        }
    }

    // Simple DTO for the data coming from React
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