# Manual de Usuario — Gestión de Productos (La Rioja Shop)

Manual de uso de la sección **Gestión Productos** del panel de administración (`/admin/productos`). Desde aquí se administra **La Rioja Shop**, la tienda pública (`/productos`) con los productos que elaboran los estudiantes en los talleres: catálogos, líneas, productos con sus precios, catálogos descargables en PDF y los pedidos que envían los visitantes.

> **Acceso:** menú lateral → **Gestión Productos**. Requiere rol **Editor** o superior. Este manual también se abre desde el enlace **Manual de Usuario** de la propia sección. La pantalla tiene tres pestañas: **Productos**, **Catálogos y líneas** y **Pedidos**. El botón **Ver tienda** (arriba a la derecha) abre la tienda pública en otra pestaña.

---

## Cómo se organiza la tienda

La tienda tiene cuatro niveles. Conviene crearlos en este orden:

```
Catálogo (un taller)        →  Arte y Costura, Panadería La Rioja
  └─ Línea (agrupación)     →  Tote Bags, Toallas de mano, Paneras…
       └─ Producto          →  Tote bag floral
            └─ Presentación →  Pequeña $10 · Grande $15
```

- **Catálogo:** un taller. Tiene nombre, lema, texto «Quiénes somos» y, si se quiere, un PDF descargable.
- **Línea:** agrupa productos parecidos dentro de un catálogo.
- **Producto:** lo que se vende. Siempre pertenece a una línea.
- **Presentación:** cada precio del producto (tamaño, cantidad, sabor…). Todo producto tiene al menos una.

> **Importante:** un producto solo se ve en la tienda si **él, su línea y su catálogo** están publicados. Ocultar un catálogo oculta todo lo que contiene, sin borrarlo.

Los cambios se ven en la tienda pública en **un minuto como máximo**.

---

## 1. Productos

Lista todos los productos agrupados por catálogo y línea. El contador de la pestaña indica cuántos productos hay en total (publicados y ocultos).

### Barra de herramientas

- **Filtro de catálogo:** muestra solo los productos de un catálogo (o **Todos los catálogos**).
- **Buscar producto…:** filtra por nombre mientras escribes.
- **Nuevo producto:** abre el formulario de alta. Si todavía no existe ninguna línea, aparece el aviso «Primero crea una línea en Catálogos y líneas».

### Tarjeta de producto

Cada producto muestra su foto, nombre, presentaciones con precio y su estado, con estas acciones:

| Acción | Qué hace |
| :----- | :------- |
| **Publicado / Oculto** (ojo) | Publica u oculta el producto en la tienda. Ocultarlo no lo borra. |
| **Presentación → Agotado** | Toca una presentación para marcarla como agotada o disponible. Las agotadas se ven en la tienda pero no se pueden agregar a la canasta. |
| **Editar** (lápiz) | Abre el formulario con los datos del producto. |
| **Eliminar** (basurero) | Pide confirmación y borra el producto, sus presentaciones y su foto. **No se puede deshacer.** Los pedidos ya recibidos conservan el nombre y el precio. |

### Cambiar el orden

Dentro de cada línea, arrastra un producto por el asa **⋮⋮** («Arrastrar para reordenar») hasta su nueva posición. El orden se guarda solo y es el mismo que verá el público. También funciona con teclado desde el asa.

> El orden solo se puede cambiar cuando **no hay texto en el buscador** y la línea tiene más de un producto.

### Nuevo producto / Editar producto

Los campos marcados como (obligatorio) deben llenarse para poder guardar.

| Campo | Descripción |
| :---- | :---------- |
| **Catálogo y línea** (obligatorio) | Línea a la que pertenece el producto (se elige de las líneas creadas en Catálogos y líneas). |
| **Nombre** (obligatorio) | Nombre visible en la tienda (ej.: Tote bag floral). |
| **Descripción** | Texto opcional que acompaña al producto. |
| **Foto** | Imagen JPG, PNG, WEBP o GIF de **hasta 5 MB**. Se puede reemplazar o quitar al editar. Si no tiene foto, la tienda muestra un ícono de paquete en su lugar. |
| **Precios** (obligatorio) | Una o más presentaciones. Cada una tiene **Presentación** (ej.: Pequeña; puede quedar vacía si hay una sola), **Precio en USD** (número mayor o igual a 0) y **Unidad** (ej.: «2 unidades» para «2 × $0.25»). Usa **Agregar presentación** para sumar otra y la **X** para quitarla. |
| **Publicado en la tienda** | Marcado = visible al público. Desmarcado = guardado pero oculto. |

La **Vista previa** muestra cómo se verá la tarjeta en la tienda antes de guardar. Pulsa **Crear producto** o **Guardar cambios**.

Mensajes frecuentes:

- «Selecciona la línea del producto.» — falta elegir la línea.
- «Revisa los precios: deben ser números mayores o iguales a 0.»
- «La imagen supera 5 MB.» — reduce la foto antes de subirla.

---

## 2. Catálogos y líneas

Administra los talleres (catálogos), sus líneas de productos y el catálogo en PDF.

### Catálogos

Cada catálogo muestra su estado (**Publicado** / **Oculto**), sus líneas y las acciones **Editar**, **Eliminar** y **Nueva línea**. El botón **Nuevo catálogo** está arriba.

