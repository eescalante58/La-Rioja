# Regla: Prohibido el uso de `any`

En este proyecto de React + TypeScript **no se debe usar `any`**. `any` apaga la
validación de tipos y elimina las ventajas de TypeScript. Definir explícitamente
las estructuras de datos y aprovechar el sistema de tipos.

## Configuración estricta

- `strict: true` en `tsconfig.json` (ya activo — incluye `noImplicitAny`).
- TypeScript debe avisar con error cada vez que infiera `any` implícitamente.
- Nunca relajar estas opciones para silenciar errores; corregir el tipo.

## Tipado de Props y Estado

- **Interfaces o Type Aliases** para las props de cada componente:
  ```ts
  interface Props { nombre: string; edad: number; }
  const MiComponente = ({ nombre, edad }: Props) => ...
  ```
- **Genéricos en `useState`** cuando el valor inicial no define el tipo
  (estado en `null` o arreglo vacío):
  ```ts
  const [user, setUser] = useState<User | null>(null);
  ```

## Manejo de eventos y datos externos

- **Eventos de React**: usar los tipos nativos de React en los manejadores —
  `React.ChangeEvent<HTMLInputElement>` para inputs, `React.FormEvent` para
  formularios, `React.MouseEvent` para clicks. Nunca `(e: any)`.
- **Validación en la frontera**: datos de APIs externas o `fetch` se validan
  con **Zod** (ya es dependencia del proyecto) para garantizar la estructura en
  runtime, en lugar de `as any` o castings inseguros.
- **`unknown` para lo desconocido**: si el tipo de un dato externo no se conoce,
  usar `unknown` en vez de `any` — obliga a validar antes de usarlo.

## Excepción controlada

Los payloads de Supabase Realtime (`payload.new`/`payload.old`) llegan como
`Json`/`any` de la librería. En ese caso se castea al tipo conocido de la tabla
(`as WheelItem`, `as Partial<WheelItem>`), nunca se deja como `any` suelto en
la lógica.
