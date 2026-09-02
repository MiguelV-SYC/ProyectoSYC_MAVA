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


**REGLAS PARA LA APLICACIÓN DEL IMPUESTO AL CONSUMO POR CATEGORÍAS**

**Tabla Maestra de Reglas**

| Categoría           | Subtipo                      | Unidad           |                 Específico 2026 |             	 Ad valorem | Base principal                  |
| ------------------- | ---------------------------- | ---------------- | ------------------------------: | ------------------------------: | ------------------------------- |
| Licores             | Destilados                   | Grado / 750 cc   |                            $360 |                            25 % | PVP DANE                        |
| Licores             | Importados                   | Grado / 750 cc   |                            $360 |                            25 % | Base aplicable                  |
| Vinos               | Nacional/importado           | Grado / 750 cc   |                            $243 |                            20 % | PVP DANE                        |
| Aperitivos          | Similares                    | Grado / 750 cc   |                            $360 |                            25 % | PVP DANE                        |
| Aperitivos vínicos  | —                            | Grado / 750 cc   |                            $243 |                            20 % | PVP DANE                        |
| Cervezas            | Nacionales                   | Precio           |                               — |                            48 % | Venta detallista                |
| Cervezas            | Importadas                   | Precio           |                               — |                            48 % | Base de importación             |
| Sifones             | Nacional/importado           | Precio           |                               — |                            48 % | Venta detallista/base aplicable |
| Refajos             | Nacional/importado           | Precio           |                               — |                            20 % | Venta detallista/base aplicable |
| Mezclas             | Fermentadas + no alcohólicas | Precio           |                               — |                            20 % | Venta detallista/base aplicable |
| Cerveza artesanal   | —                            | Precio           |                               — |                            48 % | Según régimen de cerveza        |
| Cigarrillos         | Nacional/importado           | Cajetilla/20     |                  Parámetro 2026 |                            10 % | PVP/base certificada            |
| Puros/cigarros      | Tabaco elaborado             | Unidad/contenido |                  Parámetro 2026 |                            10 % | Base aplicable                  |
| Picadura/sucedáneos | Por peso                     | Gramo            |                          $354/g |                            10 % | Base aplicable                  |
| Vapeo               | SEAN/SSSN                    | ml/unidad        | **No parametrizar actualmente** | **No parametrizar actualmente** | Verificación normativa          |




2. Clasificación General


| Categoría                                  | Subcategorías                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Licores, vinos, aperitivos y similares** | Licores destilados nacionales, licores destilados importados, vinos nacionales/importados, aperitivos y similares, aperitivos vínicos |
| **Cervezas, sifones, refajos y mezclas**   | Cervezas nacionales, cervezas importadas, sifones, refajos, mezclas de bebidas fermentadas y cervezas artesanales                     |
| **Cigarrillos y tabaco elaborado**         | Cigarrillos nacionales/importados, tabaco elaborado —puros/cigarros—, tabaco de picadura y sucedáneos, sistemas electrónicos de vapeo |


3. Flujo General de Liquidación 

Producto
   ↓
Categoría
   ↓
Subtipo
   ↓
Origen
   ↓
Presentación / unidad de medida
   ↓
¿La categoría utiliza componente específico?
   ├── Sí → calcular componente específico
   └── No → continuar
   ↓
¿La categoría utiliza componente ad valorem?
   ├── Sí → calcular componente ad valorem
   └── No → continuar
   ↓
Aplicar reglas de base gravable
   ↓
Aplicar tarifa vigente
   ↓
Calcular impuesto por unidad
   ↓
Multiplicar por cantidad
   ↓
Guardar liquidación y trazabilidad




4. Licores, vinos, aperitivos y similares
La base normativa principal es el artículo 50 de la Ley 788 de 2002, modificado por el artículo 20 de la Ley 1816 de 2016.
La Ley 1816 establece el esquema por grado alcoholimétrico y unidad equivalente de 750 cc.

4.1 Tarifas 2026

