# Manual de Usuario — Configuración del Sistema

Manual de uso de la sección **Configuración** del panel de administración (`/admin/settings`). Desde aquí se gestionan las tablas maestras, los usuarios, la seguridad y los parámetros globales de la plataforma.

> **Acceso:** menú lateral → **Configuración**. Las opciones visibles dependen del rol del usuario; algunas están restringidas al administrador global o al Super Admin.

## 1. Pantalla principal

Al entrar se muestran tarjetas con las opciones disponibles. Cada tarjeta lleva un ícono, un título y una descripción breve; al hacer clic se abre el módulo correspondiente.

| Opción | Para qué sirve |
| :----- | :------------- |
| Códigos de Países | Prefijos telefónicos para envíos de WhatsApp |
| Usuarios y Roles | Accesos, perfiles y permisos por empresa |
| Empresas | Entidades multi-empresa del sistema |
| Alumnos | Registro maestro de estudiantes y sus niveles |
| Seguridad | Políticas globales y auditoría de seguridad |
| Auditoría | Registro de actividades del sistema |
| Límites de Registro | Control anti-abuso del registro público |
| Mensajes de Contacto | Solicitudes del formulario web público |
| Crear Datos de Backup/Prueba | Copia de datos entre eventos (Super Admin) |
| Manual Técnico | Documentación de arquitectura y base de datos |
| Manual de Usuario | Esta guía |

---

## 2. Códigos de Países

Administra el catálogo de prefijos telefónicos que se usan para armar los números de WhatsApp en facturas y mensajes promocionales.

### Funciones

- **Buscar**: filtra por nombre de país, prefijo o código ISO.
- **Agregar país**: registra nombre, códigos ISO2/ISO3, prefijo y emoji de bandera.
- **Editar / Eliminar**: cada fila tiene sus acciones; eliminar pide confirmación.
- **Exportar JSON / Exportar CSV**: descarga el catálogo completo.
- **Importar JSON o CSV**: carga masiva de países desde archivo (`.json` o `.csv`).

> Las exportaciones quedan registradas en la Auditoría.

---

## 3. Usuarios y Roles

Gestiona las cuentas de acceso al panel y los roles disponibles.

### Pestaña Usuarios

- **Buscar**: filtra por nombre o correo.
- **Nuevo usuario**: crea la cuenta con nombre, correo, teléfono, rol principal y avatar (foto de perfil).
- **Editar**: actualiza datos, rol y estado (activo/inactivo).
- **Empresas**: asigna a qué empresas pertenece el usuario y con qué rol en cada una — un mismo usuario puede tener roles distintos por empresa.
- **Eliminar**: pide confirmación.

### Pestaña Roles

- Catálogo de roles con nombre, descripción, **nivel de jerarquía** y estado activo.
- Crear, editar y eliminar roles (con confirmación).

> El **nivel** del rol determina qué ve y qué puede hacer el usuario (administrador, ventas, solo lectura, etc.).

---

## 4. Empresas

Administra las entidades (tenants) del sistema multi-empresa.

### Funciones

- Lista de empresas con sus datos de contacto.
- **Crear / editar empresa**: nombre, teléfono (código de área + número), sitio web.
- **Tiempo de sesión**: minutos de inactividad antes de cerrar la sesión de los usuarios de esa empresa.
- **Evento por defecto del dashboard**: evento que se muestra al entrar al panel.

---

## 5. Alumnos

Registro maestro de estudiantes que venden cartones en los eventos.

### Funciones

- **Selector de evento**: la lista muestra los alumnos del evento elegido.
- **Agregar / editar alumno**: número de alumno, nombre completo y nivel.
- **Asignación de cartones**: desde la fila del alumno se asignan los cartones que venderá.
- **Detalle de factura**: consulta las facturas generadas por los cartones del alumno.
- **Informe de no vendidos**: reporte de cartones asignados aún no vendidos.
- **Exportar / importar**: descarga o carga masiva de alumnos en JSON o CSV.

> La asignación alumno-cartón es lo que muestra el nombre y nivel del alumno en la columna "Jugador" del inventario.

---

## 6. Seguridad

Panel de **solo consulta** que audita la configuración de seguridad de la base de datos.

### Secciones

- **Alertas de Seguridad**: advertencias activas que requieren atención.
- **RLS por Tabla**: estado del Row Level Security en cada tabla y sus políticas.
- **Seguridad en Vistas**: políticas aplicadas a las vistas de la base de datos.
- **Recomendaciones Globales**: buenas prácticas (menor privilegio, validación de esquema, monitoreo de logs).

> Esta pantalla no modifica nada; sirve para verificar que la protección de datos esté bien configurada.

---

## 7. Auditoría

Registro de actividades administrativas del sistema (qué usuario hizo qué, sobre qué entidad y cuándo).

### Funciones

- **Buscar**: filtra por acción, entidad o usuario.
- Cada fila muestra la acción realizada, la entidad afectada, el usuario y la fecha/hora, con el detalle del cambio en formato JSON.

> Las exportaciones de catálogos (países, alumnos) también quedan registradas aquí.

---

## 8. Límites de Registro

Controla la protección anti-abuso del formulario público `/registro` (donde los asistentes registran sus cartones durante el evento).

### Funciones

- **Modo normal**: límites estrictos (10 intentos/minuto, 40 cartones/día por IP, 30 por teléfono) — para el día a día.
- **Modo evento**: límites ampliados (500/minuto, 15,000/día por IP) — se activa durante el evento en vivo, porque los ~1,200 asistentes comparten la IP del venue.
- La pantalla explica qué hace cada límite y muestra la configuración vigente.

> **Importante:** activar el modo evento solo durante el evento y volver a modo normal al terminar.

---

## 9. Mensajes de Contacto

Bandeja de las solicitudes enviadas desde el formulario de contacto del sitio público (nombre, correo, teléfono, tipo de solicitud y mensaje).

---

## 10. Crear Datos de Backup/Prueba

Copia datos operativos de un evento a otro — útil para preparar ambientes de prueba o respaldos. **Solo Super Admin.**

### Funciones

- Selecciona **empresa**, evento **origen** y evento **destino**.
- Copia las tablas: **cartones**, **facturas**, **alumnos** y **asignaciones alumno-cartón**.
- **Validación previa**: verifica que el par origen/destino sea válido antes de copiar.
- Barra de progreso por tabla durante la copia, con detalle de errores si algo falla.
- **Eliminar una copia**: revierte los datos copiados a un evento destino.

---

## 11. Documentación

- **Manual Técnico**: arquitectura, base de datos, funciones y componentes (para el equipo técnico).
- **Manual de Usuario**: esta guía (para usuarios administradores).

---

## Tips generales

- **Búsquedas**: casi todas las pantallas tienen un campo de búsqueda que filtra la tabla al escribir — no requiere recargar.
- **Confirmaciones**: eliminar países, usuarios, roles o copias de datos siempre pide confirmación.
- **Auditoría**: las operaciones sensibles quedan registradas con usuario y fecha.
- **Permisos**: si una opción no aparece o no permite editar, el rol asignado no la incluye — consultar al administrador global.
