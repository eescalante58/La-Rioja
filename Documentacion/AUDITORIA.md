# Auditoria tecnica del proyecto LaRioja

Fecha de auditoria: 2026-05-25  
Proyecto: LaRioja, aplicacion Next.js 14 con Supabase, CMS interno, panel administrativo y modulos de bingo/contacto.

## 1. Resumen ejecutivo

El proyecto tiene una base funcional razonable: usa App Router de Next.js, separa rutas publicas y administrativas, concentra acceso a Supabase en helpers, tiene middleware de sesion, integra CMS dinamico y mantiene una identidad visual institucional reconocible con azul, verde y amarillo La Rioja.

Sin embargo, no deberia considerarse listo para produccion sin remediar riesgos de seguridad y mantenimiento. Los hallazgos mas importantes son:

- Dependencias con vulnerabilidades reportadas por `npm audit`, incluyendo `next@14.2.16` con severidad critica.
- Seleccion de empresa basada en campos ocultos y cookies manipulables sin revalidacion suficiente en el server action.
- Uso o fallback a `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, lo cual es un patron critico si esa variable existe en cliente o en Vercel como publica.
- Acciones administrativas con RBAC inconsistente: algunas validan nivel, otras solo validan sesion o dependen completamente de RLS.
- Formulario de contacto con `targetEmail` controlado desde cliente y HTML de correo construido con valores no escapados.
- Uso de `dangerouslySetInnerHTML` con contenido CMS sin sanitizacion centralizada.
- Exceso de estilos inline/Tailwind repetidos, radios grandes, sombras pesadas, blobs decorativos y gradientes que diluyen la sobriedad institucional.
- Performance mejorable por consultas secuenciales, muchas suscripciones realtime y componentes cliente de gran tamano.

Prioridad recomendada: resolver primero seguridad y dependencias, despues consolidar arquitectura/RBAC, y luego normalizar UI/performance.

## 2. Alcance y metodologia

Se revisaron:

- Configuracion: `package.json`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`, `.gitignore`.
- Rutas publicas: home, nosotros, programas, contacto, FAQ, login y recuperacion.
- Rutas admin: dashboard, CMS, usuarios, empresas, paises, estudiantes, bingo, logs, seguridad.
- Capa de datos: Supabase server/browser clients, middleware, server actions, CMS service.
- Estilos institucionales y patrones visuales.
- Dependencias con `npm audit --audit-level=moderate`.

Limitaciones:

- No se hizo pentest activo contra Supabase ni revision de politicas RLS en la base real.
- No se validaron credenciales ni secretos reales.
- La evaluacion visual fue por inspeccion de componentes/clases; una auditoria final debe incluir capturas en navegadores reales en 320, 375, 768, 1024 y 1440 px.

## 3. Arquitectura

### Fortalezas

