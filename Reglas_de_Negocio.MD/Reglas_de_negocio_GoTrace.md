**LOGICA GOTRACE:**



**Gotrace: es un servicio real de SYC para trazabilidad logística de licores y cervezas desde fábrica hasta el consumidor, con clientes como Diageo, ILV y ABInBev — es decir, no es gubernamental como SYCTrace, es una herramienta B2B para que las propias empresas productoras rastreen sus lotes.** 



* **Flujo operativo de infoconsumo + syctrace**

**Flujo operativo paso a paso**



INFOCONSUMO

1\. Nueva solicitud → tipo de trámite → Producto gravado + Movilización → Radicar

&#x20;  Estado: Elaborada

2\. Detalle → "Tornaguía" → "Expedir tornaguía"

&#x20;  Estado: Expedida (genera QR + vigencia de legalización)

3\. En la misma vista → "Confirmar pago" (del impuesto al consumo)

&#x20;  PagoConfirmado = true   ← esto es lo que habilita el paso a SYCTrace

&#x20;  (Legalizar tornaguía sigue siendo un eje aparte: confirma llegada física, no pago)



&#x20;       │

&#x20;       ▼  la tornaguía queda visible en el buscador de SYCTrace



SYCTRACE

4\. Nueva solicitud → paso 1 fijo ("Expedición de estampilla")

5\. Paso 2: busca y elige la tornaguía de Infoconsumo con pago confirmado

&#x20;  → hereda automáticamente empresa, categoría, grado, contenido neto

