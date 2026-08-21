**LIBRO TOTAL**

Contexto: 

Fue concebida por SYC en 2007 en Santander como un modelo de centros físicos que combinan trámites de gobierno con cultura, con sedes en Bucaramanga, Barrancabermeja, San Gil, Sincelejo, Florencia y Neiva, y su app permite consultar estados de cuenta de vehículos, declaraciones pagadas y pendientes — confirma que Libro Total es un agregador de consulta, no genera sus propias solicitudes, resolviendo el pendiente que tenía tu documento.

Lógica de creación de los mockups: con la estructura más distinta de las tres porque no genera sus propias solicitudes — es un agregador de consulta, confirmado por lo que encontré sobre los 6 centros físicos reales. Incluye Listado de Sedes, la Consulta Consolidada (la pieza central: buscas un ciudadano y ves su estado en IUVA, Colpensiones, Estampillas, etc. en un solo lugar), un tablero de Turnos (en vez de un Kanban de solicitudes), Agendar Turno, y el exportable es un Estado de Cuenta Consolidado que resume todos los trámites del ciudadano across proyectos.



Lógica: 

Al ser Libro Total un agregador de consultas y un centro de atención físico, tu API de "Gestión de Solicitudes" debe cambiar de enfoque. Aquí el analista no procesa un trámite (como liquidar un pasivo o cualquier otro proyecto), sino que su "solicitud" es la atención al ciudadano en taquilla. La solicitud nace cuando el ciudadano llega a la sede física, y se cierra cuando se le entrega su reporte consolidado y se resuelven sus dudas de Gobierno.A continuación, te detallo cómo adaptar la lógica de tu API, el flujo de trabajo para el operador/administrador y el contenido exacto del módulo.



El Flujo de Trabajo sugerido: (Workflow en Taquilla)

El flujo de este módulo no avanza por etapas de aprobación, sino por etapas de atención presencial:



\[1. Turnero / Recepción] ──> \[2. Llamado a Taquilla] ──> \[3. Consulta Consolidada] ──> \[4. Exportación / Entrega] ──> \[5. Cierre de Turno]





* Paso 1: Agendamiento y Turno: El ciudadano llega a una de las 6 sedes (Bucaramanga, San Gil, etc.) con un turno previo o saca uno en el tótem físico. Tu API registra un registro en la tabla Turno con estado EN\_ESPERA.
* Paso 2: Asignación al Operador: El sistema (o el administrador) asigna el turno a un analista libre. El estado cambia a EN\_ATENCION.
* Paso 3: Pantalla Central de Consulta: El operador digita la cédula del ciudadano. En ese instante, tu API hace un "barrido" (Scraping o llamadas REST en paralelo) a los otros módulos (IUVA, Colpensiones, Estampillas, Pasivos Laborales).
* Paso 4: Resolución y Exportación: El operador le muestra al ciudadano su situación global. Si el ciudadano lo pide, el operador genera el Estado de Cuenta Consolidado PDF.
* Paso 5: Cierre: El operador tipifica la atención (ej: "Trámite informativo de vehículos exitoso") y el turno cambia a FINALIZADO.





¿Qué debe contener el Módulo? (Componentes y Endpoints)



Para que tu API orientada a solicitudes maneje este modelo de agregación, debes estructurarla con estos 4 componentes core:



1. Gestión y Tablero de Turnos (Sustituye al Kanban de Solicitudes)En lugar de ver solicitudes pendientes por aprobar, el operador ve una lista priorizada de personas esperando en su sede actual.
* Entidades: Sede (Id, Nombre, Ciudad), Turno (Id, CedulaCiudadano, SedeId, OperadorId, Estado \[Espera, Atencion, Finalizado, Cancelado], FechaHora).
* Lógica del Administrador (Supervisor): El administrador tiene un endpoint de monitoreo para ver cuántos turnos hay represados por sede, reasignar turnos entre operadores o liberar taquillas congestionadas.



2\. El Motor de Consulta Consolidada (La pieza central)

Tu API de Libro Total debe actuar como un Gateway o Agregador (BFF - Backend For Frontend).

* Cuando el operador consulta una cédula, el Backend de Libro Total dispara peticiones simultáneas (usando Task.WhenAll en .NET, por ejemplo) hacia las bases de datos o APIs de los otros proyectos.
* Respuesta unificada: Consolida en un solo JSON:

&#x09;\* De Vehículos (IUVA): Declaraciones pagadas, pendientes y vigencias adeudadas.

&#x09;\* De Pasivos/Colpensiones: Estado de su historia laboral o trámites pensionales activos.

&#x09;\* De Estampillas: Si tiene cobros pendientes por actos administrativos.



3\. El Generador del Estado de Cuenta Consolidado (Exportable)

Es el único producto físico o digital que genera este módulo.

* Un servicio en tu API (usando librerías como SkiaSharp o QuestPDF en .NET) toma el JSON consolidado del punto anterior y arma un documento PDF oficial con la marca de "Libro Total".
* Este documento sirve como un "Paz y Salvo" o "Estado de Deuda Global" que el ciudadano se lleva impreso o recibe en su correo.





Roles: Operador (Analista) vs. Administrador (Supervisor)

Dado que tu sistema maneja estos dos perfiles, sus responsabilidades en Libro Total se dividen estrictamente así:

