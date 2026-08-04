# <div align="center"> Sistema de Gestión de Solicitudes  </div>
# <div align="center"> SGDS </div>
        

> Proyecto práctico desarrollado como parte de la ruta de aprendizaje **U-Casual de SYC**, orientado a la aplicación de conocimientos técnicos, implementación del StackTec de la organización, de manera que se pueda replicar un sistema web con arquitectura modular y configurable, semejante a los proyectos en PCC de SYC.
---

## Tabla de Contenido 
- [Descripción] (#-descripción)
- [Propósito] (#-propósito)

---

## 📌 Descripción

**SGDS (Sistema de Gestión de Solicitudes)** es un proyecto práctico de aprendizaje cuyo propósito es desarrollar un sistema web orientado a la gestión integral de solicitudes, expedientes y flujos de aprobación.

El proyecto surge a partir del análisis de diferentes soluciones y procesos observados durante la etapa de inducción a los proyectos y servicios de SYC, identificando elementos comunes como:

* Gestión de usuarios.
* Gestión documental.
* Radicación de solicitudes.
* Expedientes digitales.
* Flujos de aprobación.
* Auditoría.
* Reportes.
* Trazabilidad.
* Seguridad de la información.

A partir de estos elementos se plantea una solución modular y configurable que permita representar procesos administrativos de diferentes características, con una arquitectura preparada para evolucionar hacia una solución reutilizable.


---

## 🎯 Propósito

El propósito principal es aplicar de manera práctica los conocimientos adquiridos durante la ruta de aprendizaje de la **U-Casual**, junto con los conocimientos adquiridos en la Universidad, acercando el proceso formativo a un escenario de desarrollo de software empresarial.

El proyecto busca especialmente:

* Adoptar progresivamente tecnologías utilizadas en el entorno de desarrollo de SYC.
* Aplicar buenas prácticas de ingeniería de software.
* Comprender el desarrollo de una solución desde su diseño hasta su implementación.
* Fortalecer las competencias necesarias para la incorporación posterior a una célula de trabajo.
* Experimentar con una arquitectura modular.

---

## 🏗️ Arquitectura

El proyecto será desarrollado utilizando una **arquitectura en capas**, buscando mantener una adecuada separación de responsabilidades entre los diferentes componentes de la aplicación.

La estructura propuesta contempla:

```text
┌─────────────────────────────────────┐
│          Capa de Presentación       │
│        ASP.NET Core Web API         │
├─────────────────────────────────────┤
│           Capa de Negocio           │
│      Servicios / Reglas de negocio  │
├─────────────────────────────────────┤
│       Capa de Acceso a Datos        │
│     Entity Framework Core / ORM     │
├─────────────────────────────────────┤
│          Base de Datos              │
│             PostgreSQL              │
└─────────────────────────────────────┘
```

La arquitectura podrá evolucionar durante el desarrollo conforme se definan los requerimientos, componentes y necesidades técnicas del proyecto.

---

## 🛠️ Stack tecnológico

### Backend

|                                                                                                       |                                                                                                               |                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/entityframeworkcore/entityframeworkcore-original.svg" width="50"/> |
| **C#**                                                                                                | **ASP.NET Core**                                                                                              | **Entity Framework Core**                                                                                                       |


### Frontend

|                                                                                                     |                                                                                                               |                                                                                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/materialui/materialui-original.svg" width="50"/> |
| **React**                                                                                           | **TypeScript**                                                                                                | **Material UI**                                                                                               |


> El frontend se encuentra contemplado dentro del alcance del proyecto y será incorporado durante las siguientes fases de desarrollo.

### Base de datos

|                                                                                                               |                |
| ------------------------------------------------------------------------------------------------------------- | -------------- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="50"/> | **PostgreSQL** |



### DevOps & Herramientas

| | | | | |
|:---:|:---:|:---:|:---:|:---:|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azuredevops/azuredevops-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/podman/podman-original.svg" width="50"/> |
| **Git** | **GitHub** | **Azure DevOps** | **Docker** | **Podman** |


### API & Testing

|                                                                                                         |                                                                                                         |         |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------- |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swagger/swagger-original.svg" width="50"/> | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg" width="50"/> | 🔐      |
| **Swagger**                                                                                             | **Postman**                                                                                             | **JWT** |



### Inteligencia Artificial

Se contempla como componente adicional la incorporación de funcionalidades de Inteligencia Artificial orientadas a:

* Análisis documental.
* Resumen de expedientes.
* Clasificación de solicitudes.
* Detección de documentación faltante.
* Generación de respuestas sugeridas.
* Asistencia conversacional.

La implementación de estas funcionalidades dependerá del avance del proyecto, el tiempo disponible y el nivel de conocimiento alcanzado durante la ruta de aprendizaje.

---

# 📦 Módulos funcionales

El sistema contempla inicialmente los siguientes módulos:

### 🔐 Autenticación

* Inicio de sesión.
* Roles.
* Permisos.
* Recuperación de contraseña.

### 👥 Gestión de usuarios

* Crear usuarios.
* Editar usuarios.
* Activar / inactivar usuarios.
* Asignación de roles.

### 👤 Gestión de ciudadanos

* Registro.
* Consulta.
* Actualización.
* Historial.

### 🏢 Gestión de empresas

* Registro.
* Consulta.
* Actualización.

### 📄 Gestión de solicitudes

* Crear solicitud.
* Modificar solicitud.
* Adjuntar documentos.
* Consultar estado.

### 🗂️ Gestión documental

* Expedientes.
* Archivos PDF.
* Evidencias.
* Observaciones.

### 🔄 Workflow

El sistema contempla estados configurables para representar el ciclo de vida de una solicitud.

Ejemplo:

```text
RADICADA
    ↓
EN REVISIÓN
    ↓
PENDIENTE
    ↓
REQUIERE INFORMACIÓN
    ↓
EN REVISIÓN
    ↓
APROBADA / RECHAZADA
    ↓
FINALIZADA
```

### 📝 Auditoría

Se contempla el registro de:

* Usuario.
* Fecha.
* Acción.
* Módulo.
* Dirección IP.
* Historial de cambios.

### 📊 Dashboard

Indicadores orientados al seguimiento de la operación:

* Solicitudes por estado.
* Tiempo promedio de atención.
* Solicitudes creadas.
* Solicitudes finalizadas.
* Productividad.

### 📑 Reportes

* Exportación a Excel.
* Exportación a PDF.
* Estadísticas.

---

# 🚧 Estado actual del proyecto

El proyecto se encuentra actualmente en **fase de desarrollo del Backend**.

### Backend

| Componente              | Estado           |
| ----------------------- | ---------------- |
| Definición del proyecto | ✅ Completado    |
| Diseño inicial          | ✅ Completado    |
| ASP.NET Core            | ✅ Completado  |
| API REST                | 🟡 En desarrollo |
| Arquitectura en capas   | 🟡 En desarrollo |
| Entidades / modelos     | ✅ Completado    |
| Entity Framework Core   | ✅ Completado  |
| PostgreSQL              | ✅ Completado    |
| JWT                     | ⏳ Pendiente      |
| Swagger                 | 🟡 En desarrollo     |
| Pruebas                 | ⏳ Pendiente      |

### Frontend

| Componente          | Estado      |
| ------------------- | ----------- |
| React               | ⏳ Pendiente |
| TypeScript          | ⏳ Pendiente |
| Material UI         | ⏳ Pendiente |
| Integración con API | ⏳ Pendiente |

### Componentes complementarios

| Componente              | Estado              |
| ----------------------- | ------------------- |
| Azure DevOps            | 🟡 En planificación |
| Docker / Podman         | ⏳ Pendiente         |
| Inteligencia Artificial | ⏳ Por evaluar       |
| Documentación técnica   | 🟡 En desarrollo    |

> Los estados del proyecto se actualizarán conforme avance la implementación.

---

# 📁 Estructura del proyecto

La estructura inicial del backend está orientada a mantener una separación clara de responsabilidades:

```text

```

> Esta estructura podrá evolucionar durante el desarrollo conforme se definan las necesidades de cada capa.

---

# 🚀 Instalación y ejecución

## Requisitos previos

Antes de ejecutar el proyecto se requiere tener instalado:

* .NET SDK compatible con la versión utilizada por el proyecto.
* Visual Studio 2022 o Visual Studio Code.
* Git.
* PostgreSQL *(cuando se incorpore la persistencia)*.

---

## Clonar el repositorio

```bash
git clone <https://github.com/MiguelV-SYC/ProyectoSYC_MAVA.git>
```

Ingresar al proyecto:

```bash
cd SIGES
```

---

## Restaurar dependencias

```bash
dotnet restore
```

---

## Compilar el proyecto

```bash
dotnet build
```

---

## Ejecutar el proyecto

```bash
dotnet run
```

Una vez iniciado, la API estará disponible en la dirección indicada por ASP.NET Core en la consola.

---

# 📚 Documentación de la API

La API será documentada mediante **Swagger / OpenAPI**.

Una vez habilitado Swagger, podrá utilizarse para:

* Consultar endpoints.
* Revisar modelos.
* Ejecutar solicitudes.
* Validar respuestas.
* Facilitar el consumo de la API durante el desarrollo del frontend.

---

# 🧪 Pruebas

El proyecto contempla la implementación progresiva de pruebas para validar el comportamiento de los componentes desarrollados.

Se consideran:

* Pruebas unitarias.
* Pruebas de integración.
* Pruebas de endpoints mediante Postman.

La estrategia de pruebas será definida conforme avance el desarrollo del backend.

---

# 📋 Gestión del proyecto

La planificación y seguimiento del proyecto se realizará mediante **Azure DevOps**, utilizando elementos como:

* Backlog.
* Historias de usuario.
* Tareas.
* Sprints.
* Seguimiento del avance.
* Registro de incidencias.

El objetivo es aproximar el desarrollo a una dinámica de trabajo colaborativa y organizada.

---

# 📐 Documentación del proyecto

La documentación contempla progresivamente:

* Documento de propuesta.
* Requerimientos.
* Historias de usuario.
* Diagrama de casos de uso.
* Diagrama entidad-relación.
* Diagrama de arquitectura.
* Diagramas de flujo.
* Diagramas de secuencia.
* Documentación de API.
* Manual técnico.
* Manual de usuario.

---

# 🗺️ Roadmap

```text
FASE 1
Definición y arquitectura
        ↓
FASE 2
Backend / API REST
        ↓
FASE 3
Base de datos
        ↓
FASE 4
Autenticación y autorización
        ↓
FASE 5
Frontend
        ↓
FASE 6
Integración
        ↓
FASE 7
Pruebas y calidad
        ↓
FASE 8
IA / funcionalidades adicionales
        ↓
FASE 9
Documentación y presentación
```

---

# 🎓 Contexto académico y profesional

SGDS se desarrolla como parte de la ruta de aprendizaje **U-Casual de SYC**, dentro del proceso de formación previo a la asignación a una célula de trabajo.

El proyecto busca servir como ejercicio práctico para:

* Aplicar conocimientos adquiridos durante la ruta de aprendizaje.
* Adoptar progresivamente el stack tecnológico de la organización.
* Comprender el desarrollo de soluciones empresariales.
* Fortalecer competencias de ingeniería de software.
* Facilitar la transición hacia un proyecto real dentro de la compañía.

El diferencial del proyecto no se encuentra en competir con las soluciones existentes de SYC, sino en utilizar el ejercicio como un espacio de aprendizaje práctico orientado a desarrollar una solución con tecnologías, arquitectura y prácticas cercanas a un entorno empresarial.

---

# 📄 Licencia

Proyecto desarrollado con fines académicos y de formación profesional dentro del contexto de la ruta de aprendizaje U-Casual.

---

## 👨‍💻 Autor

**Miguel Angel Villamizar Ardila**

Estudiante de Ingeniería de Sistemas
Universidad Cooperativa de Colombia — Bucaramanga

Proyecto desarrollado durante la práctica profesional en **SYC**.
