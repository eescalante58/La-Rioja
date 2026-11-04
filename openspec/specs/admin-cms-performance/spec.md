# admin-cms-performance Specification

## Purpose
Define el comportamiento de rendimiento, carga diferida bajo demanda, indexación en base de datos y respuesta interactiva ágil en el módulo administrativo de Gestión CMS (/admin/cms).

## Requirements

### Requirement: Carga inicial optimizada y desacoplada de pestañas
El sistema SHALL cargar únicamente los datos de la pestaña inicial activa (*Contenido General*) durante la navegación inicial a `/admin/cms`, postergando la carga de datos y componentes pesados de las pestañas secundarias (*FAQ*, *Galería*, *Meta Pixel* y *Google Ads*) hasta que el usuario las seleccione explícitamente.

#### Scenario: Acceso directo a Gestión CMS
- **WHEN** un usuario con permisos administrativos hace clic en "Gestión CMS" o accede a `/admin/cms`
- **THEN** el servidor recupera de forma paralela únicamente el contenido necesario para la pestaña inicial de contenido
- **AND** los paneles de FAQ, Galería, Meta Pixel y Google Ads no ejecutan consultas de inicialización bloqueantes antes de mostrar la pantalla inicial

#### Scenario: Activación de pestaña secundaria
- **WHEN** el usuario hace clic en la pestaña "Preguntas Frecuentes (FAQ)", "Galería de Fotos", "Meta Pixel" o "Google Ads"
- **THEN** el sistema carga dinámicamente el componente de la pestaña y obtiene sus datos específicos bajo demanda con un indicador visual de carga

### Requirement: Índices de soporte en base de datos
La base de datos SHALL contar con índices B-Tree especializados para las operaciones de ordenamiento y filtrado de las tablas de soporte del CMS (`site_content`, `faqs`, `faq_sections`, `event_gallery`), reduciendo los costos de ejecución de consultas y evitando ordenamientos en memoria.

#### Scenario: Consulta de preguntas frecuentes con sección
- **WHEN** el módulo de CMS o la página pública consulta las preguntas frecuentes vinculadas a su sección
- **THEN** la base de datos resuelve el JOIN sobre `faqs.section_id` y el orden `content_order` mediante índices B-Tree sin realizar escaneos secuenciales

#### Scenario: Consulta de galería y orden administrativo
- **WHEN** se consulta el listado de imágenes de la galería o las secciones de `site_content`
- **THEN** Postgres utiliza los índices `created_at DESC` en `event_gallery` y `(page, section_key, content_order)` en `site_content` para resolver el ordenamiento

### Requirement: Paginación y estabilidad de filtros en la tabla del CMS
La tabla de secciones del CMS SHALL implementar paginación en cliente para limitar el número de filas activas en el DOM a bloques de 15 o 20 registros, y SHALL aplicar filtros de búsqueda sin provocar recargas de ruta completas.

#### Scenario: Navegación de páginas en el listado
- **WHEN** el usuario visualiza el catálogo de secciones con más de 20 resultados
- **THEN** la tabla muestra los primeros 20 elementos y controles de navegación de página
- **AND** al cambiar de página se muestran los siguientes elementos de forma instantánea sin salto de scroll ni petición al servidor

#### Scenario: Búsqueda y filtrado sin recarga de ruta
- **WHEN** el usuario escribe en el campo de búsqueda o cambia el filtro de página/estado
- **THEN** el filtrado se evalúa de manera inmediata en la memoria del cliente
- **AND** la URL se actualiza de forma fluida sin reiniciar la renderización del servidor ni causar jitter visual

### Requirement: Esqueleto de carga visual inmediato
El sistema SHALL presentar un esqueleto de carga semántico (*Skeleton UI*) de forma inmediata mientras el servidor procesa la respuesta de `/admin/cms`.

#### Scenario: Visualización durante navegación
- **WHEN** el usuario transiciona hacia `/admin/cms` desde cualquier otra sección del panel de administración
- **THEN** el cliente muestra inmediatamente el componente `loading.tsx` con la estructura visual de las pestañas y la tabla
- **AND** el esqueleto se reemplaza de forma fluida por la tabla con datos en cuanto la respuesta está lista