Característica / AcciónPerfil: Operador (Analista de Taquilla)Perfil: Administrador (Supervisor de Sede)Pantalla PrincipalTablero de turnos de su sede asignada para llamar al siguiente ciudadano.Tablero de control global de las 6 sedes en tiempo real.Acciones de TurnoLlamar turno, iniciar atención, pausar atención, finalizar turno.Reasignar turnos entre operadores, cancelar turnos vencidos, cambiar operadores de sede.ConsultasEjecutar la Consulta Consolidada del ciudadano que tiene al frente.Auditoría de consultas (ver qué operador buscó a qué ciudadano por temas de protección de datos/Habeas Data).Métricas / ReportesVer su récord de ciudadanos atendidos en el día.Exportar reportes de tiempos de espera promedio por sede y productividad de los analistas.







¿Para qué sirve la gestión del ciudadano en casa del libro?





La "Ventanilla Única" (Ahorro radical de tiempo)En Colombia, la tramitología pública está extremadamente fragmentada. Si un ciudadano quiere saber qué le debe al Estado o en qué van sus procesos, normalmente tendría que:Ir a la oficina de Tránsito o a la web de la Gobernación para el impuesto de vehículos (IUVA).Ir a una oficina de Colpensiones a hacer fila para su historia laboral.Ir a la Secretaría de Hacienda por el tema de Estampillas si contrata con el Estado.El Estado de Cuenta Consolidado unifica todo. En una sola fila de 15 minutos, el ciudadano sale con una radiografía completa de su situación financiera, pensional y tributaria con el departamento y la nación. Es centralizar la burocracia.2. Capacidad de Negociación y Planeación FinancieraMuchos ciudadanos van a estos centros porque necesitan financiar, pagar o ponerse al día, pero no saben exactamente cuánto deben en total. El documento consolidado les sirve para:Solicitar créditos bancarios: Los bancos suelen pedir estados de cuenta para verificar que el ciudadano no tenga deudas fiscales o embargos en curso.Aplicar a subsidios o licitaciones: Si el ciudadano va a contratar con la Gobernación (y necesita pagar estampillas), este documento le asegura que no tiene bloqueos administrativos en otros módulos.Planear su pensión: Al cruzar los datos de Colpensiones y Pasivos Laborales, el ciudadano puede ver si las entidades públicas donde trabajó ya sanearon sus deudas o si su pensión está frenada por falta de un bono.3. Validez Legal y Probatoria (Evidencia Física)Aunque hoy en día todo es digital, una gran parte de la población (especialmente adultos mayores que tramitan pensiones o personas de zonas rurales) no confía en las plataformas web o no sabe usarlas.El documento que genera tu API en El Libro Total sale con un código de verificación seguro (QR o PIN de auditoría).Para el ciudadano, ese papel impreso y firmado por el operador tiene valor legal de soporte ante cualquier reclamo posterior o para guardarlo en su archivo personal como un "Paz y Salvo" temporal multidimensional.4. Cultura mientras esperas (El valor agregado físico)El modelo original de SYC con El Libro Total tiene una filosofía muy particular: reducir el estrés del trámite público a través de la cultura. Mientras el ciudadano espera su turno para el Estado de Cuenta o es atendido, está rodeado de terminales donde puede leer libros digitales de la biblioteca universal, escuchar música clásica o ver exposiciones de arte. Transforma una experiencia tradicionalmente molesta (hacer un trámite de gobierno) en un espacio agradable.





FLUJO CREADO: 

Flujo REAL de trabajo de Libro Total

1\. Agendamiento (Recepción)



Desde el Workspace del proyecto, "Nueva solicitud" → buscas al ciudadano por documento → eliges la sede (Bucaramanga, San Gil, Barrancabermeja, Sincelejo, Florencia o Neiva) → eliges qué proyecto viene a consultar (IUVA, Colpensiones, Estampillas... o "Consulta consolidada" si quiere verlo todo) → fecha y hora.

El turno queda en estado Agendado.

2\. Llamado a taquilla



En Workflow (mismo ítem del sidebar, ahora muestra el tablero de Turnos de una sede en vez del Kanban genérico) el operador ve la fila del día agrupada en 4 columnas: Agendado → En atención → Atendido → No asistió.

Al llamar al turno, pasa a En atención y queda asignado al operador que lo llamó.

3\. Consulta consolidada



Desde el detalle del turno, botón "Consulta consolidada" (o directamente desde el Workspace, sin necesidad de turno) → se busca al ciudadano por documento y el sistema trae en un solo lugar todos sus trámites reales en IUVA, Colpensiones, Estampillas y cualquier otro proyecto donde tenga actividad — agrupados por proyecto, con su estado.

4\. Exportación / Entrega



Desde ahí, "Generar estado de cuenta" produce el documento oficial (PDF con QR de verificación) — el "Estado de Cuenta Consolidado" que el ciudadano se lleva impreso, con la referencia EC-{año}-{documento}.

5\. Cierre



El operador vuelve al detalle del turno y "Finalizar atención" — tipifica lo que pasó (ej. "Trámite informativo de vehículos exitoso") y el turno pasa a Atendido. Si el ciudadano nunca llegó, se marca directamente "No asistió" desde Agendado.

Sedes (accesible desde el botón "Sedes" en el Workspace): la grilla de las 6 sedes con sus métricas (atenciones del mes, espera promedio) — al hacer clic en una, entras al detalle de esa sede con sus stats y un acceso directo a su tablero de turnos.



Los servidores de prueba ya están apagados para que puedas conectarte tú.



