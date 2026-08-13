namespace SGDS.Application.Helpers;

public static class CalculadoraDv
{
    private static readonly int[] Pesos = { 3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71 };
    public static string Calcular(string nit)
    {
        var nitLimpio = new string(nit.Where(char.IsDigit).ToArray());
        
        if (string.IsNullOrEmpty(nitLimpio))
            return string.Empty;

        var digitos = nitLimpio.Reverse().ToArray();
        var suma = 0;

        for (var i = 0; i < digitos.Length && i < Pesos.Length; i++)
        {
            var digito = int.Parse(digitos[i].ToString());
            suma += digito * Pesos[i];
        }

        var residuo = suma % 11;
        var dv = residuo > 1 ? 11 - residuo : residuo; 

        return dv.ToString();
    }
}