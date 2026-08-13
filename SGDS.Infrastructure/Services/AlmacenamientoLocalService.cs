using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

public class AlmacenamientoLocalService : IAlmacenamientoService
{
    private readonly string _rutaBase;

    public AlmacenamientoLocalService(string rutaBase)
    {
        _rutaBase = rutaBase;
    }

    public async Task<string> GuardarArchivoAsync(Stream contenido, string nombreArchivo, string carpeta)
    {
        var carpetaCompleta = Path.Combine(_rutaBase, carpeta);
        Directory.CreateDirectory(carpetaCompleta);

        var nombreUnico = $"{Guid.NewGuid()}_{nombreArchivo}";
        var rutaCompleta = Path.Combine(carpetaCompleta, nombreUnico);

        using (var archivoDestino = File.Create(rutaCompleta))
        {
            await contenido.CopyToAsync(archivoDestino);
        }

        return Path.Combine(carpeta, nombreUnico);
    }

    public Task<Stream> ObtenerArchivoAsync(string rutaAlmacenada)
    {
        var rutaCompleta = Path.Combine(_rutaBase, rutaAlmacenada);

        if (!File.Exists(rutaCompleta))
        {
            throw new FileNotFoundException("El archivo no existe", rutaCompleta);
        }

        Stream stream = File.OpenRead(rutaCompleta);
        return Task.FromResult(stream);
    }

    public Task EliminarArchivoAsync(string rutaAlmacenada)
    {
        var rutaCompleta = Path.Combine(_rutaBase, rutaAlmacenada);

        if (File.Exists(rutaCompleta))
        {
            File.Delete(rutaCompleta);
        }

        return Task.CompletedTask;
    }
}