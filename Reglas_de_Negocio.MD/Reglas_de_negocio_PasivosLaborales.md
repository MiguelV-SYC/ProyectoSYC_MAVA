**LÓGICA DE NEGOCIO PASIVOS LABORALES.** 



Mapeo de tu pantalla hacia la lógica de la API



Cuando el operador selecciona una opción en esa interfaz, tu API debe activar flujos internos totalmente diferentes:

1\. Si selecciona: "Gestión de pasivo pensional"

Este botón es la puerta de entrada a los tres instrumentos financieros que mencionaste. En el siguiente paso (Afiliado o Detalles), tu API debe solicitar y procesar:

* Cuotas Partes: El sistema debe pedir el historial de entidades públicas, salarios y calcular los porcentajes de tiempo laborado.
* Bonos Pensionales: El sistema debe habilitar el flujo para tramitar el título valor ante la OBP.
* Cálculo Actuarial: Se activa si el operador detecta que una entidad pública omitió aportes y hay que cobrarle la reserva matemática.



2\. Si selecciona: "Gestión de pasivo laboral"

El pasivo laboral es diferente al pensional. Aquí la API no debe calcular pensiones, sino obligaciones laborales pendientes de entidades públicas liquidadas o activas. Tu lógica de negocio aquí procesará:

* Demandas y sentencias judiciales laborales en contra del Estado.
* Cesantías retroactivas pendientes por pagar a ex-empleados públicos.
* Sueldos o prestaciones sociales remanentes de entidades liquidadas.



3\. Si selecciona: "Consulta de expediente digital"

Este es un flujo puramente de lectura (Read-Only) y auditoría.

* No genera cálculos ni afecta pasivos.
* La API debe conectarse como un puente (Gateway) hacia el repositorio documental (alfresco, SharePoint o la DB de Colpensiones) para traer el histórico de documentos escaneados del afiliado.



CONSIDERACIONES: 

\------------------

El concepto de Pasivo Pensional o Pasivo Laboral en el contexto de Colpensiones está diseñado casi con exclusividad para el sector público o para empresas privadas que tenían regímenes especiales muy antiguos.Si una persona trabajó en cualquier empresa privada común (por ejemplo, almacenes Éxito, un banco privado o una fábrica) y estuvo afiliada a Colpensiones, esa empresa privada NO genera un pasivo laboral ni pensional que deba ser liquidado por tu sistema.La explicación técnica y de negocio se divide en tres razones fundamentales:1. El Sector Privado paga mes a mes (No acumula deuda)Las empresas privadas comunes están obligadas a pagar la seguridad social de sus empleados de forma mes a mes a través de la planilla PILA.El dinero ingresa inmediatamente al fondo común de Colpensiones.Por lo tanto, cuando el trabajador se va a pensionar, Colpensiones simplemente revisa cuántas semanas se pagaron en esa empresa privada a través del historial regular. No hay ninguna deuda que cobrarle a la empresa, ni cuotas partes, ni bonos pensionales. El pasivo ya fue financiado mes a mes.2. El Sector Público acumula la deuda (Genera el Pasivo)El problema (y la razón de ser de tu proyecto de Pasivos Laborales) ocurre históricamente con el Estado. Antes de la Ley 100 de 1993, las alcaldías, ministerios y entidades territoriales no le pagaban a Colpensiones (antiguo Seguro Social). Ellos guardaban el dinero y prometían pagar la pensión directamente con su propio presupuesto.Cuando un ciudadano que trabajó en el sector público se pensiona hoy en Colpensiones, Colpensiones le dice a esa alcaldía o ministerio: "Usted nunca me pagó los aportes de este ciudadano mientras trabajó con usted. Por lo tanto, genéreme un Bono Pensional o págueme una Cuota Parte mensual para financiar esta pensión". Eso es el Pasivo Laboral/Pensional.





\------------------

La Lógica de Negocio

Cuando la solicitud entra en la etapa de análisis, la API debe implementar las reglas específicas que mencionas para procesar la información:



A. Módulo de Cuotas Partes Pensionales (Regla de Prorrateo)

Es el instrumento más transaccional. La lógica de negocio debe calcular el cobro o la asignación a las entidades públicas concurrentes:

