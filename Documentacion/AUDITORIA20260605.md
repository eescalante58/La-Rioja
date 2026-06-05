# **Informe de Auditoría Técnica y Arquitectura del Proyecto LaRioja**

**Fecha de Evaluación:** 5 de junio de 2026  
**Documento de Referencia Anterior:** AUDITORIA.md (25 de mayo de 2026\)  
**Estado del Proyecto:** En Desarrollo Avanzado / Fase de Mitigación de Vulnerabilidades

## **1\. Resumen Ejecutivo**

Este informe constituye una segunda auditoría profunda sobre la base de código actual del proyecto **LaRioja**, contrastando el estado de los archivos fuente (contact.ts, select-company/page.tsx, users/actions.ts y package.json) con los hallazgos críticos reportados el 25 de mayo de 2026\. La evaluación actual revela que, si bien se han registrado notas de resolución en ciertos aspectos de UI/Responsividad, los vectores de ataque más críticos relacionados con la lógica de negocio en el servidor y la gestión de secretos siguen expuestos en el código fuente, requiriendo intervención urgente antes de un despliegue seguro a producción.

## **2\. Evaluación de la Implementación de Recomendaciones Anteriores**

| Hallazgo Técnico Previo (AUDITORIA.md) | Nivel de Riesgo Original | Estado de Implementación Real en Código | Dictamen de Auditoría Actual   |
| :---- | :---- | :---- | :---- |
| **Dependencias con vulnerabilidades críticas (\`next@14.2.16\`)** | Crítico | package.json mantiene fijas las versiones vulnerables ("next": "14.2.16" y "eslint-config-next": "14.2.16"). | **NO IMPLEMENTADO** |
| **Service Role Key potencialmente público (\`NEXT\_PUBLIC\_...\`)** | Crítico | El archivo contact.ts y users/actions.ts siguen recurriendo como fallback a NEXT\_PUBLIC\_SUPABASE\_SERVICE\_ROLE\_KEY en el servidor. | **NO IMPLEMENTADO** |
| **Selección de empresa manipulable en cliente** | Alto | El Server Action selectCompany en select-company/page.tsx procesa ciegamente el formulario sin comprobar la membresía en user\_companies. | **NO IMPLEMENTADO** |
| **RBAC inconsistente en acciones administrativas** | Alto | Funciones críticas como removeUserFromCompany y updateUserCompanyRole carecen de llamadas a checkMinLevel o validación equivalente. | **NO IMPLEMENTADO** |
| **Formulario de contacto con destinatario controlado por cliente** | Alto | El payload de submitContactForm continúa aceptando targetEmail directo desde los inputs del cliente. | **NO IMPLEMENTADO** |
| **HTML no escapado en correos (Inyección de código)** | Alto | La plantilla de Resend interpola directamente las variables del string literal sin funciones de sanitización o escape previo. | **NO IMPLEMENTADO** |
| **Mitigación visual, contraste y rejillas responsivas** | Medio / Bajo | El archivo de auditoría registra la bandera "RESUELTO 25/6/2026" para la tipografía, rejillas y contrastes. Estructura visual mejorada. | **COMPLETADO (UI)** |

*Nota Crítica de Auditoría:* Existe una discrepancia severa entre el estado declarado en el registro de auditoría visual del front-end (marcado como resuelto) y la cruda realidad de la lógica de control del back-end, la cual sigue padeciendo las mismas fallas estructurales de seguridad originales.

## **3\. Análisis Arquitectónico Avanzado y Escalabilidad**

### **3.1. Acoplamiento y Centralización de Autorización**

La lógica de control de acceso basada en roles (RBAC) sigue estando dispersa e integrada de manera ad-hoc dentro de cada Server Action en lugar de ser un Middleware de software o una capa interceptora dedicada. El uso de la función inline checkMinLevel(minLevel) es un avance, pero al requerir una consulta asíncrona manual contra Supabase (supabase.from("users").select(...)) en cada mutación individual, introduce latencias añadidas y fomenta errores de omisión por parte de los desarrolladores (como se evidencia en las funciones de desvinculación de empresas).

### **3.2. Modelo Multi-Inquilino (Multi-Company Tenant Security)**

El sistema confía en exceso en el estado de las cookies de Next.js (selected\_company\_id) establecidas en el navegador. En una arquitectura segura multi-inquilino, el identificador de la empresa del contexto activo jamás debe ser tomado como una verdad absoluta desde la cookie de la petición sin una re-verificación criptográfica o una consulta de pertenencia del usuario en sesión en la capa de datos (RLS) o repositorios intermedios.

## **4\. Vulnerabilidades y Riesgos de Seguridad Detectados (Deep-Dive)**

### **4.1. Fuga Potencial de Service Role en Bundle de Cliente**

A pesar de que el helper createClient se ejecuta del lado del servidor, el simple hecho de que la constante de entorno mantenga el prefijo de Next.js (NEXT\_PUBLIC\_SUPABASE\_SERVICE\_ROLE\_KEY) obliga al compilador de Webpack/Turbopack a incluir la variable en la matriz de reemplazos en tiempo de compilación. Si por error un desarrollador importa una función del servidor o un helper compartido en un archivo con la directiva "use client", la clave Maestra de Supabase (que salta cualquier política de seguridad RLS) se inyectará directamente en texto plano en los archivos JavaScript públicos descargados por los navegadores.

### **4.2. Inyección de Plantillas de Correo (HTML/SMTP Injection)**

En el archivo src/app/actions/contact.ts, observamos la siguiente construcción de código:  
`` html: ` ``  
  `<div style="...">`  
    `<p><strong>Nombre:</strong> \${data.name}</p>`  
    `<div style="...">`  
      `<p><strong>Mensaje:</strong></p>`  
      `<p>\${data.message.replace(/\\n/g, "<br>")}</p>`  
    `</div>`  
  `</div>`  
`` ` ``

Si un atacante envía un payload en el campo message que contenga etiquetas estructuradas como \<html\>, \<iframe\>, o estilos CSS maliciosos, Resend procesará e inyectará el código directamente en el buzón del destinatario. Esto no solo facilita ataques de Phishing dirigidos a los administradores de la organización, sino que destruye la reputación del dominio remitente en los servidores de correo mundiales.

## **5\. Problemas de Rendimiento y Optimización**

* **Consultas síncronas repetitivas a metadatos de usuario:** Cada llamada interna a checkMinLevel vuelve a consultar la tabla de perfiles de usuario de Supabase. Al no contar con un mecanismo de almacenamiento en caché por solicitud (como el patrón cache de React para Server Components/Actions), el servidor genera múltiples consultas redundantes a la base de datos dentro del ciclo de vida de una sola petición web.  
* **Ausencia de Esquemado y Parseo Eficiente:** Las entradas de formularios se procesan mediante conversión tipada explícita (as string o tipos any). La falta de validación estructural previa (ej. con librerías de tipado estricto en runtime como Zod) obliga al motor de Next.js a procesar payloads de tamaño indeterminado, elevando el uso de memoria en funciones Serverless bajo ataques de denegación de servicio (DoS).

## **6\. Plan de Acción de Remediación Inmediata (Priorizado)**

### **P0: Seguridad Absoluta e Infraestructura (Plazo: 24-48 horas)**

1. **Eliminar el Secreto Público:** Modificar los entornos de desarrollo, staging y producción para eliminar NEXT\_PUBLIC\_SUPABASE\_SERVICE\_ROLE\_KEY. Configurar exclusivamente SUPABASE\_SERVICE\_ROLE\_KEY asegurando que no tenga prefijos públicos.  
2. **Sanitizar las Entradas de Correo:** Introducir una función de escape de caracteres HTML antes de realizar la interpolación en Resend:  
   `function escapeHTML(str: string) {`  
     `return str.replace(/[&<>"']/g, (m) => ({`  
       `'&': '&', '<': '<', '>': '>', '"': '"', "'": '''`  
     `})[m]);`  
   `}`  
         
3. **Asegurar la Mutación Multi-Inquilino:** Modificar el action selectCompany para validar la relación del usuario:  
   `const { data } = await supabase`  
     `.from("user_companies")`  
     `.select("company_id")`  
     `.eq("user_id", user.id)`  
     `.eq("company_id", companyId)`  
     `.single();`

   `if (!data) throw new Error("Acceso denegado a la entidad solicitada.");`  
       

### **P1: Consolidación Arquitectónica y Dependencias (Plazo: Corto Plazo)**

* **Actualización de Parches de Next.js:** Migrar la versión del core en package.json desde la vulnerable 14.2.16 a la última versión estable segura dentro de la rama principal (ej. 14.2.36+) para mitigar bypass de middlewares o envenenamientos de caché, evaluando un salto planificado a Next.js 15\.  
* **Centralización del RBAC Admin:** Crear un interceptor de seguridad unificado en src/lib/auth/guards.ts para envolver todas las funciones que realicen mutaciones en el panel administrativo, eliminando las brechas de validación detectadas en removeUserFromCompany.

## **7\. Conclusión de la Evaluación**

El proyecto **LaRioja** muestra un excelente avance en cuanto al orden visual de sus módulos, la resolución de su diseño responsivo en interfaces móviles y la parametrización tipográfica institucional. No obstante, las brechas de seguridad presentes en la lógica de procesamiento del servidor (Server Actions) neutralizan gran parte de estos esfuerzos. La priorización debe enfocarse de inmediato en el robustecimiento del control de accesos del servidor y en la estricta separación de los secretos del backend antes de realizar cualquier tipo de apertura o pruebas de producción con usuarios reales.