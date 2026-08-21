**SGDS — PERFIL GERENCIAL**

*Objetivo, sidebar, navegabilidad, requerimientos, Power BI e IA*
# **1. Perfil Gerencial**
**Objetivo:** Permitir al usuario Gerencial supervisar la operación global de SGDS, analizar indicadores, identificar tendencias y riesgos, consultar información autorizada y apoyar la toma de decisiones mediante analítica avanzada e IA.

**Principio:** Consultar + analizar + interpretar + decidir.

**Alcance:** Perfil principalmente de consulta y análisis. No administra usuarios, roles ni permisos, ni modifica solicitudes operativas.
# **2. Sidebar y navegabilidad**

|**Sección**|**Opción**|**Destino / función**|**Acceso**|
| :- | :- | :- | :- |
|GENERAL|Resumen Ejecutivo|Home Gerencial con KPI, tendencias, alertas e insights.|Consulta|
|ANÁLISIS|Indicadores|Indicadores por proyecto, periodo, estado y dimensiones autorizadas.|Consulta / filtros|
|ANÁLISIS|Tendencias|Evolución histórica de solicitudes, tiempos y cumplimiento.|Consulta / análisis|
|ANÁLISIS|Comparativos|Comparación entre periodos, proyectos y estados.|Consulta / análisis|
|SGDS INTELLIGENCE|Insights|Interpretación de indicadores y hallazgos relevantes.|Consulta|
|SGDS INTELLIGENCE|Alertas Inteligentes|Situaciones que requieren atención gerencial.|Consulta|
|SGDS INTELLIGENCE|Asistente IA|Preguntas en lenguaje natural sobre datos autorizados.|Consulta|
|OPERACIÓN|Proyectos|Consulta consolidada de proyectos autorizados.|Consulta|
|OPERACIÓN|Solicitudes|Consulta y detalle de solicitudes, sin modificación.|Consulta|
|OPERACIÓN|Reportes|Reportes SGDS y acceso a analítica Power BI.|Consulta / exportación|
|CONTROL|Auditoría|Trazabilidad de accesos y operaciones relevantes.|Consulta|
|CUENTA|Perfil / Cerrar sesión|Sesión y salida segura.|Sesión|
# **3. Home Gerencial**
- KPI: solicitudes totales, finalizadas, pendientes y cumplimiento SLA.
- Tendencia histórica de solicitudes y tiempos de atención.
- Proyectos con mayor carga operativa.
- Panel de alertas y situaciones prioritarias.
- Panel de Insights de SGDS Intelligence.
- Filtros por periodo, proyecto y demás dimensiones autorizadas.
# **4. Requerimientos Funcionales — Gerencial**

|**ID**|**Requerimiento**|**Prioridad**|
| :- | :- | :- |
|RF-GER-01|Consultar dashboard ejecutivo consolidado.|Alta|
|RF-GER-02|Visualizar solicitudes por estado.|Alta|
|RF-GER-03|Consultar indicadores por proyecto.|Alta|
|RF-GER-04|Filtrar información por periodo.|Alta|
|RF-GER-05|Visualizar tendencias históricas.|Alta|
|RF-GER-06|Comparar indicadores entre periodos y/o proyectos.|Media|
|RF-GER-07|Visualizar alertas por vencimientos, acumulación o SLA.|Alta|
|RF-GER-08|Consultar detalle de solicitudes asociadas a indicadores sin modificar datos.|Alta|
|RF-GER-09|Consultar productividad y tiempos de atención.|Alta|
|RF-GER-10|Generar/consultar reportes gerenciales.|Media|
|RF-GER-11|Acceder a SGDS Intelligence para insights.|Alta|
|RF-GER-12|Realizar consultas en lenguaje natural sobre información autorizada.|Media|
|RF-GER-13|Generar resumen ejecutivo asistido por IA.|Media|
|RF-GER-14|Identificar comportamientos relevantes o anómalos mediante reglas y/o IA.|Media|
|RF-GER-15|Consultar alertas y prioridad.|Alta|
|RF-GER-16|Registrar consultas y operaciones en auditoría.|Alta|
|RF-GER-17|Restringir información según proyectos y permisos del usuario.|Crítica|
# **5. Requerimientos Funcionales — SGDS Intelligence**

|**ID**|**Requerimiento**|**Prioridad**|
| :- | :- | :- |
|RF-IA-GER-01|Generar resumen ejecutivo del estado operativo.|Alta|
|RF-IA-GER-02|Interpretar indicadores calculados por SGDS.|Alta|
|RF-IA-GER-03|Identificar posibles anomalías.|Media|
|RF-IA-GER-04|Generar alertas inteligentes.|Media|
|RF-IA-GER-05|Permitir preguntas en lenguaje natural sobre datos autorizados.|Media|
|RF-IA-GER-06|Mostrar datos/evidencia de soporte cuando corresponda.|Alta|
|RF-IA-GER-07|Registrar operaciones de IA para auditoría.|Alta|
|RF-IA-GER-08|Impedir modificaciones directas de datos productivos por IA.|Crítica|
# **6. Integración con Power BI**
**Propósito:** Power BI funcionará como capa complementaria de analítica avanzada y visualización. No reemplaza el Home Gerencial ni SGDS Intelligence.

