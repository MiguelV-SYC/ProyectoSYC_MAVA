# SGDS — Sistema de Gestión de Solicitudes

Guía de arquitectura para trabajar en este repositorio. Léela antes de tocar código: describe cómo el proyecto **realmente** está construido (no cómo "debería" estarlo según el README, que está desactualizado en varios puntos — ver sección final).

## Qué es el proyecto

SGDS es un sistema web para gestionar **solicitudes/trámites** de ciudadanos y empresas, con expedientes digitales, flujo de aprobación por estados, documentos adjuntos, auditoría automática y reportes. Es un proyecto de aprendizaje (ruta U-Casual de SYC) que imita la arquitectura de proyectos reales de la organización.

Concepto central del dominio: **multi-tenant por "Proyecto"**. Un `Proyecto` (p. ej. "Comfenalco") es un espacio de trabajo aislado con sus propios `TipoSolicitud`, sus propios operadores (`UsuarioProyecto` + `Rol`) y sus propias `Solicitud`es. Un mismo `Usuario` puede pertenecer a varios proyectos con roles distintos en cada uno.

## Stack tecnológico

- **Backend**: C# / .NET 10, ASP.NET Core Web API, Entity Framework Core 10 (Npgsql, snake_case naming convention), PostgreSQL, JWT Bearer auth, BCrypt.Net (hash de passwords), Swagger/OpenAPI, QuestPDF (generación de PDF), ClosedXML (exportación a Excel).
- **Frontend**: React 19 + TypeScript, Vite 8, React Router v7, Tailwind CSS v4 (`@tailwindcss/vite`), axios, jwt-decode, recharts (gráficas), lucide-react (iconos).
  - Nota: el README menciona Material UI como parte del stack, pero **no se usa** — el UI real está hecho con Tailwind y componentes propios estilizados a mano (ver `Sidebar.tsx`).
- **DB**: PostgreSQL, tablas en `snake_case` (mapeadas explícitamente en `OnModelCreating`).

## Estructura de carpetas (arquitectura en capas .NET)

```
SGDS.Domain/          Entidades POCO puras, sin lógica de negocio (anemic model)
SGDS.Application/     DTOs, interfaces (IAlmacenamientoService), helpers (CalculadoraDv)
SGDS.Infrastructure/  SgdsDbContext (EF Core) + implementaciones de servicios (AlmacenamientoLocalService)
SGDS.Api/             Controllers — aquí vive TODA la lógica de negocio real
SGDS.Frontend/        SPA React (Vite), consume la API vía axios
Assets/               Mockups y material del README
```

**Importante — esto NO es Clean Architecture con casos de uso**: pese a tener capas Domain/Application/Infrastructure, no hay repositorios, no hay servicios de aplicación (use cases), no hay MediatR. Los `Controllers` de `SGDS.Api` inyectan `SgdsDbContext` directamente y hacen las consultas EF Core, la autorización por claims y el mapeo a DTOs, todo inline. `SGDS.Application` solo aporta DTOs/interfaces/helpers, y `SGDS.Infrastructure` solo aporta el DbContext y el servicio de almacenamiento de archivos. Si vas a agregar lógica nueva, el patrón esperado en este repo es: **controller gordo con LINQ + DTOs**, no introducir una capa de servicios nueva salvo que el usuario lo pida explícitamente.

## Modelo de dominio (entidades clave)

