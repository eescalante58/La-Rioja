# Integración de WhatsApp Automático con Ultramsg

Este documento describe los pasos para implementar el envío automático de facturas y cartones de Bingo utilizando la API de Ultramsg.

## 1. Configuración de la Cuenta

1. Registrarse en [Ultramsg.com](https://ultramsg.com/).
2. Crear una nueva instancia.
3. Escanear el código QR con el número de WhatsApp que enviará los mensajes (Preferiblemente un número dedicado para "La Rioja").
4. Obtener las credenciales:
   - **INSTANCE_ID**: Identificador de tu instancia.
   - **TOKEN**: Clave de acceso a la API.

## 2. Variables de Entorno (.env.local)

Añadir las siguientes variables al archivo de configuración para mayor seguridad:

```env
ULTRAMSG_INSTANCE_ID=tu_instance_id
ULTRAMSG_TOKEN=tu_token
```

## 3. Lógica de Envío Automático (Propuesta)

Se debe modificar la función en `actions.ts` para que realice peticiones `POST` a la API de Ultramsg.

### Ejemplo de flujo para una factura:

1. **Enviar Mensaje de Texto**: Con el saludo y detalles de la compra.
2. **Enviar Imagen de Plantilla**: Imagen institucional del Bingo.
3. **Enviar PDF de Factura**: Link directo desde Supabase Storage.
4. **Enviar PDFs de Cartones**: Un mensaje por cada cartón asociado.

### Código de ejemplo (Conceptuall):

```typescript
const url = `https://api.ultramsg.com/${INSTANCE_ID}/messages/document`;
const params = {
  token: TOKEN,
  to: phone_number,
  filename: "Factura_Bingo.pdf",
  document: url_documento_supabase,
  caption: "Aquí tienes tu factura de compra.",
};
```

## 4. Próximos Pasos para la Prueba Técnica

1. [x] Crear cuenta gratuita en Ultramsg (3 días de prueba).
2. [x] Proporcionar `INSTANCE_ID` y `TOKEN`.
3. [ ] Implementar función `sendWhatsAppAutomation` en `actions.ts` (En progreso).
4. [ ] Actualizar el botón del formulario en `BingoManagerClient.tsx` para llamar a la nueva automatización.

## 5. Recomendaciones de Seguridad

- No enviar más de 50 mensajes por minuto para evitar sospechas de spam.
- Utilizar un número de teléfono que ya tenga historial de chats previos.
- Asegurarse de que los enlaces de Supabase Storage sean públicos o tengan una duración suficiente.
