using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]  //le dice a asp.net core que esta clase maneja peticiones http con validaciones automáticas
[Route("api/[controller]")] // define la url base. el controller se reemplaza automáticamente  por el nombre de la clase sin controller, en este caso "Usuarios"
public class UsuariosController : ControllerBase
{
    private readonly SgdsDbContext _context; // inyecta el contexto de la base de datos para poder acceder a los datos de la tabla Usuarios

    public UsuariosController(SgdsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsuarios()
    {
        var usuarios = await _context.Usuarios.ToListAsync(); // acá se dispara la consulta sql contra postgres y se traen todos los registros de la tabla Usuarios
        return Ok(usuarios);
    }
}