Para 2026, la Certificación 003 del Ministerio de Hacienda, de 9 de diciembre de 2025, estableció:

| Producto                                       |                  Componente específico 2026 |
| ---------------------------------------------- | ------------------------------------------: |
| Licores, aperitivos y similares                | **$360 por grado alcoholimétrico / 750 cc** |
| Vinos y aperitivos vínicos                     | **$243 por grado alcoholimétrico / 750 cc** |
| Productos nacionales que ingresen a San Andrés |                  **$57 por grado / 750 cc** |

Estas tarifas rigen desde el 1 de enero de 2026.

El componente ad valorem establecido por la Ley 1816 es:

| Producto                        | Ad valorem |
| ------------------------------- | ---------: |
| Licores, aperitivos y similares |   **25 %** |
| Vinos y aperitivos vínicos      |   **20 %** |

La tarifa se aplica sobre el precio de venta al público antes de impuestos y/o participación, certificado por el DANE.

4.2 Licores destilados nacionales

Datos necesarios:

Grado alcoholimétrico
Contenido en cc
Precio de venta al público certificado
Cantidad

Componente específico
ComponenteEspecifico =
    GradosAlcohol × 360 × (ContenidoCC / 750)

Componente ad valorem
ComponenteAdValorem =
    BaseAdValorem × 25%

Impuesto por unidad
ImpuestoUnidad =
    ComponenteEspecifico +
    ComponenteAdValorem

Impuesto total
ImpuestoTotal =
    ImpuestoUnidad × Cantidad

4.3 Licores destilados importados

La estructura tributaria mantiene el componente específico y el ad valorem, pero el sistema debe registrar correctamente el origen importado y la información correspondiente a la base utilizada para la liquidación.

Por tanto:

Origen = Importado
Categoría = Licores
TarifaEspecífica = 360
TarifaAdValorem = 25%
UnidadEspecífica = Grado / 750 cc

El motor de cálculo no debe asumir que "importado" significa automáticamente una tarifa diferente. La diferencia puede estar en la determinación de la base, información del producto y reglas de liquidación, no necesariamente en el porcentaje nominal.


4.4 Vinos nacionales e importados

Los vinos utilizan una tarifa específica diferente a la de los licores.

2026
$243 × grado alcoholimétrico × equivalente de 750 cc

Por ejemplo, conceptualmente:
ComponenteEspecifico =
    GradosAlcohol × 243 × (ContenidoCC / 750)

El componente ad valorem corresponde al 20% sobre la base DANE aplicable. Por tanto:
ImpuestoUnidad =
    ComponenteEspecifico +
    ComponenteAdValorem

4.5 Aperitivos y similares

Los aperitivos y similares se manejan dentro del mismo régimen de licores, salvo aquellos que correspondan específicamente a aperitivos vínicos.

Aperitivo / similar
TarifaEspecifica = $360
AdValorem = 25%
Aperitivo vínico
TarifaEspecifica = $243
AdValorem = 20%

Por eso no basta con seleccionar "Aperitivo". El sistema debe distinguir:

Aperitivo
Aperitivo vínico

Porque la tarifa específica y el porcentaje ad valorem son diferentes.


5. Cervezas, sifones, refajos y mezclas

Este grupo utiliza una lógica diferente a la de los licores.
La norma principal es la Ley 223 de 1995, especialmente sus artículos 189 y 190. La base gravable está relacionada con el precio de venta al detallista.

5.1 Tarifas

| Producto                                                  |   Tarifa |
| --------------------------------------------------------- | -------: |
| Cervezas                                                  | **48 %** |
| Sifones                                                   | **48 %** |
| Refajos                                                   | **20 %** |
| Mezclas de bebidas fermentadas con bebidas no alcohólicas | **20 %** |

**NOTA: Aquí no se utiliza la fórmula por grados de alcohol × $360/$243.**

5.2 Cervezas nacionales

