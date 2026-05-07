### Tabla: `public.companies`

**Descripción:** Empresas/tenants. Contiene la configuración base por empresa.Fondo Desvanecido: Se ha añadido un gradiente lineal (bg-gradient-to-br) que utiliza los tres colores institucionales: Azul La Rioja, Verde La Rioja y Amarillo La Rioja.
Opacidad Suave: Las intensidades se ajustaron para que el fondo sea sutil (faded), permitiendo que el texto siga siendo perfectamente legible.
Efectos Visuales: Se mejoró la sombra al pasar el mouse (hover:shadow-lg) y se añadió una transición suave para una mejor experiencia de usuario.

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

### Tabla: `public.cards`

**Descripción:** Tabla de cartones de bingo asociados a eventos.

| Columna               | Tipo de Datos              | Comentario                                     |
| :-------------------- | :------------------------- | :--------------------------------------------- |
| `id`                  | `bigint`                   | Identificador único del cartón (PK).           |
| `company_id`          | `bigint`                   | ID de la empresa a la que pertenece el cartón. |
| `event_id`            | `citext`                   | ID del evento asociado.                        |
| `card_number`         | `bigint`                   | Número impreso en el cartón.                   |
| `card_type`           | `card_type_enum`           | Tipo de cartón (Físico, Virtual).              |
| `card_status`         | `card_status_enum`         | Estado (Disponible, Asignado, Vendido, etc).   |
| `card_price`          | `numeric`                  | Precio base o costo del cartón.                |
| `sales_price`         | `numeric`                  | Precio de venta final.                         |
| `image_url`           | `text`                     | URL del PDF o imagen del cartón.               |
| `invoice_number`      | `citext`                   | Número de factura relacionada.                 |
| `sold_by`             | `text`                     | Nombre de quién realizó la venta.              |
| `player_name`         | `text`                     | Nombre del jugador/comprador.                  |
| `player_phone_number` | `text`                     | Teléfono del jugador.                          |
| `player_email`        | `text`                     | Email del jugador.                             |
| `prize`               | `text`                     | Descripción del premio si resultó ganador.     |
| `comment`             | `text`                     | Observaciones adicionales.                     |
| `created_at`          | `timestamp with time zone` | Fecha de creación.                             |
| `updated_at`          | `timestamp with time zone` | Fecha de última actualización.                 |

**Notas adicionales:**

- **Relaciones:** Vinculada a `events` y `invoices`.

### Tabla: `public.invoices`

**Descripción:** Facturas/comprobantes de venta de cartones.

| Columna                 | Tipo de Datos              | Comentario                                |
| :---------------------- | :------------------------- | :---------------------------------------- |
| `id`                    | `uuid`                     | Identificador único de la factura (PK).   |
| `company_id`            | `bigint`                   | ID de la empresa.                         |
| `invoice_number`        | `citext`                   | Número correlativo de factura.            |
| `invoice_date`          | `date`                     | Fecha de emisión.                         |
| `customer_name`         | `text`                     | Nombre del cliente.                       |
| `phone_area`            | `text`                     | Código de área telefónica.                |
| `phone_number`          | `text`                     | Número de teléfono.                       |
| `whatsapp_number`       | `text`                     | Número de WhatsApp.                       |
| `customer_email`        | `text`                     | Correo electrónico del cliente.           |
| `cards_number`          | `integer`                  | Cantidad de cartones comprados.           |
| `card_price`            | `numeric`                  | Precio por cartón en esta venta.          |
| `total_amount`          | `numeric`                  | Monto total de la factura.                |
| `event_id`              | `citext`                   | ID del evento asociado.                   |
| `payment_method`        | `payment_method_enum`      | Método de pago utilizado.                 |
| `status`                | `invoice_status_enum`      | Estado (pendiente, pagada, etc).          |
| `manager_name`          | `text`                     | Nombre del administrador que la generó.   |
| `send_whatsapp_message` | `text`                     | Estado/Log del último envío por WhatsApp. |
| `created_at`            | `timestamp with time zone` | Fecha de creación.                        |
| `updated_at`            | `timestamp with time zone` | Fecha de última actualización.            |
