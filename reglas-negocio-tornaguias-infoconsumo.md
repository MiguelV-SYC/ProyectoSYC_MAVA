# Reglas de Negocio — Tornaguías (Infoconsumo)

**Alcance:** Este documento estructura las reglas de negocio para la entidad `Solicitud` de tipo Infoconsumo (tornaguías), de forma que backend y frontend consuman la misma fuente de verdad. Referencia cruzada con `Requerimientos_SGDS.md` (RF-13 a RF-19) y con las vistas ya diseñadas (`infoconsumo-nueva-solicitud.html`, `infoconsumo-detalle-solicitud.html`, `infoconsumo-kanban.html`).

---

## 1. Catálogo de tipos de trámite

Cada tipo de tornaguía es un valor fijo de `TipoSolicitud` dentro del proyecto Infoconsumo. La tabla resume propósito, cuándo se usa, y **si origen y destino deben ser iguales o diferentes** (regla que dispara la validación de la sección 2.1).

| Tipo | Propósito | Cuándo se usa | Origen vs. Destino |
|---|---|---|---|
| **Movilización** | Autoriza el transporte desde planta/aduana hasta el departamento de distribución y consumo | Productor nacional o importador despacha hacia un distribuidor en otro departamento | **Obligatoriamente diferentes** |
| **Reenvío** | Autoriza trasladar mercancía ya declarada para consumo en el departamento de origen | Distribuidor con sobrestock traslada legalmente entre sucursales de distintos departamentos, evitando doble tributación | **Obligatoriamente diferentes** |
| **Tránsito** | Autoriza que la carga solo "pase de paso" por un departamento intermedio, sin comercializarse allí | La ruta física cruza departamentos intermedios antes del destino final | Origen y destino final son diferentes; el departamento intermedio se registra aparte (ver 2.1) |
| **Tránsito local** | Controla movimiento dentro de un mismo departamento/distrito | Traslado entre bodegas propias del mismo distribuidor, mismo territorio | **Obligatoriamente iguales** |
| **Tránsito declarado** | Registra movilización ya declarada en aduana, bajo control estricto hasta destino final | Cargamentos importados que salen de puerto/zona franca bajo régimen aduanero específico | Diferentes (puerto/zona franca → depósito de destino) |

---

## 2. Validaciones críticas (bloqueantes)

Estas reglas deben aplicarse **tanto en backend (Application layer) como en frontend** (deshabilitar campos / mostrar error antes de enviar), para no depender solo de la validación del servidor.

### 2.1 Coherencia Origen/Destino según tipo
- Si `TipoTramite == "Tránsito local"` → el sistema **fuerza** `DepartamentoOrigen == DepartamentoDestino` (autocompletar destino al elegir origen, o bloquear el campo).
- Si `TipoTramite ∈ {"Movilización", "Reenvío"}` → el sistema **rechaza** el formulario si `DepartamentoOrigen == DepartamentoDestino`.
- Para "Tránsito" y "Tránsito declarado": origen ≠ destino final; **evaluar si se necesita un campo adicional `DepartamentosIntermedios` (multi-selección)** para registrar los departamentos que solo se cruzan — esto no estaba en el diseño original y conviene confirmarlo con el equipo antes de construirlo.

### 2.2 Placa y transportador — control de doble asignación
- Antes de radicar, el sistema valida `(Placa, NIT_Transportador)` contra las tornaguías **activas y no finalizadas** (estados `Aprobada/Expedida`, no `Legalizada` ni `Vencida`).
- Si ese vehículo ya tiene una tornaguía activa **dentro del mismo rango de horas** que la vigencia calculada de la nueva (ver 2.4), el sistema **bloquea la radicación** y muestra el conflicto (ID de la tornaguía en conflicto, para que el operador decida).
- Esto requiere una consulta de solapamiento de rangos de fecha/hora sobre `Placa` + `NIT_Transportador`, no solo una unicidad simple.

---

## 3. Máquina de estados (ciclo de vida)

Reemplaza el conjunto genérico de 7 estados del workflow común (RF-17) **solo para Infoconsumo** — esto es una excepción al workflow estándar de la plataforma y debe quedar explícito en el código, no asumido.

```
Elaborada/Radicada → Aprobada/Expedida → Legalizada
                                       ↘ Vencida (si no se legaliza a tiempo)
```

