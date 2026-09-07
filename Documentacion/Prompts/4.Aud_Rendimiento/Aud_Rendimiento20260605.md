# **Informe de Auditoría de Rendimiento y Escalabilidad**

**Proyecto:** La-Rioja (https://github.com/eescalante58/La-Rioja.git)

**Fecha de Evaluación:** 5 de Junio de 2026

**Auditor:** Performance Engineer

A continuación se detalla el análisis de rendimiento identificando cuellos de botella, consumo excesivo de recursos y problemas de concurrencia en la aplicación.

## **1\. Consultas Ineficientes (Waterfall Requests y falta de límites)**

* **Cuellos de botella identificados:** 1\. Las funciones de listado (ej. getUsersWithRoles en src/app/admin/settings/users/actions.ts y métodos similares en el CMS y Bingo) solicitan todos los registros a la base de datos sin utilizar .limit(), .range() ni cursores.  
  2\. En paneles de control (Dashboards), la carga de métricas se realiza de forma secuencial (una tras otra) bloqueando la respuesta del servidor.  
* **Impacto estimado:** **Crítico**. A medida que la base de datos crezca, la memoria RAM del servidor Node.js se saturará (Out of Memory) al intentar parsear JSONs masivos. El TTFB (Time to First Byte) se degradará linealmente.  
* **Recomendación:** Implementar paginación a nivel de base de datos (.range()) y paralelizar peticiones independientes.  
* **Prioridad:** Crítica.  
* **Ejemplo de mitigación (Paralelización):**  
  // MAL: Operaciones secuenciales que suman tiempos (T1 \+ T2 \+ T3)  
  // const users \= await getUsers();  
  // const roles \= await getRoles();

  // BIEN: Promesas concurrentes (Max(T1, T2, T3))  
  const \[users, roles, countries\] \= await Promise.all(\[  
    getUsersWithRoles(page, limit),  
    getRoles(),  
    getCountryCodes()  
  \]);

## **2\. Memory Leaks y Concurrencia (Suscripciones Realtime)**

* **Cuellos de botella identificados:** El uso de Supabase Realtime (ej. en RealtimeDashboardWrapper.tsx o BingoManagerClient.tsx) es propenso a crear fugas de memoria y agotar el *connection pool* de WebSockets si los canales no se limpian y desuscriben explícitamente en el ciclo de vida del componente (useEffect cleanup).  
* **Impacto estimado:** **Alto**. Los clientes que dejen la pestaña del admin abierta o naveguen repetidamente entre vistas acumularán listeners fantasmas, provocando caídas del navegador de los administradores y facturación excesiva o bloqueo por límites en Supabase Realtime.  
* **Recomendación:** Garantizar que todo canal creado con supabase.channel(...) llame a supabase.removeChannel() en el retorno del useEffect.  
* **Prioridad:** Alta.  
* **Ejemplo de mitigación:**  
  useEffect(() \=\> {  
    const channel \= supabase  
      .channel('schema-db-changes')  
      .on('postgres\_changes', { event: '\*', schema: 'public', table: 'bingo\_events' }, payload \=\> {  
        handlePayload(payload);  
      })  
      .subscribe();

    // CLEANUP OBLIGATORIO PARA EVITAR MEMORY LEAKS  
    return () \=\> {  
      supabase.removeChannel(channel);  
    };  
  }, \[\]);

## **3\. Operaciones Costosas y Bloqueantes (Event Loop Starvation)**

* **Cuellos de botella identificados:** La generación masiva de entidades (como los cartones en GenerateCardsDialog.tsx o lógicas de facturación masiva del Bingo) ejecutada de forma síncrona en el hilo principal de Node.js (Server Action).  
* **Impacto estimado:** **Alto**. Dado que Node.js es de un solo hilo (Single-threaded), un bucle for o while extenso que genere criptográficamente o asigne miles de cartones de bingo detendrá completamente el *Event Loop*. Ningún otro usuario podrá hacer login o cargar páginas hasta que el bucle termine.  
* **Recomendación:** Mover los cálculos criptográficos o matemáticos masivos a *Edge Functions* de Supabase, Web Workers, o fragmentar la operación usando setImmediate o procesamientos por lotes (Batch processing).  
* **Prioridad:** Alta.

## **4\. Cálculos Repetitivos y Loops Innecesarios en SSR**

* **Cuellos de botella identificados:** En src/app/about/page.tsx, el Helper getSection(key) itera sobre todo el array de contenido del CMS repetidas veces usando content.find() para cada sección de la página.  
* **Impacto estimado:** **Bajo**. Resulta en un costo computacional O(N \* M) repetitivo en cada *Render* del servidor. Aunque el impacto actual es de pocos milisegundos, es una ineficiencia arquitectónica.  
* **Recomendación:** Convertir el array a una tabla hash (Objeto / Map) una única vez, transformando la búsqueda a O(1).  
* **Prioridad:** Media.  
* **Ejemplo de mitigación:**  
  // Transformación O(N) una sola vez  
  const contentMap \= content.reduce((acc, curr) \=\> {  
    acc\[curr.section\_key\] \= curr;  
    return acc;  
  }, {} as Record\<string, any\>);

  // Acceso O(1) repetitivo  
  const hero \= contentMap\["about\_hero"\];  
  const mission \= contentMap\["about\_mission"\];

## **5\. Uso Excesivo de Recursos (Imágenes sin compresión y Cache Misses)**

* **Cuellos de botella identificados:** 1\. La función uploadUserAvatar sube el binario original (FormData) directamente al Storage sin procesar. Si el usuario sube una imagen de 10MB desde un iPhone, se almacenarán y descargarán 10MB constantemente.  
  2\. Uso de revalidate \= 3600 en páginas controladas por el CMS. Durante esa hora, los administradores no verán los cambios. Si reducen el tiempo, el servidor se penaliza haciendo Fetch a la base de datos repetitivamente, perdiendo los beneficios de caché estático (ISR).  
* **Impacto estimado:** **Medio**. Consumo excesivo de cuota de ancho de banda y degradación de la métrica LCP (Largest Contentful Paint).  
* **Recomendación:** 1\. Interceptar la imagen en el cliente o en el servidor y comprimirla a .webp (usando librerías como sharp o la API de compresión del navegador) antes de subirla a Supabase.  
  2\. Implementar **On-Demand Revalidation** (revalidación bajo demanda). Quitar el tiempo de expiración y usar revalidatePath('/about') dentro de la Server Action CMSEditForm cuando se actualice un registro, logrando un hit rate de caché del 100%.  
* **Prioridad:** Media.

### **Resumen de Recomendaciones del Performance Engineer**

Para llevar la aplicación a un nivel Enterprise, es mandatario:

1. Poner **límites explícitos** a TODAS las consultas SQL enviadas mediante el cliente de Supabase.  
2. Limpiar las suscripciones de **WebSocket** para prevenir Memory Leaks en el panel administrativo.  
3. Adoptar **Server-Side Pagination** para las tablas de datos.  
4. **Optimizar las imágenes** antes de impactar el Storage.