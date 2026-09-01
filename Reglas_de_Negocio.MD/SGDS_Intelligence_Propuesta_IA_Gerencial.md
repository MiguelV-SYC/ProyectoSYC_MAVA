**SGDS INTELLIGENCE**

**Propuesta de Inteligencia Gerencial asistida por IA**

Sistema de Gestión de Solicitudes (SGDS)

Documento técnico y conceptual\
Perfil Gerencial · Analítica · IA · Toma de decisiones


# **Contenido**
- 1. Resumen ejecutivo
- 2. Objetivo de la propuesta
- 3. Concepto: SGDS Intelligence
- 4. Capacidades de IA propuestas
- 5. Arquitectura funcional
- 6. Arquitectura técnica
- 7. IA, datos estructurados y RAG
- 8. Seguridad y gobierno de la IA
- 9. MVP recomendado
- 10. Beneficio diferencial para SGDS
- 11. Evolución futura
- 12. Recomendación final
- Referencias técnicas
# **1. Resumen ejecutivo**
La propuesta consiste en incorporar al perfil gerencial de SGDS una capa denominada SGDS Intelligence, orientada a transformar los datos operativos del sistema en información contextualizada, indicadores interpretables, alertas y recomendaciones para apoyar la toma de decisiones.

La IA no se plantea como un chatbot genérico ni como un sustituto del gerente. Su función es reducir el tiempo necesario para comprender la operación, detectar situaciones relevantes y consultar información mediante lenguaje natural.
# **2. Objetivo de la propuesta**
Diseñar una capacidad de Inteligencia Gerencial integrada con SGDS que combine analítica determinística, datos operativos controlados y modelos de lenguaje para generar insights, alertas y respuestas contextualizadas.

- Los cálculos críticos deben realizarse mediante reglas de negocio y servicios determinísticos.
- La IA interpreta y explica información validada; no debe inventar indicadores.
- El acceso a información debe respetar el perfil y permisos del usuario.
- El agente gerencial debe ser inicialmente de solo lectura.
- Las respuestas deben diferenciar datos, interpretación y fuentes documentales.
# **3. Concepto: SGDS Intelligence**
SGDS Intelligence sería un módulo del perfil gerencial compuesto por tres capacidades principales: analítica inteligente, alertas inteligentes y consulta mediante lenguaje natural.

|**Capacidad**|**Propósito**|**Ejemplo**|
| :- | :- | :- |
|Analítica inteligente|Interpretar indicadores y tendencias.|Resumen ejecutivo mensual.|
|Alertas inteligentes|Detectar y explicar riesgos o anomalías.|Solicitudes próximas a vencer.|
|Consulta natural|Consultar datos mediante lenguaje natural.|¿Qué proyecto tiene más pendientes?|

# **4. Capacidades de IA propuestas**
## **4.1 Explicación automática del dashboard**
El sistema calcula los indicadores y posteriormente la IA genera una explicación ejecutiva de los resultados. Por ejemplo, puede destacar aumentos de demanda, proyectos con mayor carga y riesgos operativos.
## **4.2 Detección y explicación de anomalías**
Una capa de analítica identifica comportamientos atípicos mediante reglas o métodos estadísticos. La IA recibe el resultado y lo explica en lenguaje gerencial.
## **4.3 Alertas inteligentes**
El sistema puede identificar solicitudes próximas a vencimiento, concentración de carga, incumplimientos o cambios relevantes y generar una explicación priorizada.
## **4.4 Preguntas en lenguaje natural**
El gerente podrá preguntar, por ejemplo: ¿Cuál es el proyecto con mayor cantidad de solicitudes pendientes? La respuesta deberá basarse en datos autorizados del sistema.
## **4.5 Comparación y tendencias**
La IA puede convertir comparaciones entre periodos, proyectos o indicadores en explicaciones ejecutivas.
## **4.6 Informe ejecutivo generado por IA**
Como evolución, el gerente podrá generar un informe con resumen ejecutivo, estado general, comportamiento de solicitudes, proyectos destacados, riesgos, tendencias, recomendaciones e indicadores.
# **5. Arquitectura funcional**
Flujo conceptual: DATOS → INFORMACIÓN → ANÁLISIS → INSIGHTS → RECOMENDACIONES → DECISIÓN

|**Componente**|**Responsabilidad**|
| :- | :- |
|Dashboard gerencial|Visualizar indicadores, tendencias, alertas e insights.|
|Analítica|Calcular métricas y detectar condiciones objetivas.|
|Motor IA|Interpretar datos controlados y responder preguntas.|
|RAG|Recuperar información documental cuando la consulta lo requiera.|
|Gobierno y seguridad|Controlar permisos, trazabilidad y alcance de las consultas.|

# **6. Arquitectura técnica**
La IA debe integrarse respetando la arquitectura en capas planteada para SGDS. No se recomienda conectar directamente el modelo de IA con la base de datos productiva.

React → ASP.NET Core API → Servicios de aplicación/analítica/alertas/IA → PostgreSQL + Motor IA → RAG documental (evolución)