| Estado | Quién lo dispara | Efecto |
|---|---|---|
| **Elaborada/Radicada** | Contribuyente (formulario) | Estado inicial, análogo a "Radicada" del workflow común |
| **Aprobada/Expedida** | Funcionario de rentas, tras verificar pagos/cupos | Genera **código QR único nacional** — este es el momento de generar el documento exportable (ver `infoconsumo-tornaguia-documento.html`) |
| **Legalizada** | Funcionario del departamento **receptor**, al confirmar físicamente la carga en destino | Cierra el ciclo de control vial. **Nota de diseño:** esto implica que un segundo funcionario, en otro departamento, necesita acceso a esta solicitud para legalizarla — revisar si el modelo de permisos actual (`UsuarioProyecto`) cubre este caso o si se necesita un mecanismo de "acceso cruzado" entre operadores de distintos departamentos dentro del mismo proyecto |
| **Vencida** | Sistema, automático (ver 3.1) | Requiere justificación o reexpedición |

### 3.1 Vencimiento automático
- Cada tornaguía tiene una `FechaVigenciaLimite`, calculada según distancia vial origen–destino (ver 3.2).
- Un proceso programado (job/cron) debe revisar tornaguías en estado `Aprobada/Expedida` cuya `FechaVigenciaLimite` ya pasó, y marcarlas `Vencida` automáticamente.
- Al quedar `Vencida`, el sistema debe habilitar una acción de **"Justificar" o "Reexpedir"** — no está definido en el diseño actual qué datos pide esa justificación; queda pendiente de definir con el equipo SYC.

### 3.2 Cálculo de vigencia (pendiente de fórmula exacta)
- La vigencia se expresa en horas o días, **en función de la distancia vial** entre origen y destino.
- **Falta definir:** la tabla o fórmula de distancias (¿tabla fija por par de departamentos? ¿integración con API de rutas?). Esto es un insumo que debe salir de la Secretaría de Hacienda o de un catálogo interno — no se puede inventar en el frontend.

---

## 4. Cálculo automático de unidades totales

- El formulario captura `Cantidad` (ej. 480 cajas) como valor libre.
- El sistema debe multiplicar `Cantidad × PresentaciónUnitaria`, donde `PresentaciónUnitaria` sale de un **catálogo maestro de producto** (ej. caja de 12 botellas × 750 cc), no de un campo editable por el operador.
- Resultado: `UnidadesTotales` (en mililitros o unidades fiscales de cigarrillos según categoría).
- **Implicación de diseño:** el formulario actual (`infoconsumo-nueva-solicitud.html`) tiene "Cantidad" y "Unidades totales" como dos campos separados editables — según esta regla, **`UnidadesTotales` debería ser un campo calculado y de solo lectura**, no digitado. Esto requiere el catálogo maestro de producto (marca, presentación, unidad) como una entidad nueva, o al menos una tabla de referencia por categoría.

---

## 5. Resumen de campos nuevos o modificados respecto al diseño actual

| Campo / Entidad | Estado actual en el diseño | Ajuste necesario |
|---|---|---|
| Estados de Solicitud (Infoconsumo) | Usa los 7 estados genéricos de la plataforma | Reemplazar por la máquina de estados de la sección 3, exclusiva de Infoconsumo |
| `UnidadesTotales` | Campo de texto libre en el formulario | Volverlo calculado (solo lectura), derivado de `Cantidad × PresentaciónUnitaria` |
| Validación Origen/Destino | No implementada en el mockup | Agregar regla condicional por tipo de trámite (sección 2.1) |
| Validación Placa/Transportador | No implementada | Agregar consulta de solapamiento antes de permitir radicar |
| `FechaVigenciaLimite` | No existe en el diseño actual | Nuevo campo calculado al momento de expedir |
| Legalización por funcionario receptor | No contemplado en el modelo de permisos actual | Definir si requiere acceso cruzado entre operadores de distintos departamentos |
| Catálogo maestro de producto | No existe | Nueva entidad de referencia (marca, presentación, unidad) |
| `DepartamentosIntermedios` (Tránsito) | No existe | Evaluar si se necesita como campo adicional |

---

## 6. Cómo usar este documento

- **En el chat de backend:** cada sección (2, 3, 4) es una unidad de trabajo independiente — validaciones, máquina de estados, y cálculo de unidades pueden implementarse por separado en la capa `Application`.
- **En el chat de frontend:** la sección 5 es la lista de cambios pendientes sobre las vistas ya construidas. Los puntos marcados como "pendiente de definir" (3.1, 3.2, 2.1 intermedios) no deberían bloquear el resto del desarrollo — se pueden dejar como TODO explícitos en el código.
