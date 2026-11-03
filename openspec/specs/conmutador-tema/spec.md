# conmutador-tema Specification

## Purpose
Define el comportamiento accesible, el nombre accesible contextual en español, los indicadores de foco y la interacción por teclado del botón conmutador de tema visual (`ThemeToggle`).

## Requirements

### Requirement: Nombre accesible contextual en español
El botón conmutador de tema visual (`ThemeToggle`) SHALL exponer un nombre accesible dinámico en español (`aria-label`) que anuncie la acción resultante de activarlo: «Cambiar a modo oscuro» cuando el tema visual activo sea claro, y «Cambiar a modo claro» cuando el tema visual activo sea oscuro, sin incluir el atributo `aria-pressed`.

#### Scenario: Etiqueta con tema claro activo en /login
- **WHEN** un usuario navega a `/login` con el tema claro activo y el componente `ThemeToggle` termina de montarse
- **THEN** el botón conmutador tiene el nombre accesible `Cambiar a modo oscuro`

#### Scenario: Etiqueta con tema oscuro activo en /login
- **WHEN** un usuario navega a `/login` con el tema oscuro activo y el componente `ThemeToggle` termina de montarse
- **THEN** el botón conmutador tiene el nombre accesible `Cambiar a modo claro`

#### Scenario: Etiqueta con preferencia sistema en esquema claro u oscuro
- **WHEN** la preferencia de tema está configurada en «sistema» y el esquema visual efectivo resuelto es claro (u oscuro)
- **THEN** el botón `ThemeToggle` anuncia la acción opuesta al tema visual activo («Cambiar a modo oscuro» si el esquema activo es claro, o «Cambiar a modo claro» si el esquema activo es oscuro)

#### Scenario: Comprobación de etiqueta en /auth/reset-password y /admin
- **WHEN** un usuario visita `/auth/reset-password` o accede a `/admin` con una sesión válida
- **THEN** el botón `ThemeToggle` está disponible en la interfaz y expone el nombre accesible correspondiente al tema activo («Cambiar a modo oscuro» o «Cambiar a modo claro»)

### Requirement: Indicador de foco visible de teclado
El botón conmutador de tema visual SHALL mostrar un contorno de foco visible (`focus-visible`) nítido y accesible al ser alcanzado mediante navegación secuencial por teclado (`Tab` o `Shift+Tab`), tanto bajo el tema claro como bajo el tema oscuro.

#### Scenario: Foco visible en modo claro mediante Tab o Shift+Tab
- **WHEN** el usuario navega con la tecla `Tab` o `Shift+Tab` hasta el botón conmutador de tema en `/login` mientras el tema claro está activo
- **THEN** el botón recibe el foco activo y presenta un indicador de contorno visible (`focus-visible`) que contrasta con el fondo claro

#### Scenario: Foco visible en modo oscuro mediante Tab o Shift+Tab
- **WHEN** el usuario navega con la tecla `Tab` o `Shift+Tab` hasta el botón conmutador de tema en `/login` mientras el tema oscuro está activo
- **THEN** el botón recibe el foco activo y presenta un indicador de contorno visible (`focus-visible`) que contrasta con el fondo oscuro

### Requirement: Alternancia mediante Enter y Espacio con preservación de foco
El botón conmutador de tema visual SHALL alternar entre el tema claro y el tema oscuro al ser activado mediante las teclas `Enter` o `Espacio`, conservando el foco en el botón y actualizando inmediatamente su nombre accesible para reflejar la siguiente acción disponible.

#### Scenario: Alternancia con Enter preservando el foco
- **WHEN** el foco está en el botón conmutador con tema claro activo en `/login` y el usuario presiona `Enter`
- **THEN** el tema visual cambia a modo oscuro, el foco permanece en el botón conmutador y su nombre accesible pasa a ser `Cambiar a modo claro`

#### Scenario: Alternancia con Espacio preservando el foco
- **WHEN** el foco está en el botón conmutador con tema oscuro activo en `/login` y el usuario presiona `Espacio`
- **THEN** el tema visual cambia a modo claro, el foco permanece en el botón conmutador y su nombre accesible pasa a ser `Cambiar a modo oscuro`

### Requirement: Persistencia del tema seleccionado tras recarga
El sistema SHALL conservar la preferencia de tema establecida por el usuario a través del conmutador tras recargar la página en el navegador, preservando el comportamiento provisto por el proveedor de temas.

#### Scenario: Persistencia del tema visual y nombre accesible tras recarga en /login
- **WHEN** el usuario cambia el tema mediante el conmutador en `/login` y posteriormente recarga la página
- **THEN** el elemento raíz `<html>` refleja el tema visual seleccionado (clase `dark` presente o ausente) y el botón conmutador conserva el nombre accesible correspondiente a dicho estado («Cambiar a modo claro» si está en modo oscuro o «Cambiar a modo oscuro» si está en modo claro)