6\. Paso 3-5: completa lo que Infoconsumo no captura (INVIMA, marca, lote,

&#x20;  origen nacional/importado, rango de códigos) → "Autorizar expedición"

&#x20;  Estado: Generada

7\. Detalle → "Estampilla" → "Confirmar pago" (el de SYCTrace, costo de

&#x20;  impresión — distinto al de Infoconsumo) → Estado: Pagada

&#x20;  → "Marcar entregada" → Estado: Entregada  /  o "Anular"

8\. "Visualizar estampilla" → arte con barcode real + QR real → Descargar PDF



**CONTEXTO ADICIONAL:** 
A diferencia de SycTrace (que responde al control fiscal de la Gobernación de Santander y frena trámites si no hay un pago tributario), GoTrace es un sistema puramente logístico y de protección de marca para gigantes como Diageo, ILV (Industria de Licores del Valle) o ABInBev. Su objetivo es evitar el contrabando técnico (adulteración, desvío de mercancía a departamentos donde no pagaron impuestos, o mercado negro).Aquí tienes la lógica de negocio y las integraciones que debes estructurar para GoTrace:



1\. El Rol de GoTrace en el ecosistema



* GoTrace no espera a que el gobierno actúe; GoTrace se anticipa desde la línea de producción (Fábrica/Emboteallado).
* Mientras que SycTrace rastrea "Estampillas Oficiales", GoTrace rastrea "Códigos de Identificación Única (UID)" (impresos directamente en el vidrio, la etiqueta comercial o la tapa mediante láser o inyección de tinta en la fábrica).





2\. Flujo Operativo e Integración (GoTrace + Infoconsumo + SycTrace)

* Para que el sistema sea útil para las empresas (B2B), GoTrace debe alimentar a Infoconsumo y luego validar contra SycTrace. 
* El flujo lógico funciona así:

\[1. Línea de Fábrica / GoTrace] ──(Hereda Lotes y UIDs)──> \[2. Infoconsumo]

&#x20;                                                               │

&#x20;                                                        (Genera Tornaguía)

&#x20;                                                               │

\[3. SycTrace] <──(Cruza QR Oficial vs UID Comercial) <──────────┘



Paso 1: Captura en Origen (GoTrace - B2B)En la fábrica de ABInBev o Diageo, el sistema GoTrace registra el nacimiento del producto:

* Genera un ID de lote (ej: LOT-AGUARD-0092).
* Asocia un rango de códigos comerciales individuales (UIDs del producto).
* Define el destino logístico inicial (ej: Distribuidor Autorizado en Santander).



Paso 2: Inyección de datos a Infoconsumo (La conexión)

Cuando el despachador de la fábrica entra a Infoconsumo a radicar la "Nueva solicitud" (Paso 1 de tu flujo anterior), no debería digitar todo a mano.

* Lógica de integración: Infoconsumo debe consumir una API de GoTrace enviando el ID del lote.
* Resultado: Infoconsumo hereda instantáneamente: Categoría, marca, grado alcoholimétrico, contenido neto y, lo más importante, el rango de UIDs de botellas que van en ese camión.
* Se expide la Tornaguía en Infoconsumo (Paso 2 y 3 tuyos).



Paso 3: El Cruce de Datos en SycTrace

Cuando llegas al paso de SycTrace (Paso 5 y 6 de tu flujo anterior), donde el funcionario completa los datos de INVIMA, marca y lote:

* Lógica de control: El sistema de SycTrace hace un match de seguridad: Tornaguía Infoconsumo + Lote verificado por GoTrace.
* Esto garantiza que las 1,000 estampillas(o N estampillas) físicas que emite la Gobernación corresponden exactamente a las 1,000 botellas con tecnología láser que GoTrace registró en la fábrica.





3\. Reglas de Negocio Específicas de GoTrace (Backend \& Trazabilidad)



**RN-GT01: Trazabilidad de "Caja Madre" (Agregación Logística)**

En logística masiva (como cervezas de ABInBev), es imposible escanear botella por botella en el camión. GoTrace debe implementar la lógica de agregación:

* Jerarquía: Código de Botella ➔ Código de Pack (Sixpack) ➔ Código de Caja (Master Case) ➔ Código de Pallet.
* Regla: Al escanear el QR del Pallet o de la Caja en el módulo de despacho, el sistema automáticamente debe dar por movilizadas/asociadas todas las botellas contenidas en su interior dentro de la Tornaguía de Infoconsumo.



**RN-GT02: Alerta de Desvío de Mercancía (Geofencing Fiscal)**

Cada departamento en Colombia tiene un impuesto al consumo diferente. Si Diageo produce un Whiskey destinado a Bogotá (registrado en GoTrace), pero este termina siendo escaneado por un inspector o consumidor en Santander:

* Regla: El backend de GoTrace debe disparar una Alerta de Desvío. El sistema cruza la geolocalización del escaneo actual versus el departamento de destino registrado originalmente en la Tornaguía de Infoconsumo.



**RN-GT03: Estado de Producto en el Mercado (Ciclo de Vida B2B)**

A diferencia del flujo de la estampilla de SycTrace, el UID de GoTrace vive más tiempo y pasa por los siguientes estados lógicos:

* En Producción: Fabricado y marcado por láser.
* En Tránsito: Vinculado a una Tornaguía Expedida en Infoconsumo.
* Recibido en Distribuidor: Confirmado mediante la Legalización de la tornaguía.
* Vendido / Consumido: Activado cuando el consumidor final escanea el QR en el bar o restaurante para verificar autenticidad.
* Alerta de Duplicidad: Si un mismo UID es escaneado en dos ubicaciones geográficas distintas en un periodo de tiempo imposible (ej: Bucaramanga y Cali con 10 minutos de diferencia), el sistema marca el producto como Potencialmente Adulterado/Contrabando.

_________________________________________________________________

GOTRACE

FORMULACIO DE:
**Nueva Empresa**

Identificación de la empresa
* nit
* razón social
* tipo de empresa
[][Alcohol] - [][Cigarrillo]
* estado
* logo (campo opcional) (se debe colocar el acceso para cargar archivo)

Información de contacto y ubicación 
* representante legal
* teléfono 
* email
* ciudad/municipio
* departamento
* dirección 

Productos que comercializa y/o produce              

1. Si es alcohol, se habilita esta sección
Nombre | [tipo ↓] | [subtipo ↓]| presentación | contenido | und de medida | grado de alcohol |relación|

producto 1 | (especificar el tipo de bebida) | (lata, botella, tetrapack)  | 1, 100,170,300 etc.. | (correspondiente a ml, l, etc)  | 35° |selección de produce o comercializa| [editar(símbolo de lapiz)] [eliminar(símbolo de papelera)]

[+ Agregar Producto]


2. Si es Cigarillo, se habilita esta sección

Nombre|[tipo ↓]|[subtipo ↓]|presentación|contenido|und de medida |origen↓(nacional o importado)|relación(productora-comercializadora-productora y comercializadora)|





**NOTA**
* tipos de bebida: 
1. Licores, Vinos, Aperitivos y Similares
- subtipos: 
	* Licores Destilados Nacionales
	* Licores Destilados Importados
	* Vinos (Nacionales e Importados)
	* Aperitivos y Similares
	* Aperitivos Vínicos

2. Cervezas, Sifones, Refajos y Mezclas
- subtipos: 
	* Cervezas Nacionales
	* Cervezas Importadas
	* Sifones
	* Refajos
	* Mezclas de Bebidas Fermentadas
	* Cervezas Artesanales

3. Cigarrillos y Tabaco Elaborado
- subtipos: 
	* Cigarrillos Nacionales
	* Cigarrillos Importados
	* Cigarrillos y Tabacos (puros)
	* Picadura y Tabaco para Pipa


_________________________________________________________________________________________________________________



FORMULARIO DE: 
**NUEVA SOLICITUD**

Registro de Trazabilidad del lote

(se deja la selección tal cual está )

2. Empresa 

[persona natural] [Empresa]

buscar por razón social o NIT
[...buscador...]
No aparece en el sistema - + crear nueva empresa

(una vez seleccionada la empresa, se debe mostrar la siguiente estructura) 
[Razón social de la empresa]
[NIT]
[Productos agregados : #]

3. Datos de Producto

[Producto ↓]							[Número de Lote]
(cargar lista de productos de la empresa)			(una vez seleccionado el producto, aplicar la
(una vez seleccionado el producto, mostar			siguiente lógica para creación automática
su información como; nombre + presentación + 			del consecutivo)
und de medida + produce/comercializa)				[GT + Producto + fecha + consecutivo]


[Fecha de producción]						[Unidades Producidas]
(tal como está actualmente)					(cantidad)


4. Identificación de Unidades
Generación de UIDs

[(x)Generar automáticamente]
[(x)Cargar archivo de UIDs]
(al seleccionar, deben mostrar el aviso de: se generarán # identificadores únicos, correspondientes al
número de unidades producidas en el lote) 

Rango
[desde (GT + Producto + fecha + consecutivo) → hasta (GT + Producto + fecha + consecutivo)]


5. Etapas de Trazabilidad

[][Fábrica]
[][Bodega]
[][Distribuidor]
[][Punto de venta]

							[Cancelar] [Registrar Solicitud →]
























