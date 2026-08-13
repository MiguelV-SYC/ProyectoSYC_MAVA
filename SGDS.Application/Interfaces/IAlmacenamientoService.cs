namespace SGDS.Application.Interfaces;

public interface IAlmacenamientoService
{
    Task<string> GuardarArchivoAsync(Stream contenido, string nombreArchivo, string carpeta);
    Task<Stream> ObtenerArchivoAsync(string rutaAlmacenada);
    Task EliminarArchivoAsync(string rutaAlmacenada);
}