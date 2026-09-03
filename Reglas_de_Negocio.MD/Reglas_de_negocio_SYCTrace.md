**REGLAS DE NEGOCIO PARA SYCTRACE**



Las reglas de negocio para la generación, liquidación y control de estampillas (señalización) deben estructurarse bajo los lineamientos del Estatuto Tributario Departamental (Ordenanza 077 de 2014 y modificaciones vigentes), la Federación Nacional de Departamentos (FND) y los estándares técnicos de plataformas de trazabilidad como SycTrace.



1. Menú Dinámico y Matriz de Clasificación de Productos



El sistema debe segmentar los productos en un menú jerárquico obligatoriamente entrelazado con la Codificación Única de Licores (FND-DANE) para cruzar datos con el Invima.



Categorías del Menú (Tipo de Producto)

* Licores Destilados: Ron, Whiskey, Aguardiente, Vodka, Ginebra, Tequila, Brandy/Coñac, Aperitivos y similares.
* Vinos y Fermentados: Vino Blanco, Vino Tinto, Vino Rosado, Vino Espumoso, Champagne, Vermut, Jerez, Hidromiel.
* Tabaco y Cigarrillos: Cigarrillos, Tabaco elaborado, Tabaco picado o de mascar.
* Cervezas, Sifones y Refajos: Clasificación independiente (no sujeta a estampilla de señalización física tradicional en algunos escenarios de libre comercio, pero sí a declaración de impuesto al consumo remota).



Origen del Producto

* Nacional: Producido en Colombia. Requiere registro de la planta productora o convenio directo con la Gobernación (ej. Empresa Santandereana de Licores).
* Importado: Introducido desde el exterior. Exige documento de desaduanamiento (Declaración de Importación) y registro del importador autorizado.



2\. Reglas de Negocio Esenciales (Lógica del Sistema)



RN-01: Parámetros Técnicos Obligatorios por Tipo de Producto



El formulario de generación de la estampilla no puede completarse si faltan estos atributos críticos de trazabilidad:

* Licores/Vinos: Debe exigir estrictamente el Grado Alcoholimétrico (porcentaje de alcohol) y el Contenido Neto (capacidad de la botella en cc o ml: ej. 375 ml, 750 ml, 1000 ml).
* Cigarrillos/Tabaco: Debe exigir la cantidad de unidades por cajetilla (ej. x10, x20) o el peso en gramos para tabaco elaborado.



RN-02: Base de Liquidación de Impuesto y Estampillas Adicionales

El costo total para emitir las estampillas físicas o electrónicas depende del cálculo del Impuesto al Consumo:

* Licores y Vinos: Se calcula un componente específico por cada grado de alcohol en una botella de 750 cc (tarifas indexadas anualmente por el Gobierno Nacional) más un componente Ad Valorem sobre el precio de venta.
* Cigarrillos: Aplica una tarifa específica por cada 20 unidades más un Ad Valorem del 10% sobre el precio de venta al público.
* Estampillas Departamentales Vinculadas: Al generar la liquidación en Santander, el sistema debe anexar automáticamente los gravámenes departamentales obligatorios según el Estatuto Tributario local (ej. Estampilla Pro-Hospitales Universitarios o Pro-Electrificación calculadas sobre salarios mínimos diarios SMLDV o avalúos específicos).



RN-03: Validación de Documentos de Soporte (Tornaguías e Importaciones)

* Si el origen es Nacional, el sistema debe exigir y validar el número de Tornaguía de Movilización expedida por el departamento de origen o la fábrica autorizada.
* Si el origen es Importado, el sistema debe bloquear la emisión de estampillas hasta que se digite el número de la Declaración de Importación y el registro de introducción al departamento de Santander.





RN-04: Estado y Trazabilidad de la Estampilla (Ciclo de Vida)



Cada estampilla física emitida debe registrarse individualmente en la base de datos con un identificador único (conectable con la app de consulta ciudadana SycTrace) bajo los siguientes estados:

* Generada / Liquidada: Creada en el sistema a la espera de pago.
* Pagada / Autorizada: Pago confirmado en bancos o PSE. Habilita la entrega física en la Secretaría de Hacienda de Santander.
* Entregada / Aplicada: Vinculada formalmente al lote del producto en los depósitos autorizados.
* Anulada / Destruida: En caso de errores de impresión o averías físicas en la bodega.





RN-05: Restricción de Seguridad por Distribución Territorial



El sistema debe estampar o registrar digitalmente la leyenda obligatoria "Para distribuir en el Departamento de Santander" tanto en los metadatos del código QR de la estampilla como en la información del lote. Queda prohibida la generación de estampillas de Santander para productos cuyo destino final (Tornaguía de reenvío) sea otro departamento.





3\. Componentes visuales obligatorios en la Estampilla física/QR

Para que el diseño del software sea compatible con el sistema anticontrabando de la Secretaría de Hacienda, cada registro de estampilla debe empaquetar los siguientes datos para la generación del código de barras o código QR:

* Código QR / Barras único y encriptado.
* Registro Sanitario INVIMA vigente.
* Nombre comercial exacto del producto y marca.
* Grado alcoholimétrico y contenido neto (para licores).
* Fecha exacta de la solicitud y lote de producción.





**LOGICA PARA CREACIÓN DE CODIGO AUTOMÁTICO DEL REGISTRO SANITARIO INVIMA**
1. Lógica: 


RSI + [Año de expedición] + [letra inicial del mes de expedición] + - [letra de categoría del prodcuto] - [número consecutivo de 6 dígitos]
RSI 2026S-L-012345


**LOGICA PARA CREACIÓN DE CODIGO AUTOMÁTICO DE ESTAMPILLA**


[Prefijo Departamento] + [Año actual] + [Tipo Licor(N-nacional o I-importado)] + [Número Secuencial Correlativo (8 digitos rellenos con 0 a la izquierda 00000001)]
* revisar en la asignación de departamentos, los prefijos asignados por el dane a cada uno. 

ejemplo: 0526N00000001







