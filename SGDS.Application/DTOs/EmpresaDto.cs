public class EmpresaResponseDto
{
  public int Id { get; set; }
  public string Nit { get; set; } = string.Empty;
  public string RazonSocial { get; set; } = string.Empty;

}
public class CrearEmpresaDto
{
  public string Nit { get; set; } = string.Empty;
  public string RazonSocial { get; set; } = string.Empty;
}