# **Evaluación de Arquitectura Empresarial**

**Proyecto:** La-Rioja

**Fecha de Evaluación:** 5 de Junio de 2026

**Auditor:** Enterprise Software Architect

Este documento presenta una evaluación exhaustiva de la topología y decisiones arquitectónicas del sistema, analizando su preparación para escalar a un nivel "Enterprise".

## **I. Análisis de los Pilares Arquitectónicos**

### **1\. Estructura de Carpetas**

La estructura sigue las convenciones base de Next.js App Router (src/app, src/components, src/lib).

* **Diagnóstico:** Es adecuada para proyectos pequeños y medianos, pero comienza a mostrar signos de fatiga. Al no utilizar una arquitectura orientada a dominios (Domain-Driven Design), los dominios de negocio (ej. Bingo, CMS, Usuarios) tienen su lógica, UI y validaciones dispersas entre app/admin/..., components/admin/... y lib/validation/....

### **2\. Separación de Responsabilidades (SoC)**

* **Diagnóstico:** Deficiente. Se ha adoptado un patrón de "Smart UI" (UI Inteligente). Por ejemplo, los *Server Actions* (ej. contact.ts) actúan como controladores HTTP, validadores, orquestadores de bases de datos y clientes de servicios de terceros (Resend) al mismo tiempo. Los componentes como about/page.tsx mezclan fetching de datos, lógica de negocio y marcado visual.

### **3\. Capas de Aplicación**

* **Diagnóstico:** Falta una definición estricta de capas. La aplicación salta directamente de la capa de Presentación (React) y Enrutamiento (Next.js) a la capa de Acceso a Datos (Supabase client). No existe una **Capa de Servicios** formal ni un **Patrón Repositorio**, lo que hace que cambiar de proveedor de base de datos o aislar la lógica de negocio para pruebas sea casi imposible en su estado actual.

### **4\. Escalabilidad**

* **Diagnóstico:** Mixta.  
  * *Horizontal:* Excelente. Al estar alojada en infraestructuras Serverless (Vercel/Next.js) y usar Supabase (PostgreSQL en la nube), la infraestructura puede escalar horizontalmente sin fricción.  
  * *Vertical / Algorítmica:* Pobre. La falta de paginación a nivel de base de datos (.limit(), .range()) y la carga de componentes masivos en el cliente (God Components) limitarán severamente la capacidad de la aplicación para manejar grandes volúmenes de datos por sesión.

### **5\. Seguridad**

* **Diagnóstico:** En vías de maduración. La integración de Zod para la validación de esquemas y los Guards de autorización (withRole, requireRoleLevel) son excelentes cimientos. Sin embargo, carece de controles empresariales como manejo estricto de transacciones (para evitar inconsistencias de datos) y sanitización automatizada en los flujos de Storage (Path Traversal/XSS vía uploads).

### **6\. Testing**

* **Diagnóstico:** Inmaduro. Se observa la presencia de Playwright (tests/responsiveness.spec.ts), lo cual cubre regresiones visuales básicas. Sin embargo, hay una ausencia total de pruebas unitarias (Jest o Vitest) y pruebas de integración para la lógica de negocio (Server Actions, Schemas, Auth Guards). Un sistema enterprise requiere la pirámide de testing completa.

### **7\. Observabilidad**

* **Diagnóstico:** Rudimentaria. Existe una tabla user\_activity\_log para auditoría interna de acciones de usuarios, pero el sistema depende completamente de console.log / console.error. No hay telemetría distribuida (OpenTelemetry), APM (Application Performance Monitoring) ni reporte centralizado de excepciones (como Sentry o Datadog).

### **8\. Mantenibilidad**

* **Diagnóstico:** Riesgo moderado-alto. El uso de TypeScript (strict mode) y utilidades estandarizadas (Tailwind, Radix UI) mitiga la degradación. No obstante, la existencia de archivos monolíticos ("God Objects") de cientos de líneas y el acoplamiento fuerte de dependencias externas harán que la curva de aprendizaje para nuevos desarrolladores sea alta y los refactors, peligrosos.

## **II. Resultados de la Evaluación**

### **1\. Fortalezas**

