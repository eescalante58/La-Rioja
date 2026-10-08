# Plan: flujo de Git con rama `Devin` (contraparte de `ClaudeCode`)

> Estado: **descartado** — se eligió seguir en `main` por turnos (ver [Plan_Flujo_Main.md](Plan_Flujo_Main.md)) · Fecha: 2026-10-08
> Complementa a [Plan_Rama_ClaudeCode.md](Plan_Rama_ClaudeCode.md). Conviene ejecutar ambos juntos.

## 1. Contexto

- Devin hoy hace commits y push directamente a `main`, y cada push a `main` despliega a producción en Vercel.
- **Objetivo:** que Devin trabaje solo en la rama `Devin` y que sus cambios lleguen a `main` únicamente por Pull Request, igual que Claude Code con `ClaudeCode`.

Situación resultante:

```
ClaudeCode ──► PR ──┐
                    ├──► main ──► producción (Vercel)
Devin      ──► PR ──┘
```

## 2. Hallazgos que cambian el diseño

### 2.1 Un solo checkout para los dos agentes ⚠️

Hoy existe una sola carpeta de trabajo: `C:\PlatziProject\LaRioja-Bingo\LaRioja`. Una carpeta git solo puede estar en una rama a la vez. Si Claude hace `git checkout ClaudeCode` mientras Devin trabaja ahí, Devin pasa a editar `ClaudeCode` sin enterarse, y viceversa.

**Solución: `git worktree`.** Un mismo repositorio con una carpeta por rama, que comparten historial y `.git`:

| Carpeta | Rama | Quién la usa |
|---|---|---|
| `C:\PlatziProject\LaRioja-Bingo\LaRioja` | `ClaudeCode` | Claude Code |
| `C:\PlatziProject\LaRioja-Bingo\LaRioja-Devin` | `Devin` | Devin |

Cada agente abre **siempre su carpeta**. `main` no queda en ninguna carpeta de trabajo: se actualiza solo por PR en GitHub. Git impide tener la misma rama en dos worktrees, lo que agrega protección.

> Cada worktree necesita su propio `node_modules` (`npm install --legacy-peer-deps`) y su propio `.env.local`, que es una copia y no se versiona. Para correr los dos `npm run dev` a la vez, Devin usa otro puerto: `npm run dev -- -p 3001`.

### 2.2 Devin hace push con la identidad del dueño del repo

Todos los commits recientes, de Devin y del dueño, salen como `Yayo Escalante`, con las mismas credenciales de GitHub. Consecuencias:

- En GitHub no se puede dar un *bypass* "solo a Devin": el bypass sería también para Claude y para cualquier push desde esta PC.
- Por eso, en el lado de Devin, el candado tiene que ser **local**: reglas de Devin y git hooks del repositorio.
- **Ajuste al plan de ClaudeCode:** el Ruleset de `main` ya no necesita bypass para Devin, porque Devin también entra por PR. Ver §3.6.

### 2.3 Devin no usa los hooks de Claude Code

`.claude/settings.json` y `.claude/hooks/rama.mjs` solo los ejecuta Claude Code. Devin lee sus reglas desde `.devin/rules/*.md` (formato con `trigger: always_on`, igual que `no-rerender-completo.md` y `code-documentation.md`).

Para que el bloqueo no dependa de que el agente "recuerde" la regla, se agregan **git hooks del repositorio**. Git los ejecuta para cualquiera que haga commit o push desde estas carpetas: Devin, Claude o una persona.

## 3. Pasos de implementación

### 3.1 Crear la rama `Devin` y su worktree

Desde `LaRioja/`, ya en `ClaudeCode` según el otro plan:

```bash
git fetch origin
git worktree add -b Devin ../LaRioja-Devin origin/main
git -C ../LaRioja-Devin push -u origin Devin
```

Después, preparar el worktree:

```bash
cd ../LaRioja-Devin
npm install --legacy-peer-deps
cp ../LaRioja/.env.local .env.local
```

### 3.2 Regla escrita para Devin: `.devin/rules/flujo-git.md`

```markdown
---
trigger: always_on
---

# Regla: Flujo de Git (obligatorio)

- Trabaja SOLO en la rama `Devin`, en la carpeta `C:\PlatziProject\LaRioja-Bingo\LaRioja-Devin`.
  Nunca abras ni edites la carpeta `LaRioja` (es de Claude Code, rama `ClaudeCode`).
- Al iniciar ejecuta `git branch --show-current`. Si no es `Devin`, detente y avísame. No hagas `git checkout` a otra rama.
- Antes de trabajar, trae lo nuevo de `main`: `git fetch origin && git merge origin/main`. Si hay conflictos, avísame antes de resolverlos.
- Commits pequeños, conventional commits en español (`fix(students): ...`), con push a `origin/Devin`.
- Prohibido: commit, merge o push a `main`; `git push --force` / `-f`; mezclar la rama `ClaudeCode` en `Devin`.
- Los cambios llegan a `main` solo mediante Pull Request que el dueño aprueba.
- Los git hooks de `.githooks/` bloquean estas acciones. No los desactives ni uses `--no-verify`.
```

### 3.3 Candado común: git hooks del repositorio (`.githooks/`)

Son scripts versionados que se activan una sola vez por clon con `git config core.hooksPath .githooks`. Ese valor queda en `.git/config` y lo comparten todos los worktrees.

- **`.githooks/pre-commit`:** rechaza el commit si la rama actual es `main` o si está en detached HEAD.
- **`.githooks/pre-push`:** recibe por stdin las refs a publicar y rechaza
  - cualquier push cuyo destino sea `refs/heads/main`;
  - el borrado de ramas remotas;
  - un push no fast-forward a `ClaudeCode` o `Devin`. Así se evita reescribir historia publicada; si alguna vez hace falta, se usa `--force-with-lease` conscientemente y desde el hook de Claude.