| Campo | Descripción |
| :---- | :---------- |
| **Nombre** (obligatorio) | Nombre del taller (ej.: Arte y Costura). |
| **Identificador en la URL** (obligatorio) | Versión corta del nombre en minúsculas y con guiones, sin tildes ni espacios (ej.: `arte-y-costura`). No puede repetirse. |
| **Lema** | Frase corta del taller (ej.: «Arte y costura en cada creación.»). |
| **Quiénes somos** | Texto de presentación del taller. |
| **Orden** | Posición del catálogo en la tienda (menor = primero). |
| **Publicado en la tienda** | Marcado = visible. Al ocultarlo se ocultan también sus líneas y productos. |

**Eliminar un catálogo** borra el catálogo y sus líneas **vacías**. Si alguna de sus líneas tiene productos, el sistema no lo permite: primero mueve o elimina esos productos.

### Catálogo en PDF

Cada catálogo puede tener un PDF que el público descarga desde la tienda.

- **Subir PDF:** elige un archivo PDF de **hasta 50 MB**. Se muestra «Subiendo…» con el tamaño y luego «Guardando…».
- **Ver PDF · tamaño:** abre el PDF vigente; junto al enlace se indica la fecha en que se subió.
- **Reemplazar:** sube un PDF nuevo; el anterior se borra solo.
- **Quitar** (basurero): pide confirmación; el catálogo deja de poder descargarse.

> Si cierras la pestaña a mitad de una subida, el archivo incompleto se limpia automáticamente más tarde. No hace falta hacer nada.

### Líneas

Dentro de cada catálogo se listan sus líneas con su estado (**Publicada** / **Oculta**) y las acciones **Editar** y **Eliminar**.

| Campo | Descripción |
| :---- | :---------- |
| **Catálogo** (obligatorio) | Taller al que pertenece la línea. |
| **Nombre** (obligatorio) | Nombre de la línea (ej.: Tote Bags). No puede repetirse dentro del mismo catálogo. |
| **Descripción** | Texto opcional de la línea. |
| **Eslogan** | Frase destacada de la línea (ej.: «¡Usá calidad, usá conciencia!»). |
| **Orden** | Posición dentro del catálogo. |
| **Publicado en la tienda** | Marcado = visible. Al ocultarla se ocultan sus productos. |

**Eliminar una línea** solo es posible si **no tiene productos**.

---

## 3. Pedidos

Muestra los pedidos que los visitantes registran desde la canasta de la tienda.

### Cómo llega un pedido

1. El visitante arma su canasta en `/productos` y escribe sus datos (nombre, teléfono y, si quiere, correo y notas).
2. El sistema registra el pedido con un número (desde **#1001**) y **calcula el total con los precios vigentes**: el visitante no puede alterar los precios.
3. El visitante envía el pedido por WhatsApp a la tienda para coordinar pago y entrega.

> Para evitar abusos, el sistema acepta como máximo **5 pedidos por minuto** y **20 por día** desde una misma conexión, y rechaza presentaciones agotadas u ocultas.

### Resumen

Arriba se muestran tres indicadores: **Pedidos nuevos** (pendientes de atender), **Pedidos de hoy** y **Total de hoy** (sin contar los cancelados).

### Lista de pedidos

- **Filtro de estado:** **Todos los estados** o uno en particular. Con «Todos» se muestran los **300 pedidos más recientes**.
- Cada pedido muestra número, fecha y hora (hora de El Salvador), cliente, teléfono, productos con cantidades y subtotales, total y **Notas** del cliente.
- **WhatsApp:** abre una conversación con el cliente con el mensaje «Hola (nombre), te escribimos de La Rioja Shop sobre tu pedido #(número).»
- **Estado:** selector para avanzar el pedido.

| Estado | Significado |
| :----- | :---------- |
| **Nuevo** | Recién registrado; nadie lo ha atendido. |
| **Confirmado** | Se habló con el cliente y se confirmó disponibilidad, total y pago. |
| **Listo** | Preparado para entregar o retirar. |
| **Entregado** | El cliente ya lo recibió. |
| **Cancelado** | No se concretó. No suma en el total del día. |

---

## 4. Textos e imágenes de la tienda (CMS)

Los textos de la página pública que no son productos se editan en **Gestión CMS → Contenido General**, filtrando por la página **Productos (La Rioja Shop)**:

| Clave de sección | Qué controla |
| :--------------- | :----------- |
| `productos_hero` | Título y texto de portada, distintivo y los dos botones (en Metadata). |
| `productos_hero_foto_1` … `productos_hero_foto_4` | Fotos de la portada; el **Título** es el texto alternativo. Sin fotos, se usan fotos de productos. |
| `productos_mensaje` | Recuadro «Cada compra apoya su formación». |
| `productos_regalos` | Tarjeta de regalos empresariales (etiqueta, botón y mensaje de WhatsApp en Metadata). Desactivarla la oculta. |
| `productos_como_comprar` y `productos_paso_1` … | Sección «Cómo comprar» y sus pasos, en orden. Desactivar el título oculta la sección. |

El número de WhatsApp de la tienda se toma de **Social Media → `whatsapp tienda`** (o, si no existe, de `whatsapp`). Ver el manual de Gestión CMS.

---

## Tips generales

- Crea primero el **catálogo**, luego sus **líneas** y por último los **productos**.
- Para retirar algo temporalmente, **ocúltalo** en lugar de borrarlo: conserva fotos, precios y orden.
- Si se acaba una presentación, márcala como **Agotado**: el producto sigue visible y el cliente sabe que volverá.
- Revisa la pestaña **Pedidos** a diario y mueve cada pedido por sus estados; el indicador **Pedidos nuevos** muestra lo pendiente.
- Usa **Ver tienda** para comprobar cómo quedó todo; los cambios tardan hasta un minuto en verse.
