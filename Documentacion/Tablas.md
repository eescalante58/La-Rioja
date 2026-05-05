### Tabla: `public.companies`

**Descripción:** Empresas/tenants. Contiene la configuración base por empresa.

| Columna           | Tipo de Datos              | Comentario                                            |
| :---------------- | :------------------------- | ----------------------------------------------------- |
| `company_id`      | `bigint`                   | Identificador único de la empresa (Auto-incremental). |
| `created_at`      | `timestamp with time zone` | Fecha y hora de creación del registro.                |
| `company_name`    | `text`                     | Nombre legal o comercial de la empresa.               |
| `phone_code_area` | `text`                     | Código de área telefónico (ej: 503).                  |
| `phone_number`    | `text`                     | Número de teléfono de contacto.                       |
| `updated_at`      | `timestamp with time zone` | Fecha y hora de la última actualización.              |
| `web_site`        | `text`                     | Sitio web de la empresa (URL).                        |

**Notas adicionales:**

- **Clave Primaria:** `company_id`.
- **Relaciones:** Esta tabla es referenciada por las tablas `events` y `user_companies` mediante llaves foráneas.
- **Seguridad:** Tiene habilitado el sistema de Row Level Security (RLS).

### Tabla: public.students

**Descripción:** Alumnos que participan en los eventos de Bingo.

| Columna       | Tipo de Datos            | Comentario                              |
| :------------ | :----------------------- | :-------------------------------------- |
| id            | bigint                   | Identificador único del registro (PK).  |
| company_id    | bigint                   | Identificador de la empresa.            |
| event_id      | citext                   | Identificador del evento.               |
| student_id    | integer                  | Número identificador del alumno.        |
| student_name  | text                     | Nombre completo del alumno.             |
| student_level | student_level_enum       | Nivel educativo o categoría del alumno. |
| created_at    | timestamp with time zone | Fecha de creación del registro.         |
| updated_at    | timestamp with time zone | Fecha de última actualización.          |

**Notas adicionales:**

- **Clave Primaria:** id.
- **Relaciones:** Vinculada a events por company_id y event_id.

### Tabla: public.students_cards

**Descripción:** Cartones asignados a los estudiantes para su venta.

| Columna     | Tipo de Datos            | Comentario                                   |
| :---------- | :----------------------- | :------------------------------------------- |
| id          | bigint                   | Identificador único del registro (PK).       |
| company_id  | bigint                   | Identificador de la empresa.                 |
| event_id    | citext                   | Identificador del evento.                    |
| student_id  | integer                  | ID del alumno al que se le asigna el cartón. |
| card_number | bigint                   | Número del cartón asignado.                  |
| created_at  | timestamp with time zone | Fecha de asignación.                         |
| updated_at  | timestamp with time zone | Fecha de última actualización.               |

**Notas adicionales:**

- **Clave Primaria:** id.
- **Relaciones:** Vincula alumnos (students) con cartones (cards).

### Tabla: public.roles

**Descripción:** Catálogo de roles con nivel/jerarquía y estado.

| Columna     | Tipo de Datos            | Comentario                                       |
| :---------- | :----------------------- | :----------------------------------------------- |
| role_id     | bigint                   | Identificador único del rol (PK).                |
| name        | text                     | Nombre descriptivo del rol (admin, ventas, etc). |
| description | text                     | Descripción de las responsabilidades del rol.    |
| level       | integer                  | Nivel de jerarquía para control de permisos.     |
| is_active   | boolean                  | Estado de activación del rol.                    |
| created_at  | timestamp with time zone | Fecha de creación.                               |
| updated_at  | timestamp with time zone | Fecha de última actualización.                   |

### Tabla: public.users

**Descripción:** Perfil de usuarios (nombre, email, estado, rol y metadata).

| Columna    | Tipo de Datos            | Comentario                                         |
| :--------- | :----------------------- | :------------------------------------------------- |
| id         | uuid                     | Identificador único del usuario (FK a auth.users). |
| full_name  | text                     | Nombre completo del usuario.                       |
| email      | text                     | Correo electrónico institucional.                  |
| phone      | text                     | Número de teléfono de contacto.                    |
| role_id    | bigint                   | ID del rol principal asignado.                     |
| status     | text                     | Estado de la cuenta (active, inactive).            |
| avatar_url | text                     | URL de la imagen de perfil.                        |
| metadata   | jsonb                    | Información adicional en formato JSON.             |
| created_at | timestamp with time zone | Fecha de registro.                                 |
| updated_at | timestamp with time zone | Fecha de última actualización.                     |
| last_login | timestamp with time zone | Fecha del último acceso al sistema.                |

### Tabla: public.user_companies

**Descripción:** Relación usuario-compañía y rol dentro de la compañía.

| Columna    | Tipo de Datos            | Comentario                                        |
| :--------- | :----------------------- | :------------------------------------------------ |
| user_id    | uuid                     | ID del usuario (PK/FK).                           |
| company_id | bigint                   | ID de la empresa (PK/FK).                         |
| role       | text                     | Nombre del rol dentro de esta empresa específica. |
| role_id    | bigint                   | ID técnico del rol asignado.                      |
| created_at | timestamp with time zone | Fecha de vinculación.                             |
| updated_at | timestamp with time zone | Fecha de última actualización.                    |

**Notas adicionales:**

- **Relaciones:** Permite que un usuario pertenezca a múltiples empresas con roles potencialmente diferentes.
- **Seguridad:** Es la base para el filtrado por RLS en todo el sistema.