Ambos scripts en `sh` (Git for Windows los ejecuta con su bash), con mensajes en español que indiquen qué hacer.

Un git hook se puede saltar con `--no-verify`. Por eso la regla de Devin lo prohíbe expresamente, y el Ruleset de GitHub (§3.6) queda como última barrera.

### 3.4 Ajustes al plan de ClaudeCode

- `CLAUDE.md` ("Flujo de Git"): agregar que Claude **solo** trabaja en `LaRioja/`, que nunca toca `LaRioja-Devin/` y que no debe mezclar la rama `Devin` en `ClaudeCode`.
- `.claude/hooks/rama.mjs`: además de exigir `ClaudeCode`, bloquear ediciones con `file_path` dentro de `LaRioja-Devin/`. Esto ya se cumple, porque solo se permiten rutas dentro de `CLAUDE_PROJECT_DIR`.
- Agregar `.githooks/` al mismo commit de `chore(git)`.

### 3.5 Coordinación entre las dos ramas

- **Sincronizar seguido:** cada agente hace `git fetch origin && git merge origin/main` al empezar y antes de abrir un PR.
- **Nunca mezclar `ClaudeCode` ↔ `Devin` entre sí.** Todo pasa por `main`, para que cada PR muestre solo el trabajo de un agente.
- **PRs pequeños y frecuentes**, para reducir conflictos entre agentes que tocan las mismas zonas (`/admin/bingo`, `actions.ts`, `REGISTRY` de `/api/actions`).
- **Reparto de trabajo:** evitar asignar a los dos agentes, al mismo tiempo, tareas sobre los mismos archivos. Una nota en `Planificacion/` o en la bitácora con "quién trabaja en qué" alcanza.
- **Migraciones SQL** (`supabase/migrations/`): se aplican manualmente a la base de producción. Aplicarlas solo después de que su PR llegue a `main`, y numerarlas sin choques entre ramas.

### 3.6 GitHub y Vercel (configuración manual del dueño)

- **Ruleset de `main`** (Settings → Rules → Rulesets), corrigiendo el plan de ClaudeCode:
  - exigir Pull Request antes de mergear;
  - bloquear force-push y el borrado de la rama;
  - **sin bypass para Devin**, porque ahora también entra por PR. Si se quiere una salida de emergencia, dejar bypass solo para el rol *Repository admin*, en modo "solo para pull requests". Así se puede mergear un PR sin aprobación en una urgencia, pero no hacer push directo.
- **Vercel:** las ramas `ClaudeCode` y `Devin` generarán *Preview Deployments*. Verificar que las variables de entorno existan en el entorno **Preview**. Ojo: los previews usan la misma base de Supabase de producción, salvo que se configure el staging de [Ambiente_staging.md](Ambiente_staging.md). Revisar con cuidado los previews que escriben datos.

## 4. Archivos afectados

| Archivo | Cambio |
|---|---|
| `.devin/rules/flujo-git.md` | Nuevo: regla de Git para Devin |
| `.githooks/pre-commit` | Nuevo: bloquea commits en `main` |
| `.githooks/pre-push` | Nuevo: bloquea push a `main`, borrados y no fast-forward |
| `CLAUDE.md` | Ajuste de la sección "Flujo de Git" (worktrees, no mezclar ramas) |
| `Documentacion/Plan_Rama_ClaudeCode.md` | Ajuste: Ruleset sin bypass para Devin |
| `.git/config` (local, no versionado) | `core.hooksPath = .githooks` |

## 5. Orden de ejecución sugerido

1. Commit del trabajo pendiente en `main` → crear `ClaudeCode` (plan ClaudeCode §3.1).
2. Crear el worktree `LaRioja-Devin` con la rama `Devin` (§3.1).
3. Agregar `.githooks/`, `.devin/rules/flujo-git.md` y los ajustes de Claude en `ClaudeCode`, y activar `core.hooksPath`.
4. Push de `ClaudeCode` → PR a `main` → merge. Así las reglas y hooks llegan a `main`.
5. En `LaRioja-Devin`: `git merge origin/main` para que Devin reciba sus reglas y los hooks.
6. Configurar el Ruleset en GitHub y revisar las variables Preview en Vercel.
7. Avisar a Devin que desde ahora abre la carpeta `LaRioja-Devin`.

## 6. Verificación

| Prueba | Dónde | Resultado esperado |
|---|---|---|
| `git worktree list` | cualquiera | Dos carpetas: `ClaudeCode` y `Devin` |
| `git checkout ClaudeCode` | `LaRioja-Devin` | Git lo rechaza (rama en uso en otro worktree) |
| Commit con HEAD en `main` (prueba con `git switch --detach origin/main`) | cualquiera | `pre-commit` lo rechaza |
| `git push origin HEAD:main` | `LaRioja-Devin` | `pre-push` lo rechaza |
| `git push --force` sobre historia reescrita | `LaRioja-Devin` | `pre-push` lo rechaza |
| `git push` normal | `LaRioja-Devin` | Se acepta y aparece el preview en Vercel |
| Push directo a `main` (desde un clon sin hooks) | GitHub | El Ruleset lo rechaza |
| Pedirle a Devin "haz commit en main" | Devin | Se niega citando `flujo-git.md`; si lo intenta, el hook lo bloquea |
| PR `Devin` → `main` | GitHub | Se puede mergear solo vía PR |