**Navegación:** Sidebar → Reportes → Analítica Power BI.

- Solicitudes recibidas, finalizadas, pendientes y vencidas.
- Tiempos promedio de atención y cumplimiento SLA.
- Indicadores por proyecto y periodo.
- Comparativos y tendencias.
- Productividad y carga operativa.
- Distribución por estado y tipo de solicitud.
# **7. Requerimientos Funcionales — Power BI**

|**ID**|**Requerimiento**|**Prioridad**|
| :- | :- | :- |
|RF-PBI-01|Acceder a analítica Power BI desde el perfil Gerencial.|Alta|
|RF-PBI-02|Visualizar dashboards gerenciales mediante Power BI.|Alta|
|RF-PBI-03|Aplicar filtros por periodo y proyecto según autorización.|Alta|
|RF-PBI-04|Visualizar indicadores históricos y comparativos.|Alta|
|RF-PBI-05|Analizar solicitudes, tiempos, estados y SLA.|Alta|
|RF-PBI-06|Respetar aislamiento y permisos antes de exponer información.|Crítica|
|RF-PBI-07|Permitir incorporar nuevos indicadores sin rediseño total.|Media|
|RF-PBI-08|Permitir exportación/consulta según capacidades y permisos habilitados.|Media|
|RF-PBI-09|Contar con mecanismo definido de actualización de datos.|Alta|
# **8. Requerimientos No Funcionales**

|**ID**|**Categoría**|**Requerimiento**|
| :- | :- | :- |
|RNF-GER-01|Seguridad|Autenticación y autorización basada en roles/permisos.|
|RNF-GER-02|Aislamiento|El Gerente solo consulta información autorizada.|
|RNF-GER-03|Integridad|Indicadores calculados sobre información válida y consistente.|
|RNF-GER-04|Auditoría|Consultas, reportes y operaciones relevantes trazables.|
|RNF-GER-05|Rendimiento|Carga de indicadores principales dentro de tiempos aceptables.|
|RNF-GER-06|Disponibilidad|Módulo disponible durante la operación normal.|
|RNF-GER-07|Escalabilidad|Agregar indicadores/fuentes sin cambios estructurales significativos.|
|RNF-GER-08|Usabilidad|Jerarquía visual clara para información gerencial.|
|RNF-GER-09|IA|IA limitada a información autorizada.|
|RNF-GER-10|IA|IA sin modificaciones directas sobre datos productivos.|
|RNF-GER-11|IA|Diferenciar datos, interpretación y recomendación cuando aplique.|
|RNF-GER-12|Mantenibilidad|Integración IA desacoplada mediante abstracción como IIAService.|
|RNF-PBI-01|Seguridad|Power BI debe respetar el modelo de autorización y aislamiento de SGDS.|
|RNF-PBI-02|Rendimiento|Dashboards y modelos optimizados para tiempos de carga adecuados.|
|RNF-PBI-03|Actualización|Frecuencia de actualización definida según necesidad gerencial.|
|RNF-PBI-04|Disponibilidad|Analítica disponible según el nivel acordado para la solución.|
|RNF-PBI-05|Escalabilidad|Modelo analítico preparado para nuevos indicadores y proyectos.|
|RNF-PBI-06|Trazabilidad|Fuentes, actualización y publicación de indicadores trazables.|
|RNF-PBI-07|Usabilidad|Dashboards coherentes con el Design System de SGDS.|
# **9. Flujos de navegación**

|**Flujo**|**Secuencia**|
| :- | :- |
|Principal|Login → validación de rol → Resumen Ejecutivo → indicador/proyecto → detalle/análisis → IA o Reportes.|
|IA|Consulta/indicador → validación de permisos → datos autorizados → procesamiento → insight/respuesta → auditoría.|
|Power BI|Gerencial → Reportes → Analítica Power BI → dashboard → filtros → visualización → detalle/exportación según permisos.|
# **10. Criterios de diseño**
- Priorizar información sintetizada sobre información transaccional.
- Mostrar estado, tendencia, cumplimiento y riesgo.
- Permitir pasar de indicadores agregados al detalle de soporte.
- Usar IA para interpretar, no para sustituir la fuente de datos.
- Usar Power BI para analítica avanzada sin duplicar innecesariamente el dashboard SGDS.
- Mantener acceso principalmente de consulta y análisis.
- Aplicar seguridad, aislamiento y auditoría en todas las capacidades.
# **11. Arquitectura funcional resumida**

|**Componente**|**Responsabilidad**|
| :- | :- |
|SGDS UI — Gerencial|Home, navegación, KPI, filtros y experiencia de usuario.|
|API / Backend|Autorización, reglas de negocio, agregación y exposición de datos.|
|PostgreSQL / fuentes|Persistencia y datos operacionales.|
|Power BI|Analítica avanzada, visualizaciones, comparativos y dashboards.|
|SGDS Intelligence|Insights, interpretación, lenguaje natural y alertas inteligentes.|
|Auditoría|Trazabilidad de accesos, consultas y operaciones relevantes.|

**Documento de trabajo — SGDS | Perfil Gerencial**