* Entradas obligatorias: Tiempo total laborado en cada entidad (fechas exactas), Salario Base de Liquidación (SBL), Tipo de pensión (Vejez, Invalidez, Sobrevivencia) y Régimen aplicable.
* Cálculo de Proporción: La API debe calcular el porcentaje de tiempo que el afiliado aportó en la Entidad "A" respecto al tiempo total requerido.
* Generación de Deuda/Cobro: Si la entidad responsable principal es Colpensiones, la API emite una solicitud de cobro de cuota parte a las demás entidades públicas donde trabajó el ciudadano.



B. Módulo de Bonos Pensionales

* Representa el título valor que se redime para financiar la pensión. La API debe gestionar la solicitud de emisión, reconocimiento o pago de estos bonos ante la entidad emisora (OBP - Oficina de Bonos Pensionales o Minhacienda).



C. Módulo de Cálculo Actuarial

* Se activa cuando se detectan periodos de tiempo laborados en entidades públicas que no realizaron los aportes de ley en su momento. La API debe calcular el valor presente de esa omisión para que la entidad pública pague la reserva matemática correspondiente.





La Lógica de Desarrollo

Para que tu código sea escalable (especialmente si usas C#/.NET en el Backend), te recomiendo implementar una arquitectura limpia estructurada de la siguiente manera:



Entidades Principales del Modelo (DB)

* Solicitud: Contiene el ID, Tipo de Solicitud, Estado (Radicada, En\_Estudio, Aprobada, Rechazada), OperadorResponsableID, y FechaCreacion.
* Afiliado: Datos del ciudadano, historial laboral verificado y Salario Base de Liquidación (SBL).
* InstrumentoPasivo: Tabla abstracta o relacional que almacena el detalle técnico (si es CuotaParte, Bono o CalculoActuarial).
* VinculacionLaboral: Registro de cada entidad pública donde trabajó el afiliado (EntidadID, FechaInicio, FechaFin, Salario).



Componentes de Software Recomendados

* Service Layer (Patrón Strategy): No uses un único servicio para procesar solicitudes. Crea una interfaz IInstrumentoProcesador y tres implementaciones independientes: ProcesadorCuotaParte, ProcesadorBono, y ProcesadorCalculoActuarial. El backend invocará la estrategia correcta según lo seleccionado en el Frontend (Paso 1).
* Motor de Estados (State Pattern / Workflow Engine): Una solicitud de pasivos laborales pasa por muchas firmas y revisiones. Define transiciones estrictas en tu API (ej. no se puede pasar a Liquidada si el cálculo de cuotas partes no suma el 100% del tiempo requerido).



**FLUJO:** 



**┌──────────────────────────┐                     ┌──────────────────────────┐**

**│       COLPENSIONES                 │                     │		    PASIVOS LABORALES        │**

**│  (Dueño del Ciudadano)             │                     │        (Liquidador/Operador)       │**

**├──────────────────────────┤                     ├──────────────────────────┤**

**│ - Base de Afiliados                │ ──\[API REST]─>     │ - Registro de Solicitud            │**

**│ - Historia Laboral (HL)            │ ──\[Verificación]─> │ - Cálculo Instrumentos             │**

**│ - Reconocimiento Pensión           │ <─\[Foil/Cobro]─    │ - Recobro a Entidades              │**

**└──────────────────────────┘                     └──────────────────────────┘**



1. API de Consulta de Identidad e Historia Laboral (HL): Cuando el operador digita la cédula en tu Paso 2, tu API no busca en su propia base de datos; hace un llamado seguro a Colpensiones para traer el estado del ciudadano y su Historia Laboral unificada.
2. Gateway de Documentos: Colpensiones transfiere o da acceso al expediente digital del ciudadano para verificar los certificados físicos de tiempos públicos (Formatos CLEBP / Certificados de información laboral).
3. Servicio de Notificación de Liquidación (Webhook): Una vez que tu API calcula y aprueba el pasivo (ej. emite el bono o liquida la cuota parte), notifica a Colpensiones para que ellos procedan a pagar la mesada pensional al ciudadano, sabiendo que el dinero del sector público ya está respaldado.



**El Flujo de Trabajo Interconectado**

Así opera el flujo sincronizado paso a paso, marcando claramente las fronteras de cada sistema:



Fase 1: Disparador (En Colpensiones)

* Un ciudadano radica su solicitud de pensión en Colpensiones.
* Colpensiones revisa su historia laboral y detecta que el ciudadano trabajó 10 años en la Alcaldía de Bogotá y 5 años en el Ministerio de Transporte.
* El Puente: Colpensiones detecta que requiere de la concurrencia de tiempos públicos e inicia un trámite en el sistema de Pasivos Laborales (ya sea de forma automática por API o porque un operador traslada el caso).



Fase 2: Procesamiento (En Pasivos Laborales)

* Paso 1 (Tu UI): El operador abre el módulo de PL y selecciona "Gestión de pasivo pensional".
* Paso 2 (Tu UI): El operador ingresa la cédula. Tu API consulta al puente de Colpensiones, descarga la Historia Laboral y los datos básicos del afiliado.
* Paso 3 (Tu UI): El operador desglosa los instrumentos financieros. Si procesa Cuotas Partes, el sistema toma los periodos de la Alcaldía y del Ministerio para prorratear la deuda.
* Cierre en PL: Tu API calcula el valor exacto que la Alcaldía y el Ministerio deben aportar para financiar esa pensión. Se emite el acto administrativo de cuota parte o el título del bono pensional.





Fase 3: Retorno y Cierre (En Colpensiones)

* Tu API cambia el estado de la solicitud a APROBADA\_Y\_LIQUIDADA.
* A través del puente, tu sistema le envía a Colpensiones el resultado: "El pasivo pensional está listo. Alcaldía responde por el 30%, Ministerio por el 15%, Colpensiones asume el resto".
* Colpensiones emite la resolución final de pensión y le paga al ciudadano. Tu sistema se encarga de cobrarle mensualmente a las entidades públicas (Alcaldía/Ministerio) sus respectivas porciones.













FLUJO DE TRABAJO FINAL PARA PASIVOS LABORALES 





Flujo de trabajo de Pasivos Laborales

1\. Radicación (operador de Pasivos Laborales)



Nueva solicitud → elige uno de los 3 tipos: Gestión de pasivo pensional, Gestión de pasivo laboral, o Consulta de expediente digital.

Busca la entidad territorial (la alcaldía/ministerio/entidad pública) por NIT — es el "afiliado" de la solicitud, igual que en los demás proyectos.

Si el servidor ya radicó su pensión en Colpensiones, puede vincularla opcionalmente (busca por cédula) — hereda nombre y documento automáticamente.

Completa el instrumento (Cuota parte, Bono tipo B/T, Cálculo actuarial, o los del pasivo laboral), régimen pensional, tiempo laborado en la entidad y, si es Cuota parte, el tiempo total de aportes del servidor y el valor de la mesada.

Radica → la solicitud entra en estado Radicada (workflow genérico de 7 estados, visible en el Kanban del proyecto).

2\. Análisis y avance de estado



El operador mueve la solicitud por el Kanban/Cambiar estado igual que en cualquier otro proyecto: Radicada → En revisión → (Pendiente / Requiere información si falta algo) → Aprobada o Rechazada → Finalizada.

Puede adjuntar documentos de soporte (certificación de tiempo laborado, histórico de novedades salariales) desde el detalle de la solicitud.

3\. Liquidación (solo si el instrumento es Cuota parte pensional)



Desde el detalle de la solicitud, botón "Ver liquidación" → calcula automáticamente el % de concurrencia (tiempo laborado ÷ tiempo total de aportes) y el valor mensual a cargo de la entidad.

Para los otros instrumentos (bonos, cálculo actuarial, pasivo laboral) la vista explica que ese cálculo automático no aplica — se gestionan por fuera de esta liquidación.

Se puede descargar el documento en PDF con QR de verificación.

4\. Cierre



Una vez Aprobada/Finalizada, el "cobro" a la entidad territorial (el pago mensual de la cuota parte, o la emisión formal del bono/cálculo actuarial ante Minhacienda/OBP) queda fuera del alcance de este piloto — no hay un motor de recaudo automático ni la integración real con Colpensiones para notificarle que ya puede pagar la mesada al ciudadano (eso sigue siendo manual/externo, tal como quedó documentado como decisión de diseño).

























