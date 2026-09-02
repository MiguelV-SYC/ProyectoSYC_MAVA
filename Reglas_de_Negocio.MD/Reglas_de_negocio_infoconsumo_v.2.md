**Reglas de negocio para la creación de tornaguías:** 

* Tornaguía de Movilización: ¿Para qué sirve?: Autoriza el transporte de mercancías desde la planta de producción o la aduana de ingreso hasta el departamento donde serán distribuidas y consumidas
¿Cuándo se usa?: Cuando un productor nacional (por ejemplo, una licorera) o un importador despacha un lote de productos hacia un distribuidor autorizado en un departamento específico. El impuesto al consumo se causará en el departamento de destino.
* Tornaguía de reenvío: ¿Para qué sirve?: Autoriza el traslado de mercancías entre departamentos cuando los productos ya habían sido declarados para consumo en el territorio de origen.
¿Cuándo se usa?: Si un distribuidor o gran superficie (ej. un almacén de cadena) tiene sobrestock de licores en un departamento A (donde ya pagó impuesto/estampilla) y necesita trasladar legalmente esa mercancía a una sucursal en el departamento B. Evita la doble tributación mediante mecanismos de compensación entre departamentos
* Tornaguía de Tránsito: ¿Para qué sirve?: Autoriza el transporte de mercancías que solo van a "pasar de paso" por un departamento intermedio, sin que se comercialicen ni se consuman allí.
¿Cuándo se usa?: Cuando la ruta física de transporte obliga al camión a cruzar por departamentos intermedios (ej. un viaje de Bogotá a Bucaramanga que cruza por Boyacá). Evita que las autoridades de carreteras decomisen la carga al constatar que el destino final legítimo es otro.
* Tornaguía de Tránsito Local (o interno): ¿Para qué sirve?: Controla el movimiento de mercancías gravadas exclusivamente dentro de las fronteras de un mismo departamento o distrito.
¿Cuándo se usa?: Cuando un distribuidor traslada mercancías desde su bodega principal a una bodega secundaria o a un gran centro de distribución, siempre y cuando ambos puntos geográficos pertenezcan a la misma entidad territorial.
* Tornaguía de Tránsito Declarado: ¿Para qué sirve?: Registra la movilización de mercancías que ya han sido objeto de una declaración aduanera o tributaria previa en origen, pero cuyo destino definitivo para el consumo final requiere una validación de tránsito estricta bajo control de la plataforma de rentas.
¿Cuándo se usa?: Principalmente para cargamentos de licores o cigarrillos importados que salen de un puerto o zona franca y viajan bajo un régimen de aduanas específico hacia el depósito de destino final.



*Reglas de Negocio Críticas:*
Para la arquitectura y lógica de validación de tu desarrollo, debes asegurar que el sistema aplique las siguientes restricciones automáticas:

* Validación de Origen/Destino: Si el tipo de trámite es Tránsito Local, el sistema debe forzar que el campo Departamento de origen y Departamento de destino sean idénticos. Si es Movilización o Reenvío, deben ser obligatoriamente diferentes.
* Validación de Placas y Transportador: El número de placa ingresado (SLK-204 en tu pantalla) y el NIT de la empresa transportadora deben pasar por una lista de validación activa; un vehículo con una tornaguía activa y no finalizada no debería poder asignarse a otra tornaguía en el mismo rango de horas.
* Ciclo de Vida de la Tornaguía (Estados):

&#x09;Elaborada/Radicada: Registrada por el contribuyente.

&#x09;Aprobada/Expedida: Autorizada por el funcionario de rentas tras verificar pagos/cupos. Genera un código QR 	único nacional.

&#x09;Legalizada: El estado más importante. Cuando la mercancía llega al destino, el funcionario del departamento 	receptor debe confirmar físicamente la carga y "legalizar" la tornaguía en el sistema para cerrar el ciclo 	de control vial.

* Vigencia Temporal Estricta: Las tornaguías se expiden con un tiempo de vigencia limitado en horas o días según la distancia vial entre el origen y el destino. Si el transportador no llega dentro del plazo estipulado, el sistema debe marcar la tornaguía como Vencida, requiriendo un proceso de justificación o reexpedición para evitar el decomiso de la carga por contrabando técnico.
* Cálculo de Unidades Totales: El sistema debe multiplicar automáticamente la Cantidad (ej. 480 cajas) por la presentación unitaria según el catálogo maestro del producto seleccionado para registrar de forma matemática exacta las Unidades totales en mililitros o unidades fiscales de cigarrillos.



