# Spec Delta

## MODIFIED Requirements

### Requirement: Carga inicial optimizada y desacoplada de pestañas
El sistema SHALL cargar inicialmente los datos de la pestaña activa de forma síncrona según los parámetros de la URL sin saltos visuales en el montaje, y SHALL pre-cargar en segundo plano (*Background Prefetching*) los datos y componentes de las pestañas secundarias (*FAQ*, *Galería*, *Meta Pixel* y *Google Ads*) en tiempos ociosos del cliente, garantizando que el cambio entre pestañas sea instantáneo y sin destellos estroboscópicos.

#### Scenario: Acceso directo a Gestión CMS
- **WHEN** un usuario con permisos administrativos hace clic en "Gestión CMS" o accede a `/admin/cms`
- **THEN** el servidor recupera de forma paralela únicamente el contenido necesario para la pestaña inicial de contenido
- **AND** en segundo plano (idle time) el cliente pre-obtiene en memoria los datos de FAQ, Galería, Meta Pixel y Google Ads sin bloquear la interacción inicial

#### Scenario: Activación de pestaña secundaria
- **WHEN** el usuario hace clic en la pestaña "Preguntas Frecuentes (FAQ)", "Galería de Fotos", "Meta Pixel" o "Google Ads"
- **THEN** el sistema despliega de forma inmediata (0 ms) el componente y sus datos precargados con una transición suave de opacidad sin mostrar esqueletos oscuros en cascada

### Requirement: Esqueleto de carga visual inmediato
El sistema SHALL presentar un esqueleto de carga semántico (*Skeleton UI*) de forma suave y atenuada mientras el servidor procesa la respuesta de `/admin/cms`, evitando destellos de alto contraste en cargas rápidas.

#### Scenario: Visualización durante navegación
- **WHEN** el usuario transiciona hacia `/admin/cms` desde cualquier otra sección del panel de administración
- **THEN** el cliente muestra inmediatamente el componente `loading.tsx` con atenuación visual gradual sin contrastes agresivos
- **AND** el esqueleto se reemplaza de forma fluida por la tabla con datos en cuanto la respuesta está lista