|**Capa**|**Ejemplos**|
| :- | :- |
|Presentación|React + TypeScript + Tailwind|
|API|ASP.NET Core Web API|
|Aplicación / negocio|DashboardService, AnalyticsService, AlertService, AIService|
|Persistencia|Entity Framework Core + PostgreSQL|
|IA|Proveedor LLM / agente de datos|
|Conocimiento documental|RAG + almacenamiento/vectorización, como evolución|

## **6.1 Principio de datos controlados**
El flujo recomendado es PostgreSQL → capa de analítica → datos controlados → LLM. El modelo no debe recibir indiscriminadamente todas las tablas de la base de datos.

Ejemplo de contexto estructurado: periodo, solicitudes, finalizadas, pendientes, SLA, proyecto con mayor carga y solicitudes críticas.
# **7. IA, datos estructurados y RAG**
No todas las consultas requieren la misma técnica. Los indicadores y datos operativos deben consultarse desde fuentes estructuradas. Los documentos normativos, manuales y procedimientos pueden consultarse mediante RAG.

|**Tipo de pregunta**|**Mecanismo**|**Ejemplo**|
| :- | :- | :- |
|Indicadores|PostgreSQL + analítica|¿Cuántas solicitudes están pendientes?|
|Tendencias|Analítica + IA|¿Cómo evolucionó el SLA?|
|Explicación|Datos calculados + LLM|¿Qué está afectando el cumplimiento?|
|Reglamentos/procedimientos|RAG + LLM|¿Qué regla aplica a este proceso?|
|Consulta gerencial|Agente controlado|¿Qué proyecto tiene mayor carga?|

## **7.1 Text-to-SQL controlado**
Para preguntas sobre datos, un agente puede traducir lenguaje natural a consultas. En SGDS se recomienda restringir esta capacidad a operaciones de lectura y, preferiblemente, a vistas diseñadas para analítica.

Flujo: Pregunta → Agente → Validación → Consulta de lectura → PostgreSQL → Resultado → Respuesta

No se recomienda permitir UPDATE, DELETE o INSERT sobre la base productiva. El MVP debe ser de solo lectura.
## **7.2 RAG**
RAG (Retrieval-Augmented Generation) permite recuperar información relevante desde documentos y utilizarla como contexto para el modelo. En SGDS sería especialmente útil para manuales, políticas, procedimientos, reglamentos y documentación.
# **8. Seguridad y gobierno de la IA**
- Control de acceso según el perfil gerencial y sus permisos.
- Consultas inicialmente de solo lectura.
- Separación entre datos productivos y datos preparados para analítica.
- Registro de consultas y respuestas para auditoría.
- Diferenciación entre dato calculado, interpretación de IA y fuente documental.
- No exponer información que el usuario no esté autorizado a consultar.
- Aplicar límites y validaciones antes de ejecutar consultas.
# **9. MVP recomendado**
Para un alcance controlado, se recomienda concentrarse en funcionalidades demostrables y de alto valor.

|**Fase**|**Funcionalidad**|**Resultado**|
| :- | :- | :- |
|IA 1|Insights automáticos|Resumen ejecutivo del dashboard.|
|IA 2|Alertas inteligentes|Detección y explicación de riesgos.|
|IA 3|Preguntas naturales|Consultas gerenciales sobre datos autorizados.|
|IA 4|RAG documental|Respuestas fundamentadas en documentos.|

Prioridad: implementar IA 1 + IA 2 primero y evaluar IA 3 según el tiempo disponible.
# **10. Beneficio diferencial para SGDS**
El diferencial no consiste en agregar un chatbot, sino en incorporar una capa de inteligencia que transforme datos operativos en conocimiento accionable.

|**Nivel**|**Resultado**|
| :- | :- |
|Datos|Registros de solicitudes, proyectos, usuarios y workflow.|
|Información|Indicadores y métricas.|
|Análisis|Tendencias, comparaciones y anomalías.|
|Insights|Interpretación contextualizada.|
|Recomendaciones|Prioridades y aspectos que requieren atención.|
|Decisión|El gerente utiliza la información para actuar.|

# **11. Evolución futura**
- Predicción de demanda o carga operativa.
- Modelos de análisis avanzado.
- Agentes especializados por dominio.
- Recomendaciones contextualizadas.
- Automatización controlada de acciones.
- Generación periódica de informes gerenciales.
- Integración con herramientas de analítica y visualización empresarial.
# **12. Recomendación final**
SGDS Intelligence puede convertirse en uno de los componentes de mayor valor del perfil gerencial. La recomendación es construirlo progresivamente, manteniendo una separación clara entre la lógica determinística del sistema y la capacidad generativa del modelo.

La IA no reemplaza al gerente ni toma decisiones por él: reduce el tiempo necesario para comprender la operación, identificar situaciones relevantes y consultar información.

**Principio rector: la IA interpreta información confiable; la decisión permanece bajo responsabilidad humana.**
# **Referencias técnicas**
- Microsoft Learn — Fabric: análisis de datos, agentes de datos y agentes orientados a operaciones.
- Microsoft Learn — Fabric Data Agents: consulta de fuentes de datos mediante lenguaje natural.
- Microsoft Learn — Azure Architecture Center: conceptos de IA y patrones de RAG.
SGDS Intelligence · Propuesta de IA Gerencial
