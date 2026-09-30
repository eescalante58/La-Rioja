# Análisis y Comentarios sobre el Algoritmo de Sorteos (Ruleta/Tómbola)

Este documento resume el análisis de los algoritmos de selección de ganadores para el sistema de La Rioja y las validaciones técnicas de su implementación.

## 1. Análisis del Algoritmo (Propuesta del Usuario)

Para un sistema de ruleta/tómbola, hay dos preguntas clave: qué algoritmo usar para elegir al ganador y cómo garantizar que el resultado sea justo y no manipulable.

### Selección del Ganador
Depende de la distribución de probabilidad deseada:

*   **Probabilidad Uniforme:** Todos los elementos tienen la misma probabilidad.
    *   **Pocos elementos (Ruleta de Premios):** Un simple índice aleatorio es óptimo: `indice_ganador = numero_aleatorio_seguro(0, cantidad_de_elementos - 1)`.
    *   **Muchos elementos (Tómbola de Participantes):** Delegar en la base de datos es lo más práctico. En Postgres:
        ```sql
        SELECT * FROM wheels_presents_cards
        WHERE wheel_id = $1 AND is_winner = false
        ORDER BY random()
        LIMIT 1;
        ```
*   **Probabilidad Ponderada:** Algunos premios tienen más frecuencia que otros.
    *   **Suma acumulada + búsqueda binaria:** Construir un arreglo de sumas acumuladas de los pesos y buscar el segmento donde cae un número aleatorio entre 0 y el total. O(log n).
    *   **Stock como Peso:** El "peso" natural puede ser el stock actual. Al llegar a 0, el elemento sale del cálculo automáticamente.

### Seguridad y Transparencia
*   **Decisión en Servidor:** El sorteo debe decidirse en el servidor o BD, nunca en el navegador, para evitar manipulaciones mediante herramientas de desarrollador.
*   **Generador Criptográficamente Seguro:** Usar `crypto.randomInt(0, n)` en lugar de `Math.random()`, ya que este último es teóricamente predecible.
*   **Desacoplamiento Sorteo-Animación:** El patrón correcto es:
    1. El servidor decide el ganador de forma atómica.
    2. El cliente recibe el resultado.
    3. La animación es puramente cosmética, girando hasta el segmento ya decidido.
*   **Commit-Reveal:** Para transparencia pública total, publicar un hash de una semilla antes del sorteo y revelarla después para que cualquiera pueda verificar el resultado.

---

## 2. Comentarios Técnicos y Validación de Implementación

Basado en la arquitectura actual de **La Rioja**, se validan los siguientes puntos:

### Estado Actual de la Implementación
*   **Tómbola de Participantes:** El sistema ya utiliza la delegación en base de datos mediante un RPC (`register_participant_cards`) que asegura atomicidad y usa `ORDER BY random()` para una aleatoriedad uniforme y segura.
*   **Ruleta de Premios:** Se utiliza un Route Handler (`/api/wheel/spin`) para que la decisión ocurra en el servidor. El resultado se registra en la base de datos (con auditoría) antes de que el cliente inicie la animación.
*   **Desacoplamiento:** El componente `WheelOfFortune.tsx` recibe el índice ganador del servidor y solo se encarga de la representación visual, cumpliendo con el principio de que la animación sea cosmética y no el mecanismo de decisión.

### Recomendaciones de Mejora (Roadmap)
1.  **Calidad de Aleatoriedad:** Migrar de `Math.random()` a `crypto.randomInt` en las rutas de Node.js (`/api/wheel/spin`) para elevar el estándar de seguridad a nivel criptográfico.
2.  **Pesos por Stock:** Actualmente, el sistema trata cada segmento con stock disponible como equiprobable. Se podría implementar el algoritmo de **Suma Acumulada** si se desea que un premio con stock 10 tenga 10 veces más probabilidad de salir que uno con stock 1 en el mismo giro.
3.  **Auditoría Reforzada:** El **Historial de Giros** ya implementado (con timestamp, usuario y premio) proporciona una base sólida de transparencia. Se podría añadir un hash de verificación para demostrar que los registros no han sido alterados post-sorteo.

### Conclusión
El sistema de La Rioja es **arquitectónicamente sólido**. Cumple con el desacoplamiento necesario y la centralización de la lógica en el servidor. Las mejoras sugeridas representan un paso hacia un sistema de sorteos de alta seguridad y transparencia absoluta.