Para producto nacional, el precio de venta al detallista constituye el elemento fundamental para determinar la base.
El Decreto 2141 de 1996 precisa que el precio de venta al detallista, sin incluir el impuesto al consumo, es el precio fijado por el productor y debe considerar el precio de fábrica y el margen de comercialización.

Para el sistema:
BaseGravable = PrecioVentaDetallista
y:
ImpuestoUnidad =
    BaseGravable × 48%

5.3 Cervezas importadas

Para productos extranjeros, la base se determina a partir de:

ValorAduana + GravámenesArancelarios + 30% margen de comercialización

La Ley 223 contempla además un impuesto mínimo para productos extranjeros frente al promedio correspondiente de productos nacionales.
Por tanto, conceptualmente:
BaseImportado =
    ValorAduana +
    GravámenesArancelarios +
    (BaseComercial × 30%)

y:

ImpuestoCalculado =
    BaseImportado × 48%

Posteriormente debe verificarse la regla de impuesto mínimo aplicable. Esto es importante para SGDS: no conviene implementar simplemente:
impuesto = valorAduana * 0.48; porque se perdería la estructura de determinación de la base.


5.4 Sifones

Los sifones pertenecen al mismo bloque tarifario de las cervezas:
Tarifa = 48%
Por tanto:
ImpuestoUnidad =
    BaseGravable × 48%

La información de presentación, contenido, origen y precio debe quedar registrada para soportar la liquidación.


5.5 Refajos

Los refajos tienen una tarifa de 20% sobre la base gravable correspondiente.
ImpuestoUnidad =
    BaseGravable × 20%


5.6 Mezclas de bebidas fermentadas

Las mezclas de bebidas fermentadas con bebidas no alcohólicas también utilizan:
Tarifa = 20%
Por tanto:
ImpuestoUnidad =
    BaseGravable × 20%

La Ley 223 distingue expresamente este grupo de las cervezas y sifones.

5.7 Cervezas artesanales

El que se denomine "Artesanal" no debe convertirse en una tarifa independiente dentro del motor tributario.
Si el producto jurídicamente corresponde a una cerveza, el sistema debe clasificarlo como:

Categoría = Cervezas
Subtipo = Cerveza artesanal
Tarifa = 48%

La característica "artesanal" puede conservarse como atributo comercial o de clasificación, pero no debe generar automáticamente una nueva fórmula tributaria.


6. Cigarrillos y Tabaco Elaborado

Este grupo utiliza también una combinación de:

Componente específico.
Componente ad valorem.

La estructura está soportada por la Ley 223 de 1995, modificada, entre otras, por la Ley 1393 de 2010 y la Ley 1819 de 2016. El componente ad valorem corresponde al 10 % sobre la base gravable definida legalmente.



6.1 Cigarrillos Nacionales e Importados

Para 2026 debe utilizarse la tarifa ordinaria vigente y no los valores temporales introducidos por el Decreto Legislativo 1474 de 2025.
El punto es importante porque ese decreto posteriormente fue declarado inexequible por consecuencia por la Corte Constitucional mediante la Sentencia C-079 de 2026.
Por tanto, no deben implementarse en SGDS los valores de $11.200 y $891 que aparecían en el Decreto 1474 como si fueran la tarifa ordinaria vigente.
El componente ad valorem continúa siendo: 10% sobre la base correspondiente.


6.2 Tabaco elaborado — puros y cigarros

Los puros y cigarros se encuentran dentro del grupo de productos de tabaco elaborado.
El sistema debe identificar:

Categoría = Cigarrillos y tabaco elaborado
Subtipo = Tabaco elaborado
Presentación
Cantidad
Base gravable
Tarifa específica vigente
Ad valorem = 10%

La tarifa específica debe almacenarse como parámetro vigente y no como una constante dentro del Controller.

6.3 Tabaco de picadura y sucedáneos

Para productos medidos por peso, la unidad de liquidación es diferente.
La estructura debe ser:

Gramos × TarifaPorGramo + el componente ad valorem cuando corresponda.

