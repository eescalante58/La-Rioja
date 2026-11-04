# galeria-instalaciones Specification

## Purpose

Define el comportamiento accesible de gestión de foco y navegación por teclado del visor modal compartido de la galería de instalaciones presentado en `/about#instalaciones` y `/matricula#instalaciones`.

## Requirements

### Requirement: Foco inicial en el botón Cerrar al abrir el visor
El sistema SHALL trasladar automáticamente el foco del teclado al botón «Cerrar visor de instalaciones» (`aria-label="Cerrar visor de instalaciones"`) tan pronto como el diálogo modal de la galería de instalaciones esté disponible en el DOM, independientemente de la ruta (`/about#instalaciones` o `/matricula#instalaciones`) o del método de activación (`Enter`, `Espacio` o clic).

#### Scenario: Apertura desde miniatura o botón en /about#instalaciones
- **WHEN** el usuario activa una miniatura visible de la galería o el botón «Ver galería completa» en `/about#instalaciones` mediante `Enter`, `Espacio` o clic
- **THEN** el diálogo `Galería de instalaciones` se muestra y el botón `Cerrar visor de instalaciones` recibe el foco activo (`document.activeElement`)

#### Scenario: Apertura desde miniatura o botón principal en /matricula#instalaciones
- **WHEN** el usuario activa una miniatura de vista previa o el botón «Ver instalaciones» en `/matricula#instalaciones` mediante `Enter`, `Espacio` o clic
- **THEN** el diálogo `Galería de instalaciones` se muestra sin abandonar `/matricula` y el botón `Cerrar visor de instalaciones` recibe el foco activo (`document.activeElement`)

### Requirement: Cierre del diálogo mediante teclado
El sistema SHALL cerrar el visor de instalaciones cuando el usuario active el botón «Cerrar visor de instalaciones» con `Enter` o `Espacio`, o cuando presione la tecla `Escape` mientras el foco se encuentre en cualquiera de los controles del diálogo.

#### Scenario: Cierre inmediato con Enter o Espacio sobre el botón Cerrar
- **WHEN** el visor acaba de abrirse y el foco permanece en el botón `Cerrar visor de instalaciones`, y el usuario presiona `Enter` o `Espacio`
- **THEN** el diálogo se cierra y deja de estar presente en el DOM

#### Scenario: Cierre con Escape desde cualquier control del diálogo
- **WHEN** el visor está abierto, el foco se encuentra en cualquier control interactivo del diálogo (botón Cerrar, flechas de navegación o miniaturas) y el usuario presiona `Escape`
- **THEN** el diálogo se cierra y deja de estar presente en el DOM

### Requirement: Trampa de foco restringida a controles visibles del visor
El sistema SHALL mantener el foco de teclado dentro del diálogo modal al navegar con `Tab` y `Shift+Tab`, recorriendo únicamente los controles interactivos visibles del visor sin que el foco pase a ningún elemento de la página de fondo, tanto cuando la galería contiene varios elementos como cuando contiene un solo elemento.

#### Scenario: Recorrido cíclico con Tab y Shift+Tab en galería con varios elementos
- **WHEN** el visor está abierto con múltiples elementos y el usuario presiona repetidamente `Tab` o `Shift+Tab`
- **THEN** el foco cicla entre el primer y el último control visible del diálogo (excluyendo controles ocultos como la barra de miniaturas cuando está oculta por viewport) y nunca se traslada a elementos fuera del diálogo

#### Scenario: Recorrido cíclico con Tab y Shift+Tab en galería con un solo elemento
- **WHEN** el visor está abierto en una galería con un único elemento y el usuario presiona `Tab` o `Shift+Tab`
- **THEN** el foco permanece dentro de los controles visibles del diálogo sin escapar a la página de fondo

### Requirement: Restauración del foco al control que abrió el visor
El sistema SHALL devolver el foco exactamente al control interactivo que originó la apertura del visor inmediatamente después de cerrarse el diálogo.

#### Scenario: Retorno al control específico en /about#instalaciones
- **WHEN** el usuario abre el visor desde una miniatura específica (por ejemplo, la segunda miniatura) o desde el botón «Ver galería completa» en `/about#instalaciones` y luego cierra el visor con teclado
- **THEN** el foco regresa exactamente a esa misma miniatura o botón que abrió el visor

#### Scenario: Retorno al control específico en /matricula#instalaciones
- **WHEN** el usuario abre el visor desde el botón «Ver instalaciones» o desde una miniatura específica en `/matricula#instalaciones` y luego cierra el visor con teclado
- **THEN** el foco regresa exactamente al botón o miniatura que abrió el visor

### Requirement: Exposición de dirección física y enlace a Google Maps en la galería de instalaciones
El bloque de presentación de la galería de instalaciones (`#instalaciones`) SHALL exponer de manera visible y accesible la dirección física oficial de la sede de La Rioja («Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador») y un enlace externo a Google Maps con el atributo `target="_blank"` y `rel="noopener noreferrer"`, ubicado inmediatamente después del encabezado institucional en las páginas `/about` y `/matricula`.

#### Scenario: Visualización de dirección y enlace a Google Maps en /about#instalaciones
- **WHEN** un usuario navega a `/about#instalaciones` y la sección de instalaciones está disponible en el DOM
- **THEN** inmediatamente después del título («Conoce nuestras instalaciones») y su descripción, se visualiza la dirección física oficial «Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador» y un enlace externo a Google Maps («Ver en Google Maps») que apunta a la URL configurada en el CMS

#### Scenario: Visualización de dirección y enlace a Google Maps en /matricula#instalaciones
- **WHEN** un usuario navega a `/matricula#instalaciones` y la sección de instalaciones está disponible en el DOM
- **THEN** en la columna del encabezado de la galería de instalaciones, junto a la descripción, se visualiza la dirección física oficial «Urb. Lomas de Altamira, Calzada El Zenzontle, block 2 #7, San Salvador» y el enlace interactivo a Google Maps que abre en una pestaña nueva

#### Scenario: Ocultamiento elegante del enlace cuando la URL no está disponible
- **WHEN** el registro CMS `social media / google maps` está inactivo o su URL en `metadata.url` está vacía o es inválida
- **THEN** el enlace a Google Maps se omite de la galería de instalaciones sin generar errores en la interfaz, manteniendo visible la dirección física si está provista