- Buena adopcion de Next.js App Router: rutas bajo `src/app`, layouts separados y server actions.
- Separacion basica entre sitio publico, autenticacion y administracion.
- Helpers reutilizables para Supabase:
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/client.ts`
- Middleware protege `/admin` y refresca sesion.
- CMS dinamico permite editar contenido institucional sin redeploy.
- Uso de Tailwind y tokens institucionales en `tailwind.config.ts`.

### Debilidades

- Las reglas de autorizacion estan distribuidas y no centralizadas. Hay `checkMinLevel` solo en `src/app/admin/settings/users/actions.ts`, pero otras acciones admin usan validaciones distintas o solo `auth.getUser()`.
- El dominio multiempresa depende fuertemente de la cookie `selected_company_id`.
- Las acciones server mezclan responsabilidades: validacion, autorizacion, persistencia, storage, auditoria y revalidacion en funciones grandes.
- Falta una capa de servicios/repositorios tipados para tablas clave: usuarios, empresas, eventos, facturas, CMS, estudiantes.
- Se usan muchos `any`, metadatos libres y FormData sin esquemas de validacion.
- Existe `src/app/page copy.tsx`, archivo duplicado que puede generar confusion y deuda tecnica.

### Recomendacion arquitectonica

Crear una capa comun:

- `src/lib/auth/authorization.ts`: `requireUser()`, `requireRoleLevel(min)`, `requireCompanyAccess(companyId)`.
- `src/lib/validation/*`: esquemas con Zod o validadores propios.
- `src/lib/audit/logActivity.ts`: auditoria uniforme.
- `src/lib/repositories/*`: acceso tipado a Supabase por dominio.
- `src/lib/security/sanitize.ts`: escape/sanitizacion HTML y normalizacion de entradas.

## 4. Seguridad

### Hallazgo critico: dependencias vulnerables

`npm audit --audit-level=moderate` reporto 7 vulnerabilidades:

- 1 critica en `next`.
- 3 altas, incluyendo `glob` via `eslint-config-next`.
- 3 moderadas, incluyendo `postcss`, `ws` y `brace-expansion`.

El reporte indica que la correccion completa forzada migraria a `next@16.2.6` / `eslint-config-next@16.2.6`, lo cual es breaking change.

Impacto:

- Riesgo de DoS, middleware bypass, cache poisoning, problemas de Image Optimization, SSRF y XSS segun advisories asociados a Next.js.

Accion recomendada:

- Crear rama de upgrade.
- Probar primero ultima version segura compatible de Next 14 si existe en el rango del proyecto.
- Si el audit sigue marcando critico, planificar migracion a Next 15/16 con pruebas de rutas, middleware, server actions, imagenes y Supabase SSR.
- Ejecutar `npm audit` en CI y bloquear despliegues con vulnerabilidades criticas.

### Hallazgo critico: service role potencialmente publico

Referencias:

- `src/app/actions/contact.ts:25`
- `src/app/admin/settings/users/actions.ts:132`

Se usa o se referencia `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. Cualquier variable con prefijo `NEXT_PUBLIC_` puede terminar expuesta al bundle del navegador si se configura en el entorno y se referencia desde codigo cliente. Aunque aqui se usa en server actions, el nombre del secreto es peligroso y facilita errores de despliegue.

Impacto:

- Exposicion del service role equivale a control total sobre Supabase, bypass de RLS y acceso completo a datos.

Accion recomendada:

- Eliminar todo uso de `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- Usar exclusivamente `SUPABASE_SERVICE_ROLE_KEY` en servidor.
- Rotar la service role key si alguna vez fue creada con prefijo publico en Vercel/Supabase o compartida.
- Agregar validacion al arranque: fallar si existe `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

### Hallazgo alto: seleccion de empresa manipulable

Referencia:

- `src/app/auth/select-company/page.tsx`

El server action `selectCompany` toma `companyId` y `companyName` desde inputs hidden y los guarda directamente en cookies. Aunque la lista se renderiza desde empresas asociadas al usuario, un cliente puede alterar el POST y seleccionar otro `companyId`.

Impacto:

- Si las politicas RLS o acciones server no validan membresia en cada operacion, un usuario podria acceder u operar sobre otra empresa.

Accion recomendada:

- En `selectCompany`, obtener el usuario actual y comprobar que `companyId` pertenece a `user_companies` antes de setear cookies.
- No confiar en `companyName` del formulario; buscarlo en base.
- Configurar cookies con `httpOnly`, `secure`, `sameSite: "lax"` o `"strict"` y expiracion.
- En cada accion server multiempresa, llamar `requireCompanyAccess(companyId)`.

### Hallazgo alto: RBAC inconsistente en acciones administrativas

Referencias:

- `src/app/admin/settings/users/actions.ts:95`
- `src/app/admin/settings/users/actions.ts:365`
- `src/app/admin/settings/users/actions.ts:415`
- `src/app/admin/cms/actions.ts`
- `src/app/admin/bingo/actions.ts`

Hay acciones con control por nivel (`checkMinLevel`) y otras que solo revisan que exista usuario autenticado. En `users/actions.ts`, funciones como `assignUserToCompany` validan nivel, pero `removeUserFromCompany` y `updateUserCompanyRole` no muestran una validacion equivalente.

Impacto:

- Escalada horizontal o vertical si una ruta cliente invoca server actions directamente y RLS no cubre todos los casos.

Accion recomendada:

- Ninguna mutacion admin debe depender solo de UI o middleware.
- Cada server action debe validar:
  - usuario autenticado;
  - rol minimo;
  - pertenencia a empresa;
  - permisos sobre entidad especifica.
- Documentar matriz RBAC: Super Admin, Admin, Operador, Consulta.

### Hallazgo alto: formulario de contacto permite destinatario controlado por cliente

Referencias:

- `src/app/actions/contact.ts:12`
- `src/app/actions/contact.ts:59`
- `src/app/actions/contact.ts:74`
- `src/components/layout/ContactModal.tsx:45`
- `src/components/layout/ContactDescription.tsx:53`

`targetEmail` viaja desde el cliente y se usa para guardar y enviar correo. Esto permite manipular destinatarios si no hay allowlist server-side.

Impacto:

- Abuso del servicio de correo.
- Envio a destinatarios no autorizados.
- Riesgo reputacional del dominio de correo.

Accion recomendada:

- Reemplazar `targetEmail` por un identificador de canal: `general`, `donaciones`, `programas`.
- Resolver destinatarios en servidor desde allowlist interna.
- Agregar rate limiting por IP/sesion/email.
- Validar longitud y formato de nombre, email, telefono, tipo y mensaje.

### Hallazgo alto: HTML no escapado en correos y contenido CMS

Referencias:

- `src/app/actions/contact.ts`
- `src/app/about/page.tsx:314`
- `src/app/about/page.tsx:327`
- `src/app/about/page.tsx:614`

El correo se construye con interpolacion directa de datos del usuario. Ademas, `about/page.tsx` usa `dangerouslySetInnerHTML` con contenido CMS. React escapa texto normal, pero `dangerouslySetInnerHTML` y HTML de correo no tienen esa proteccion.

Impacto:

- XSS almacenado si CMS acepta contenido malicioso.
- HTML injection en correos.
- Phishing visual dentro de mensajes.

Accion recomendada:

- Escapar valores antes de construir HTML de correo.
- Sanitizar HTML CMS con una politica permitida o evitar HTML libre y renderizar saltos de linea de forma segura.
- Registrar pruebas de seguridad para payloads basicos: `<script>`, `onerror`, enlaces `javascript:`.

### Hallazgo medio: logs con informacion sensible y ruido de debug

Se detecta uso amplio de `console.log` y `console.error`, especialmente en modulo Bingo y contacto. Aunque no todo es secreto, algunos logs incluyen payloads, errores de base y datos operativos.

Impacto:

- Exposicion accidental en logs de produccion.
- Dificulta observabilidad real.

Accion recomendada:

- Crear logger con niveles por entorno.
- No loggear payloads completos, emails, telefonos, mensajes ni tokens.
- Mantener `console.error` solo con codigos internos y correlation id.

### Hallazgo medio: subida de archivos sin politica uniforme visible

En CMS, avatars, bingo e invoices se suben archivos a storage. Hay uso de `file.type`, pero no se observa una validacion central de:

- extension permitida;
- MIME real;
- tamano maximo;
- dimensiones;
- nombres seguros;
- antivirus o escaneo si aplica.

Accion recomendada:

- Validar archivos en server actions.
- Limitar imagenes a `image/jpeg`, `image/png`, `image/webp`.
- Definir limites por bucket.
- Generar nombres sin usar `file.name` directamente salvo extension sanitizada.

## 5. Rendimiento

### Hallazgos

- `getDashboardData` ejecuta multiples consultas secuenciales; algunas pueden paralelizarse.
- Varias paginas publicas llaman al CMS desde server components y hacen fallback si falla, pero no se ve estrategia explicita de cache/revalidate.
- `RealtimeDashboardWrapper` abre varias suscripciones Supabase realtime; puede generar carga innecesaria si hay muchos administradores conectados.
- Uso abundante de sombras, blur, gradientes y animaciones puede afectar dispositivos moviles de gama baja.
- Componentes admin grandes como `BingoManagerClient.tsx` concentran mucha logica y estado en cliente.
- Charts con ECharts/Tremor aumentan el bundle del admin; esta bien si solo carga en admin, pero conviene lazy load para modales o vistas no iniciales.

### Recomendaciones

- Paralelizar consultas independientes con `Promise.all`.
- Definir politica de cache:
  - CMS publico: ISR o `revalidate` por seccion.
  - Admin: `no-store` o realtime segun necesidad.
- Consolidar canales realtime o filtrar por empresa/evento.
- Dividir `BingoManagerClient` por dominios: eventos, clientes, facturas, promociones, inventario.
- Usar `dynamic import` para charts pesados y modales raros.
- Reducir `blur-3xl`, `shadow-2xl` y animaciones decorativas en mobile.

## 6. Responsividad y accesibilidad

### Fortalezas

- Uso extensivo de breakpoints `sm`, `md`, `lg`.
- Navbar movil existe y bloquea scroll cuando esta abierta.
- Admin sidebar tiene variante movil.
- Muchos grids publicos colapsan correctamente.

### Riesgos

- Persisten formularios/modales admin con `grid-cols-2` o `grid-cols-3` sin breakpoint movil.
- Titulares publicos como `text-5xl md:text-7xl` en about/contact/programs pueden ser demasiado grandes en 320px con contenido CMS largo.
- Algunos contenedores usan `rounded-[3rem]`, `p-12`, `shadow-2xl`, `blur-3xl`, que visualmente ocupan demasiado en mobile.
- Tablas admin dependen de `overflow-x-auto`; es aceptable para datos tabulares, pero debe revisarse que acciones primarias no queden ocultas.
- El contraste del amarillo `#FFFF00` sobre blanco o tonos claros puede fallar WCAG si se usa como texto pequeno.
- Faltan estados de foco consistentes en varios botones custom.

### Recomendaciones

- Auditar con Playwright o navegador real en:
  - 320 x 568
  - 375 x 667
  - 768 x 1024
  - 1024 x 768
  - 1440 x 900
- Convertir `grid grid-cols-2` a `grid grid-cols-1 sm:grid-cols-2` en formularios. RESUELTO 25/6/2026
- Limitar titulos CMS con clases responsivas y `overflow-wrap:anywhere` donde aplique. RESUELTO 25/6/2026
- Estandarizar foco visible (`focus-visible:ring-*`) en todos los controles. RESUELTO 25/6/2026
- Revisar contraste de amarillo; usarlo como fondo o acento, no como texto fino sobre fondos claros. RESUELTO 25/6/2026

## 7. Cumplimiento de estilos institucionales

### Lo positivo

- Paleta institucional definida en Tailwind:
  - `larioja.azul`: `#012060`
  - `larioja.verde`: `#1E9922`
  - `larioja.amarillo`: `#FFFF00`
- Tipografias Montserrat e Inter reflejan una mezcla adecuada de institucion + legibilidad.
- Logo presente en navbar y flujos auth.
- El sitio comunica bien inclusion, formacion laboral y apoyo social.

### Desviaciones

- Hay sobreuso de tarjetas con radios muy grandes, sombras intensas, blobs y fondos con blur. Esto acerca la interfaz a un estilo promocional/generico y resta sobriedad institucional.
- El admin mezcla Tremor, componentes propios y estilos Tailwind ad hoc; se perciben patrones visuales distintos entre dashboard, CMS y Bingo.
- Los gradientes azul-verde-amarillo pueden sentirse muy saturados, especialmente en pantallas de login/auth.
- La nomenclatura visual no esta formalizada: no hay guia de botones, cards, tablas, modales, estados ni formularios.
- `blob-purple` en CSS realmente usa verde; el nombre semantico no coincide.

### Recomendacion visual

Crear una mini guia institucional:

- Boton primario: azul institucional.
- Accion positiva/secundaria: verde.
- Amarillo: acento, badges, highlights y barras, evitando texto pequeno.
- Cards admin: radio 12-16px, sombra sutil, menos gradientes.
- Sitio publico: imagenes reales y contenido institucional por encima de decoracion abstracta.
- Estados: loading, empty, error, success, disabled.

## 8. Buenas practicas de codigo

### Fortalezas

- `strict: true` esta activo en TypeScript.
- Alias `@/*` configurado.
- Server actions facilitan mantener secretos fuera del cliente cuando se usan correctamente.
- `.env*.local` esta ignorado en Git.

### Debilidades

- `allowJs: true` y `skipLibCheck: true` reducen rigor de TypeScript.
- Uso amplio de `any`, especialmente en CMS, metadata y componentes admin.
- No hay suite de pruebas visible.
- No hay pipeline documentado de lint/build/audit.
- El script `lint` usa `next lint`, comando obsoleto en versiones modernas de Next.
- Comentarios JSDoc en componentes simples agregan ruido y no sustituyen tipos de dominio.
- Hay archivos duplicados o historicos (`page copy.tsx`).

### Recomendaciones

- Introducir Zod para entradas de server actions.
- Tipar entidades Supabase con tipos generados.
- Agregar pruebas unitarias para validadores y server actions criticas.
- Agregar pruebas E2E para login, seleccion de empresa, CMS, contacto y flujo bingo.
- Migrar lint a ESLint CLI si se actualiza Next.
- Eliminar archivos duplicados y comentarios obvios.

## 9. Priorizacion recomendada

### P0 - Antes de produccion

1. Actualizar o planificar upgrade seguro de Next.js por vulnerabilidades criticas.
2. Eliminar `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` y rotar claves si aplica.
3. Revalidar empresa en `selectCompany` y en cada server action multiempresa.
4. Centralizar RBAC y aplicar permisos a todas las mutaciones admin.
5. Sanitizar HTML CMS y escapar HTML de correos.
6. Reemplazar `targetEmail` cliente por allowlist server-side.

### P1 - Corto plazo

1. Agregar rate limiting al contacto y acciones sensibles.
2. Validar archivos subidos.
3. Reducir logs de debug en produccion.
4. Dividir `BingoManagerClient` y acciones grandes.
5. Agregar pruebas basicas y CI con `npm audit`, typecheck y build.

### P2 - Mediano plazo

1. Guia visual institucional.
2. Refactor de componentes admin hacia un sistema de UI consistente.
3. Optimizacion de consultas y realtime.
4. Auditoria de accesibilidad WCAG.
5. Limpieza de duplicados, `any` y configuracion TypeScript.

## 10. Checklist de aceptacion sugerido

- `npm audit` sin vulnerabilidades criticas/altas.
- Ninguna variable `NEXT_PUBLIC_*` contiene secretos.
- Todas las server actions admin llaman a helpers `requireUser`, `requireRoleLevel` y, si aplica, `requireCompanyAccess`.
- No hay `dangerouslySetInnerHTML` sin sanitizacion documentada.
- Formulario de contacto tiene allowlist server-side y rate limit.
- Cada upload valida tipo, tamano y nombre.
- Build y lint pasan en CI.
- Pruebas E2E cubren autenticacion, seleccion de empresa, CMS y contacto.
- UI validada en mobile/tablet/desktop sin scroll horizontal accidental.
- Contraste revisado para textos en amarillo y estados de foco visibles.

## 11. Conclusion

LaRioja tiene una estructura prometedora y una identidad visual reconocible, pero hoy depende demasiado de convenciones implicitas: cookies confiables, RLS no visible, permisos distribuidos y contenido CMS asumido como seguro. La mayor mejora no es estetica sino de gobierno tecnico: centralizar autorizacion, validar entradas, actualizar dependencias y formalizar los patrones de UI. Con esas correcciones, el proyecto puede evolucionar hacia una plataforma institucional mas robusta, mantenible y segura.
