# Plan de Implementación: Módulo de Community Manager

El objetivo es permitir que un Community Manager cree, programe y publique contenido en múltiples redes sociales (Facebook, Instagram, X) y WhatsApp desde un único panel centralizado.

## 1. Arquitectura de Datos (Supabase)

Necesitaremos nuevas tablas para gestionar las publicaciones y las conexiones:

- **`social_accounts`**: Almacenará los tokens de acceso y perfiles conectados (Facebook Page ID, Instagram Business ID, etc.).
- **`social_posts`**:
  - `content`: Texto de la publicación.
  - `media_urls`: Array de URLs de imágenes/videos (usando el bucket `cms_images`).
  - `platforms`: Lista de redes donde se publicará.
  - `scheduled_at`: Fecha y hora programada.
  - `status`: `draft`, `scheduled`, `published`, `failed`.
- **`social_logs`**: Historial detallado de cada intento de publicación y su respuesta.

## 2. Integraciones de API

Para evitar la complejidad de integrar cada red social por separado, recomiendo dos caminos:

- **Opción A (Recomendada):** Usar un agregador como **Ayrshare** o **Buffer API**. Permite enviar a todas las redes con una sola llamada API.
- **Opción B (Directa):** Meta Graph API (FB/IG) y X API. Requiere más mantenimiento pero es gratuito (según volúmenes).

## 3. Interfaz de Usuario (UI/UX)

Siguiendo el estilo minimalista actual en `/admin`:

### A. Dashboard de Community (`/admin/community`)

- **Calendario de Contenidos:** Vista mensual/semanal de publicaciones programadas.
- **Estado de Conexiones:** Indicadores de si las cuentas de redes sociales están activas o requieren re-autenticación.

### B. Creador de Publicaciones (Compositor)

- **Editor de Texto:** Con contador de caracteres dinámico (especialmente para X).
- **Selector de Media:** Integración con el sistema de carga de imágenes que ya optimizamos.
- **Multi-Preview:** Pestañas para previsualizar cómo se verá el post en Facebook vs Instagram vs X.

### C. Programación y Envío

- **Botón "Publicar Ahora":** Envío inmediato.
- **Selector de Fecha/Hora:** Para programación futura.

## 4. Automatización (Backend)

- **Supabase Edge Functions:** Una función que se ejecute cada 5-10 minutos (vía `pg_cron` de Supabase) para revisar si hay posts en estado `scheduled` cuya fecha haya llegado, y disparar el envío a las APIs correspondientes.

## 5. Fases de Desarrollo Sugeridas

- **Fase 1 (MVP):** Crear el panel de control y la capacidad de enviar mensajes de texto y una imagen a una sola red (ej. Facebook) de forma inmediata.
- **Fase 2:** Incorporar el soporte multi-red y la previsualización en tiempo real.
- **Fase 3:** Implementar el sistema de programación (scheduling) y el historial de envíos (similar al que hicimos para WhatsApp).
- **Fase 4:** Dashboard de métricas básicas (likes, shares) consultando las APIs de las redes.