Para 2026, la tarifa específica ordinaria certificada corresponde a: $354 por gramo, y el componente ad valorem es del 10%.
La estructura legal distingue expresamente la picadura, rapé y chimú de los productos vendidos por cajetilla.


6.4 Sistemas Electrónicos de Vapeo

Este punto debe quedar separado del cálculo ordinario de cigarrillos y tabaco elaborado.
El Decreto 1474 de 2025 introdujo reglas específicas para derivados y sistemas electrónicos, pero ese decreto fue posteriormente declarado inexequible por consecuencia mediante la Sentencia C-079 de 2026.
Por ello:
Subtipo = Sistema electrónico de vapeo
Estado = Sujeto a verificación normativa

No debe asignarse automáticamente una tarifa de $2.000/ml + 30 % en el motor actual de InfoConsumo.
La implementación debe permitir incorporar posteriormente una tarifa válida mediante parametrización cuando exista fundamento normativo vigente.


MARCO NORMATIVO DE REFERENCIA: 

Para la implementación 2026, las referencias principales son:

Ley 1816 de 2016 — régimen del impuesto al consumo de licores, vinos, aperitivos y similares.
Ley 788 de 2002, artículo 50, en la forma modificada por la Ley 1816 de 2016.
Ley 223 de 1995 — impuesto al consumo de cervezas, sifones, refajos, mezclas y tabaco.
Ley 1393 de 2010 — modificaciones y componente ad valorem para cigarrillos y tabaco.
Ley 1819 de 2016 — modificación del componente ad valorem del impuesto al consumo de cigarrillos y tabaco.
Certificación 003 de 2025 del Ministerio de Hacienda — tarifas específicas 2026 para licores, vinos, aperitivos y similares.
Resolución DANE 1900 de 2025 — certificación de precios de venta al público para cigarrillos y tabaco durante 2026.
Decreto 2141 de 1996 — reglas reglamentarias sobre bases gravables y declaración.
Sentencia C-079 de 2026 — inexequibilidad por consecuencia del Decreto Legislativo 1474 de 2025.









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

**Tipos de Vehículos según su Carrocería (Logística de Bebidas y Tabaco)**
Para estos productos se utilizan principalmente tres configuraciones de carrocería:
* Furgón Cerrado (Caja Seca): Es el más común para el tabaco y licores de alta gama. Protege la mercancía de la humedad, la luz solar directa y ofrece mayor seguridad contra robos.
* Camión Botellero / Sider (Cortinas Laterales): Es el diseño estándar utilizado por las grandes cervecerías y distribuidoras de bebidas. Las lonas laterales permiten una carga y descarga rápida con montacargas en estibas (palés).
* Estacas con Carpa: Utilizado por distribuidores minoristas o en zonas rurales. Exige que la carpa esté completamente sellada y cumpla con los requisitos de seguridad exigidos por las autoridades viales

2. Clasificación por Capacidad y Configuración de Ejes (Norma NTC 4788)De acuerdo con el Ministerio de Transporte de Colombia y la norma NTC 4788, los vehículos de carga se dividen según su peso y número de ejes:
Tipo de Vehículo||Designación RNDC|Capacidad de Carga |Aproximada|Uso Común en Bebidas y Tabaco
* TurboC2 (Liviano)Hasta 4.5 toneladasDistribución urbana de cigarrillos y licores en almacenes de cadena o tiendas.
* Camión SencilloC2 (Mediano)Hasta 8.5 toneladasDespachos regionales o entregas masivas en centros urbanos.
* Doble TroqueC3Hasta 17 toneladasTransporte intermunicipal de producto terminado desde plantas de producción.
* Cuatro ManosC4Hasta 22 toneladasAbastecimiento mayorista y movimiento de carga pesada a nivel nacional.
* Tractocamión (Mula)C3S2 / C3S3Hasta 32 - 35 toneladasTransporte masivo de materias primas o distribución de cerveza y licores a grandes centros de acopio.