* **Stack Tecnológico Moderno:** La elección de React 19, Next.js 16 y Supabase provee un ecosistema con un ciclo de vida largo y excelente soporte comunitario.  
* **Seguridad de Tipos Perimetral:** El uso de Zod en las fronteras de las *Server Actions* protege contra inyecciones de datos malformados.  
* **Sistema de Diseño Consistente:** La integración de Tailwind con componentes pre-construidos (shadcn/ui o radix) asegura una UI cohesiva.  
* **Fundamentos de RBAC:** El middleware y los guards (withRole) demuestran que la seguridad se pensó desde el inicio, no como un parche posterior.

### **2\. Debilidades**

* **Ausencia de Transaccionalidad:** Mutaciones que tocan múltiples tablas (o Auth \+ Schema) no tienen transacciones, exponiendo a la base de datos a un estado corrupto/huérfano.  
* **Lógica de Negocio Acoplada al Enrutador:** Las Server Actions están atadas a Next.js y hacen demasiadas cosas.  
* **Falta de Pruebas Automatizadas (Unitarias):** La validación de que el software funciona depende de pruebas manuales.  
* **Manejo de Errores Inconsistente:** Diferentes funciones devuelven diferentes formatos de error, y se abusa del catch (error: any).

### **3\. Riesgos Futuros**

* **Deuda Técnica por Monolitos Front-end:** Componentes como los \*ManagerClient en el panel de administración se volverán inmanejables (código espagueti) a medida que el negocio requiera más funcionalidades.  
* **Saturación del Storage/DB:** Sin límites de tasa (Rate Limits), paginación y validación estricta de subidas, el sistema es susceptible a ataques de Denegación de Servicio (DoS) financiero o de recursos.  
* **Fugas de Memoria:** Suscripciones a WebSockets (Realtime) mal gestionadas degradarán el rendimiento de los clientes en sesiones largas.

## **III. Plan de Acción y Recomendaciones**

### **4\. Recomendaciones a Corto Plazo (1-3 Meses)**

1. **Refactorización de Transacciones:** Trasladar la lógica de creación de usuarios (Auth \-\> Public DB) a un **Database Trigger** en PostgreSQL (Supabase) para garantizar atomicidad.  
2. **Paginación Universal:** Modificar todas las llamadas de lectura a listas en las *Server Actions* para que requieran parámetros page y pageSize, utilizando .range() de Supabase.  
3. **Observabilidad Inmediata:** Integrar Sentry u otra herramienta de monitoreo de errores para capturar excepciones silenciosas en el servidor (SSR) y en el cliente.  
4. **Desacoplar Monolitos:** Dividir componentes de más de 300 líneas en sub-componentes (ej. aislar las modales, las tablas y las gráficas en sus propios archivos).

### **5\. Recomendaciones a Largo Plazo (6-12 Meses)**

1. **Arquitectura Limpia / Hexagonal:** Extraer toda la lógica de negocio de las *Server Actions* hacia una capa de Servicios (src/services/UserService.ts, src/services/EmailService.ts). Las *Server Actions* deben ser solo controladores (adaptadores) que delegan el trabajo.  
2. **Feature Slices (Domain-Driven Design):** Reorganizar la estructura de carpetas por dominio de negocio (ej. src/features/bingo, src/features/cms) en lugar de agrupar todo por tipo de archivo (components, lib, etc.).  
3. **Cobertura de Pruebas (CI/CD):** Implementar Jest/Vitest para lograr al menos un 70% de cobertura en la capa de servicios y utilidades (schemas, calculadoras de precios).  
4. **Infraestructura como Código (IaC):** Migrar las reglas de RLS (Row Level Security), triggers y migraciones de esquemas de Supabase a archivos SQL versionados en el repositorio (Supabase CLI), en lugar de hacerlos manualmente desde el panel de control.

## **IV. Puntuación de Madurez Arquitectónica**

**PUNTUACIÓN: 58 / 100**

*Nivel Actual: **Startup / MVP Avanzado***

*Nivel Objetivo: **Enterprise / Mission-Critical***

**Justificación de la puntuación:** El proyecto aprueba con creces en la selección tecnológica y el cumplimiento de requisitos funcionales. Sin embargo, la falta de patrones de diseño empresariales (Separación de capas, Inyección de dependencias, Repositorios), la carencia de pruebas unitarias automatizadas y las fallas en transaccionalidad crítica restan 42 puntos. Con la adopción del plan a corto y largo plazo, el sistema puede alcanzar un puntaje superior a 85 en los próximos dos trimestres.