- `Usuario` — cuenta de login. No tiene un rol propio: sus roles están en `UsuarioProyecto` (uno por cada proyecto al que pertenece).
- `Proyecto` — espacio de trabajo/tenant. Tiene `Codigo` (prefijo usado para numerar solicitudes: `{Codigo}-{Id:0000}`), `Activo`, `EstadoPersonalizado`.
- `Rol` — catálogo global de roles (p. ej. "Administrador SYC", "Operador"). `RolesController` solo expone un GET simple.
- `UsuarioProyecto` — tabla puente (PK compuesta `UsuarioId`+`ProyectoId`) que asigna un `Rol` a un `Usuario` dentro de un `Proyecto` concreto. **El rol "Administrador SYC" en cualquier proyecto convierte al usuario en admin global** (`esAdminSyc`), ver sección Auth.
- `TipoSolicitud` — catálogo de tipos de trámite, **scoped a un Proyecto** (`ProyectoId` obligatorio).
- `Solicitud` — el trámite en sí. Vinculada opcionalmente a `Ciudadano` o `Empresa` (uno de los dos, validado en el controller), a un `Proyecto`, un `TipoSolicitud`, un `Vehiculo` y un `UsuarioAsignado`. Tiene `Estado` (string libre, no enum — ver abajo) y `DatosAdicionales` (columna `jsonb`, campos dinámicos según el tipo de solicitud).
- `HistorialEstado` — bitácora de cambios de estado de una `Solicitud` (estado anterior/nuevo, usuario, fecha). Se crea manualmente en `CambiarEstado`.
- `Documento` — archivo adjunto a una `Solicitud`, guardado en disco vía `IAlmacenamientoService`.
- `Auditoria` — bitácora **automática y transversal** de cambios (ver `SgdsDbContext.SaveChangesAsync`).
- `Ciudadano`, `Empresa`, `Vehiculo` — entidades de negocio (solicitantes y sus bienes).
- `SolicitudAcceso` / `SolicitudAccesoProyecto` — flujo de auto-registro: alguien externo pide acceso al sistema para uno o más proyectos (`POST /api/Auth/solicitar-acceso`), un admin lo aprueba luego (módulo `AprobacionUsuarioPage`).
- `Reporte` — metadatos de reportes generados (PDF/Excel) por proyecto/usuario.

### Estados de `Solicitud`

No hay enum — son strings libres comparados por valor en los controllers: `"Radicada"`, `"Pendiente"`, `"En revisión"`, `"Requiere información"`, `"Aprobada"`, `"Rechazada"`, `"Finalizada"`. Los estados **finales** (`Aprobada`, `Rechazada`, `Finalizada`) setean `FechaCierre`. Si agregas un estado nuevo, hazlo consistente en: `SolicitudesController.CambiarEstado`, el array `estadosFinales`, y el frontend (`WorkFlowKanbanPage.tsx`, `camposPorTipoSolicitud` si aplica).

### Campos dinámicos por tipo de solicitud

`Solicitud.DatosAdicionales` es JSON libre (`jsonb`). El frontend define qué campos mostrar en el formulario según el **nombre** del `TipoSolicitud` en `SGDS.Frontend/src/config/camposPorTipoSolicitud.ts` (`CAMPOS_POR_TIPO`, keyed por el string `Nombre`, no por Id — frágil ante renombres). Si no hay config para un tipo, se usa `CAMPO_FALLBACK` (un campo de observaciones). Al agregar un `TipoSolicitud` nuevo en un proyecto, normalmente hay que añadir su entrada aquí para que tenga un formulario a medida.

## Autenticación y autorización

- JWT emitido en `POST /api/Auth/login` (`AuthController.GenerarToken`). Claims incluidos:
  - `sub` = UsuarioId, `email`, `nombreCompleto`.
  - `esAdminSyc` = `"True"/"False"` (string) — `true` si el usuario tiene el rol **"Administrador SYC"** en *cualquiera* de sus proyectos.
  - `proyecto` (claim repetido, uno por cada `UsuarioProyecto`) con formato `"{ProyectoId}:{RolNombre}"`.
- **No hay `[Authorize(Roles=...)]` de ASP.NET** — la autorización se hace a mano en cada acción leyendo claims:
  ```csharp
  var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
  var proyectosPermitidos = User.FindAll("proyecto").Select(c => int.Parse(c.Value.Split(':')[0])).ToList();
  ```
  Este patrón se repite literalmente en casi todos los controllers — cópialo si agregas endpoints nuevos con scoping por proyecto.
- Admin SYC ve/edita todo; un operador normal solo ve datos de los proyectos donde tiene un `UsuarioProyecto`.
- Frontend: el JWT decodificado se guarda completo en `localStorage` bajo la key `sgds_auth_user` (`AuthContext.tsx` + `authService.ts`). No hay interceptor global de axios — cada archivo de `services/*.ts` arma el header `Authorization: Bearer {token}` manualmente vía `authHeader()`. Si agregas un nuevo service, sigue ese mismo patrón por consistencia con el resto del código.
- `esAdminSyc` en frontend controla qué rutas/menús se muestran (`App.tsx` guards de ruta, `Sidebar.tsx` sección "Administración").

## Auditoría automática

