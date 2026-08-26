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
        var carpetaCompleta = ResolverRutaSegura(carpeta);
        Directory.CreateDirectory(carpetaCompleta);

        // El nombre físico en disco es siempre un GUID — el nombre original que envía el
        // cliente nunca participa en la ruta física (solo se guarda como metadato en
        // Documento.NombreArchivo), para que un nombre de archivo con "../" no pueda escapar
        // de _rutaBase.
        var nombreUnico = $"{Guid.NewGuid()}{Path.GetExtension(nombreArchivo)}";
        var rutaCompleta = Path.Combine(carpetaCompleta, nombreUnico);

        using (var archivoDestino = File.Create(rutaCompleta))
        {
            await contenido.CopyToAsync(archivoDestino);
        }

        return Path.Combine(carpeta, nombreUnico);
    }

    public Task<Stream> ObtenerArchivoAsync(string rutaAlmacenada)
    {
        var rutaCompleta = ResolverRutaSegura(rutaAlmacenada);

        if (!File.Exists(rutaCompleta))
        {
            throw new FileNotFoundException("El archivo no existe", rutaCompleta);
        }

        Stream stream = File.OpenRead(rutaCompleta);
        return Task.FromResult(stream);
    }

    public Task EliminarArchivoAsync(string rutaAlmacenada)
    {
        var rutaCompleta = ResolverRutaSegura(rutaAlmacenada);

        if (File.Exists(rutaCompleta))
        {
            File.Delete(rutaCompleta);
        }

        return Task.CompletedTask;
    }

    // Resuelve la ruta relativa contra _rutaBase y rechaza cualquier resultado que termine
    // fuera de esa carpeta (traversal vía "../" o similar) — misma protección para guardar,
    // leer y eliminar.
    private string ResolverRutaSegura(string rutaRelativa)
    {
        var rutaBaseCompleta = Path.GetFullPath(_rutaBase);
        var prefijoBase = rutaBaseCompleta.EndsWith(Path.DirectorySeparatorChar)
            ? rutaBaseCompleta
            : rutaBaseCompleta + Path.DirectorySeparatorChar;
        var rutaResuelta = Path.GetFullPath(Path.Combine(rutaBaseCompleta, rutaRelativa));

        var esSegura = rutaResuelta.StartsWith(prefijoBase, StringComparison.OrdinalIgnoreCase)
            || string.Equals(rutaResuelta, rutaBaseCompleta, StringComparison.OrdinalIgnoreCase);

        if (!esSegura)
        {
            throw new UnauthorizedAccessException("Ruta de archivo inválida.");
        }

        return rutaResuelta;
    }
}