# Spec Delta: galeria-instalaciones

## ADDED Requirements

### Requirement: Capacidad ampliada de almacenamiento en galería de instalaciones
El sistema SHALL permitir registrar, almacenar y administrar hasta 60 elementos multimedia (imágenes, videos subidos directamente y videos de YouTube) en la galería institucional (`cl_instalaciones`), validando este límite en las acciones de subida, registro de video externo y reordenamiento atómico.

#### Scenario: Carga exitosa de elementos dentro del nuevo límite de 60
- **GIVEN** la galería de instalaciones cuenta con 55 elementos registrados
- **WHEN** el usuario sube 3 fotografías adicionales mediante el gestor del CMS
- **THEN** el sistema procesa, comprime y almacena los 3 elementos en la base de datos alcanzando 58 elementos sin errores de validación

#### Scenario: Bloqueo en servidor al intentar exceder el límite de 60 elementos
- **GIVEN** la galería de instalaciones cuenta con 60 elementos registrados
- **WHEN** una petición externa intenta subir una foto adicional o registrar un nuevo video de YouTube
- **THEN** el servidor rechaza la operación y retorna un error claro indicando que se ha alcanzado el límite máximo de 60 elementos

### Requirement: Inhibición visual de subida y mensaje de límite al alcanzar 60 fotos
El sistema SHALL deshabilitar el botón «Subir fotos o videos», bloquear la interacción del área de arrastrar y soltar (dropzone) e inhibir el botón de registro de YouTube en `SiteGalleryManager` tan pronto como la galería alcance los 60 elementos registrados, mostrando un mensaje informativo visible que advierta que se alcanzó la capacidad máxima y que se debe eliminar un elemento para subir nuevos.

#### Scenario: Deshabilitación del botón y aviso visible con 60 elementos
- **GIVEN** la galería de instalaciones alcanza exactamente 60 elementos en `SiteGalleryManager`
- **WHEN** el administrador observa la interfaz de carga de la galería
- **THEN** se muestra un mensaje visible de capacidad máxima («Límite de 60 fotos alcanzado»), el botón «Subir fotos o videos» se encuentra deshabilitado con estado no interactivo, el área dropzone ignora soltar archivos y el botón de YouTube está deshabilitado

#### Scenario: Rehabilitación inmediata de controles tras eliminar un elemento
- **GIVEN** la galería cuenta con 60 elementos y los controles de subida están inhibidos
- **WHEN** el administrador elimina cualquier foto o video de la galería reduciendo el total a 59 elementos
- **THEN** el mensaje de límite desaparece y el botón «Subir fotos o videos», el área dropzone y el registro de YouTube se rehabilitan automáticamente para recibir nuevos archivos

### Requirement: Capacidad de presentación de hasta 60 imágenes en componentes de /about y /matricula
Los componentes de la galería de instalaciones en las páginas `/about` (`FacilitiesGallery`, `FacilitiesMosaic`, `FacilitiesLightbox`) y `/matricula` (`MatriculaInstalaciones`, `FacilitiesLightbox`) SHALL recibir, procesar y presentar fluidamente colecciones de hasta 60 imágenes y videos activos, permitiendo recorrer la totalidad de los 60 elementos en el visor modal interactivo tanto en escritorio como en dispositivos móviles.

#### Scenario: Recorrido completo de 60 fotos en el visor modal de /about#instalaciones
- **GIVEN** la sección de instalaciones en `/about` cuenta con 60 fotos activas sincronizadas desde la base de datos
- **WHEN** el usuario hace clic en el indicador «+N fotos más» del mosaico o en una miniatura y abre el diálogo modal `FacilitiesLightbox`
- **THEN** el visor muestra el contador total «1 / 60», permite navegar cíclicamente a través de las 60 fotos mediante teclado o controles táctiles, y renderiza la tira de miniaturas con desplazamiento horizontal accesible

#### Scenario: Despliegue y apertura in-situ de hasta 60 fotos en /matricula#instalaciones
- **GIVEN** la página `/matricula` recibe los 60 elementos activos de la galería de instalaciones de Quiénes Somos
- **WHEN** el usuario visualiza el bloque `#instalaciones` y presiona el botón principal «Ver instalaciones (60)»
- **THEN** se despliega el visor modal `FacilitiesLightbox` conteniendo la colección completa de 60 elementos sin redirigir al usuario fuera de `/matricula` y preservando el foco accesible

#### Scenario: Navegación fluida de miniaturas en visor modal con 60 elementos
- **GIVEN** el visor modal de instalaciones está abierto con 60 elementos
- **WHEN** el usuario presiona las teclas de flecha derecha o izquierda para navegar a través de la galería
- **THEN** la miniatura activa en la barra inferior se mantiene enfocada y visible mediante auto-desplazamiento suave sin generar saltos de diseño ni bloqueos en la interfaz

### Requirement: Opciones ampliadas de fotos visibles en mosaico de escritorio
El sistema SHALL ofrecer opciones ampliadas de 5, 9, 13 y 17 fotos en el selector `fotos_visibles` del editor de metadatos de instalaciones (`InstalacionesFieldsEditor`) y validar que el valor persista correctamente en `site_content.metadata`, adaptando el mosaico de escritorio a múltiplos de columnas sin desbordar el diseño.

#### Scenario: Selección y persistencia de 13 fotos visibles en el CMS
- **WHEN** el administrador selecciona la opción «13 fotos (1 portada grande + 12 cuadrícula)» en el editor de instalaciones y guarda los cambios de la sección
- **THEN** el valor `fotos_visibles: 13` se almacena válidamente en `metadata` del registro `site_content`

#### Scenario: Renderizado público del mosaico con 13 casillas y acceso a lightbox con hasta 60 fotos
- **GIVEN** la galería de instalaciones contiene 60 fotos activas y la sección tiene configurado `fotos_visibles: 13`
- **WHEN** un usuario visita `/about#instalaciones` en un dispositivo de escritorio
- **THEN** el mosaico renderiza la portada principal y 12 casillas adicionales en cuadrícula de 4 columnas, mostrando en la casilla número 13 el indicador «+48 fotos más» que permite abrir el visor modal completo con todas las 60 fotos
