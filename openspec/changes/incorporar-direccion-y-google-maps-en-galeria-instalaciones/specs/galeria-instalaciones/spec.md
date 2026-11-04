# Spec Delta

## ADDED Requirements

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