`SgdsDbContext.SaveChangesAsync` está sobreescrito: antes de guardar, recorre el `ChangeTracker`, detecta cualquier entidad `Added/Modified/Deleted` (excepto `Auditoria` y `HistorialEstado` mismos, para evitar recursión/ruido) y crea un registro `Auditoria` automáticamente con usuario (del `HttpContext`/claims), acción, IP y `ProyectoId` (resuelto solo para `Solicitud` y `TipoSolicitud` vía `ObtenerProyectoId`). **Esto significa que cualquier `SaveChangesAsync()` en cualquier controller genera auditoría sin que el desarrollador tenga que hacer nada extra** — no dupliques ese logging manualmente.

## Convenciones de backend a seguir

- Tablas mapeadas a `snake_case` explícitamente en `SgdsDbContext.OnModelCreating` (`ToTable(...)`) — si agregas una entidad nueva, regístrala igual ahí y en el `DbSet<>`.
- DTOs viven todos en `SGDS.Application/DTOs/*.cs`, un archivo por entidad/feature, con varias clases (`XResponseDto`, `CrearXDto`, `ActualizarXDto`) en el mismo archivo — no crear un archivo por clase.
- Paginación: patrón `PaginacionResponseDto<T>` + `pagina`/`tamanoPagina` como query params (ver `SolicitudesController.GetListadoSolicitudes`).
- Borrado = inactivación: los `DELETE` de este API casi nunca eliminan filas, solo setean `Activo = false` (ver `InactivarProyecto`, `InactivarUsuario`).
- `IAlmacenamientoService` abstrae el guardado de archivos; hoy solo hay `AlmacenamientoLocalService` (filesystem local, carpeta `SGDS.Api/Almacenamiento/`, registrado como `Singleton` en `Program.cs`). Si se necesita cambiar a blob storage en la nube, implementar la interfaz sin tocar controllers.
- CORS restringido a `http://localhost:5173` (puerto por defecto de Vite dev server) — actualizar la policy `"AllowFrontend"` en `Program.cs` si cambia el origen del frontend.
- Connection string, JWT key, etc. están en `appsettings.json` **en texto plano** (no usar `dotnet user-secrets` todavía) — ojo al commitear si esto cambia a valores reales de producción.

## Frontend — estructura

- `src/pages/*.tsx` — una página por ruta, sin carpetas por feature.
- `src/services/*.ts` — un archivo por recurso de API (`solicitudService.ts`, `proyectoService.ts`, etc.), cada uno usa axios directo contra `API_URL = 'http://localhost:5158/api'` (hardcoded, sin `.env`).
- `src/context/AuthContext.tsx` — único contexto global, expone `user`, `login`, `logout`.
- `src/components/layout/Sidebar.tsx` — nav lateral, decide qué mostrar según `user.esAdminSyc` y arma URLs con `?proyectoId=` para que las páginas de operador (Solicitudes/Documentos/Workflow/Reportes) sepan en qué proyecto están parados. El proyecto "activo" del operador se persiste en `localStorage` (`sgds_proyecto_activo`).
- `App.tsx` — todas las rutas declaradas planas en un solo `<Routes>`, con guards inline (`user ? <Page/> : <Navigate to="/login"/>`, o `user?.esAdminSyc ? ... : ...`) — no hay componente `<ProtectedRoute>` reutilizable todavía; si agregas rutas nuevas, sigue el mismo patrón inline por consistencia.

## Comandos de desarrollo

```bash
# Backend (desde la raíz, requiere PostgreSQL corriendo con la connection string de appsettings.json)
dotnet restore
dotnet build
dotnet run --project SGDS.Api        # API en el puerto que indique la consola (frontend espera 5158)

# Frontend (desde SGDS.Frontend/)
npm install
npm run dev          # Vite dev server en :5173
npm run build         # tsc -b && vite build
npm run lint
```

No hay proyecto de tests (`*.Tests`) en la solución actualmente, pese a que el README marca "Pruebas: ✅ Completado" — ese dato del README está desactualizado, no asumas que existe suite de tests.

## Discrepancias conocidas con el README

El `README.md` de la raíz describe el estado *planeado* del proyecto y quedó desactualizado en varios puntos observados en el código real:
- Dice Material UI en el stack — el frontend usa Tailwind, no MUI.
- Marca "Pruebas: Completado" — no hay proyecto de tests en la solución.
- No menciona el concepto de `Proyecto` (multi-tenant), que es el eje central del modelo de datos actual.

Si necesitas contexto de negocio/roadmap, el README sirve como visión general y contexto académico (práctica profesional en SYC), pero para el estado técnico real confía en el código y en este archivo.