*IMPUESTO AL CONSUMO*

La lógica de liquidación del Impuesto al Consumo de Licores, Vinos, Aperitivos y Similares (ICL) en Colombia está regida por la Ley 1816 de 2016 y se actualiza anualmente de acuerdo con la inflación. Para el año en curso (2026), el Ministerio de Hacienda fijó los valores mediante la Certificación 003.

El cálculo del impuesto se realiza de forma obligatoria mediante un sistema bifásico que suma dos componentes: uno Específico (fijo por grado de alcohol) y uno Ad Valorem (porcentual sobre el precio de venta).

A nivel de base de datos y backend en Infoconsumo, la lógica exacta para procesar la información de la tornaguía es la siguiente:

* Variables y Datos de Entrada requeridos.
Para realizar la liquidación de cada ítem de la tornaguía, tu base de datos debe recuperar los siguientes campos mapeados desde la interfaz y el catálogo del producto
\\(V\_{total}\\) (Volumen Total en cc): Extraído directamente de la columna Unidades totales convertida a centímetros cúbicos (ml/cc). En tu pantalla indica un volumen total para las cajas cargadas.
\\(G\\) (Grados Alcoholimétricos): Campo numérico extraído de Grados alcoholimétricos de la sección 3 (ej: 35°).
\\(PVP\\) (Precio de Venta al Público Certificado): Es el precio de referencia oficial determinado anualmente por el DANE para ese producto específico (sin incluir el impuesto al consumo ni el IVA)
\\(Tarifa\_{esp}\\) (Tarifa Base del Componente Específico): Cambia según la categoría de producto:

&#x09;-Licores, aperitivos y similares: $360 COP por grado de alcohol en una botella estándar de 750 cc.
	-Vinos y aperitivos vínicos: $243 COP por grado de alcohol en una botella estándar de 750 cc.\\(\\%\_{ad}\\)  	(Porcentaje Ad Valorem): Fijado por ley sobre el PVP certificado:
		-Licores, aperitivos y similares: 30% (Actualizado al 30% en el régimen vigente de 2026).
		-Vinos y aperitivos vínicos: 20%


* Algoritmo Matemático de Cálculo (Paso a Paso)Paso A: Calcular el Componente EspecíficoEste componente castiga la concentración de alcohol y es proporcional al volumen total movilizado en la tornaguía en relación con la medida estándar de una botella (750 cc).
\\(\\text{Comp.\\ Específico}=G\\times \\text{Tarifa}\_{esp}\\times \\left(\\frac{V\_{total}}{750}\\right)\\)

* Paso B: Calcular el Componente Ad Valorem: Aplica el porcentaje de ley directamente sobre el precio base comercial acumulado de los productos transportados, tomando como referencia el precio certificado DANE
\\(\\text{Comp.\\ Ad\\ Valorem}=\\text{Total\\ Unidades\\ Físicas}\\times PVP\\times \\%\_{ad}\\)
* Paso C: Consolidar el ICL Total:
Se suman ambos componentes para obtener el valor global de la liquidación del impuesto al consumo imputado a esa tornaguía.
\\(\\text{ICL\\ Total}=\\text{Comp.\\ Específico}+\\text{Comp.\\ Ad\\ Valorem}\\)




*Reglas de Excepción en la Lógica para el Backend:*


* Excepción Geográfica (San Andrés): Si en el bloque 4 de tu interfaz, el Departamento de destino es Archipiélago de San Andrés, Providencia y Santa Catalina, la lógica debe ignorar la tarifa estándar de $360/$243 y aplicar la tarifa preferencial reducida de $57 COP por grado de alcohol.
* Excepción por Tipo de Trámite: Si el tipo de trámite seleccionado en la sección 1 es Tránsito, Tránsito Local o Tránsito Declarado, el sistema debe calcular el impuesto de forma meramente informativa, pero el valor neto a pagar de la liquidación en la pasarela de la Gobernación de destino debe ser $0 COP, ya que en estos escenarios el impuesto no se causa en ese momento ni se recauda allí. El cobro real en pasarela solo se gatilla si el trámite es una Movilización o un Reenvío con saldos pendientes



Ejemplo de Lógica Aplicada (Caso Práctico en Código)
Supongamos que en el bloque 3. Producto gravado de tu pantalla, un usuario está declarando una movilización con las siguientes características para un aguardiente (Licor):Grados de alcohol (\\(G\\)): 29°Volumen total (\\(V\_{total}\\)): Supongamos que las 5,760 unidades de la pantalla corresponden a botellas de 750 cc cada una (Volumen acumulado = \\(4.320.000\\text{ cc}\\)).PVP DANE asumido por botella: $30.000 COPEjecución de las reglas de negocio:Componente Específico:\\(29\\times \\$360\\times \\left(\\frac{4.320.000}{750}\\right)=10.440\\times 5.760=\\mathbf{\\$60.134.400}\\text{\\ COP}\\)Componente Ad Valorem:\\(5.760\\text{\\ botellas}\\times \\$30.000\\times 30\\%=\\mathbf{\\$51.840.000}\\text{\\ COP}\\)Impuesto al Consumo Total de la Tornaguía:\\(\\$60.134.400+\\$51.840.000=\\mathbf{\\$111.974.400}\\text{\\ COP}\\)



**Tiempos de generación de la preliquidación impuesto al consumo**


La generación de la liquidación del impuesto y los plazos legales para su pago ordinario se rigen bajo reglas estrictas de la Federación Nacional de Departamentos (FND) y el Decreto 3071 de 1997:


1. Tiempo de generación de la liquidaciónLa liquidación del Impuesto al Consumo de Licores (ICL) se genera de forma inmediata y automática en la plataforma en el mismo instante en que se radica y aprueba la solicitud de la tornaguía.Al guardar el formulario de la tornaguía de movilización o reenvío, el backend realiza el cálculo matemático expuesto en el paso anterior y emite simultáneamente el recibo de pago o la declaración sugerida.
2. Tiempos legales y plazos para el pago ordinarioEl impuesto al consumo maneja un calendario tributario de periodicidad quincenal para los productores e importadores registrados. Los plazos legales para declarar y realizar el pago ordinario ante la Secretaría de Hacienda del departamento de destino son:
- Productos despachados en la primera quincena (Días 1 al 15 del mes): El pago ordinario se debe realizar a más tardar dentro de los cinco (5) días hábiles siguientes al vencimiento de la quincena (aproximadamente el día 20 o 22 del mes corriente).
- Productos despachados en la segunda quincena (Días 16 al último día del mes): El pago ordinario se debe realizar a más tardar dentro de los cinco (5) días hábiles siguientes al vencimiento de la quincena (aproximadamente el día 5 o 7 del mes siguiente).
3. Hitos de tiempo críticos para las reglas de negocio del sistemaPara la lógica de control vial e infoconsumo, debes programar en tu backend las siguientes alertas temporales basadas en la ley colombiana:
- Inicio de movilización: El transportador tiene máximo un (1) día hábil después de expedida la tornaguía para iniciar el viaje en carretera. Si pasa este tiempo sin moverse, el usuario debe tramitar una Anulación en la plataforma.
- Plazo de legalización en destino: Toda tornaguía ordinaria de movilización debe ser físicamente recibida y "legalizada" en el sistema por el funcionario del departamento de destino dentro de los quince (15) días calendario siguientes a su expedición. Si es una tornaguía exclusivamente de Tránsito, el límite es de diez (10) días calendario.
- Sanción por no legalizar: Si la tornaguía no se reporta como legalizada o devuelta en el sistema antes de 45 días, el software debe activar automáticamente un módulo de proceso sancionatorio, donde el contribuyente se expone a pagar una multa equivalente al 100% del impuesto que causaba esa mercancía

Anotación para Impuesto de Cervezas y cigarrillos: 
La razón por la cual tu backend debe arrojar "categoría no soportada" para cervezas y cigarrillos es que, en la legislación colombiana (Ley 223 de 1995 y Ley 1816 de 2016), estos productos se rigen bajo regímenes tributarios completamente diferentes al ICL (Impuesto al Consumo de Licores y Vinos):La Cerveza no es ICL: Tiene un impuesto unificado de tarifa única porcentual (nominalmente del 48% sobre el precio de venta) y su recaudo se distribuye con fórmulas específicas para el deporte y la salud departamental. No se le aplica el componente específico por grado de alcohol del ICL.Los Cigarrillos cambian de métrica: Se liquidan por específico por cajetilla de 20 unidades (o proporcional) más un componente Ad Valorem del 10%. El volumen en centímetros cúbicos (cc) de tu base de datos actual es incompatible con esta estructura de empaque.

* ejemplo de implpementación en backend: 
public decimal CalcularImpuestoConsumo(ProductoGravado producto, int unidadesTotales)
{
    // REGLA DE NEGOCIO: Validar categorías soportadas por el motor ICL
    if (producto.Categoria != "LICOR" && producto.Categoria != "VINO")
    {
        // Enviar una excepción controlada que el front consumirá como "categoría no soportada"
        throw new NotSupportedException($"Categoría '{producto.Categoria}' no soportada en el cálculo actual de ICL.");
    }

    // --- Lógica matemática exclusiva para Licores y Vinos ---
    decimal componenteEspecifico = producto.GradosAlcohol * producto.TarifaBase * (producto.VolumenCc / 750m);
    decimal componenteAdValorem = unidadesTotales * producto.PvpDane * (producto.PorcentajeAdValorem / 100m);

    return componenteEspecifico + componenteAdValorem;
}


FRONT: 
Revisar la siguiente información para la construcción de la logica en el front: 
* Cómo manejarlo en tu Frontend (React + TS)Para que la interfaz de usuario de Infoconsumo refleje esta regla de forma limpia (sin romper la aplicación con un error de consola), debes interceptar el estado del formulario.Si el usuario selecciona una partida arancelaria de cervezas o cigarrillos en la sección 3. Producto gravado, la interfaz debe deshabilitar el botón de cálculo y mostrar una alerta informativa de Tailwind:

import { useState, useEffect } from 'react';

interface Producto {
  id: string;
  nombre: string;
  categoria: 'LICOR' | 'VINO' | 'CERVEZA' | 'CIGARRILLO';
}

export default function SeccionLiquidacion({ producto }: { producto: Producto | null }) {
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    if (!producto) return;

    // Validación en caliente según la regla de negocio
    if (producto.categoria === 'CERVEZA' || producto.categoria === 'CIGARRILLO') {
      setMensajeError('⚠️ Categoría no soportada por el motor de liquidación ICL en esta fase.');
    } else {
      setMensajeError(null);
    }
  }, [producto]);

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 mt-4">
      {mensajeError ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
          {mensajeError}
          <p className="text-xs text-amber-600 mt-1 font-normal">
            Las cervezas y cigarrillos manejan un régimen de liquidación tributaria independiente.
          </p>
        </div>
      ) : (
        <button 
          disabled={!producto}
          className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-slate-300"
        >
          Calcular Liquidación de Impuesto
        </button>
      )}
    </div>
  );
}

*Tipos de Vehículos según su Carrocería (Logística de Bebidas y Tabaco)*
Para estos productos se utilizan principalmente tres configuraciones de carrocería:Furgón Cerrado (Caja Seca): Es el más común para el tabaco y licores de alta gama. Protege la mercancía de la humedad, la luz solar directa y ofrece mayor seguridad contra robos.Camión Botellero / Sider (Cortinas Laterales): Es el diseño estándar utilizado por las grandes cervecerías y distribuidoras de bebidas. Las lonas laterales permiten una carga y descarga rápida con montacargas en estibas (palés).Estacas con Carpa: Utilizado por distribuidores minoristas o en zonas rurales. Exige que la carpa esté completamente sellada y cumpla con los requisitos de seguridad exigidos por las autoridades viales

2. Clasificación por Capacidad y Configuración de Ejes (Norma NTC 4788)De acuerdo con el Ministerio de Transporte de Colombia y la norma NTC 4788, los vehículos de carga se dividen según su peso y número de ejes:Tipo de VehículoDesignación RNDCCapacidad de Carga AproximadaUso Común en Bebidas y TabacoTurboC2 (Liviano)Hasta 4.5 toneladasDistribución urbana de cigarrillos y licores en almacenes de cadena o tiendas.Camión SencilloC2 (Mediano)Hasta 8.5 toneladasDespachos regionales o entregas masivas en centros urbanos.Doble TroqueC3Hasta 17 toneladasTransporte intermunicipal de producto terminado desde plantas de producción.Cuatro ManosC4Hasta 22 toneladasAbastecimiento mayorista y movimiento de carga pesada a nivel nacional.Tractocamión (Mula)C3S2 / C3S3Hasta 32 - 35 toneladasTransporte masivo de materias primas o distribución de cerveza y licores a grandes centros de acopio.










