# Flujo de Git: trabajo por turnos en `main`

> Estado: **vigente** · Fecha: 2026-10-08
> Reemplaza a [Plan_Rama_ClaudeCode.md](Plan_Rama_ClaudeCode.md) y [Plan_Rama_Devin.md](Plan_Rama_Devin.md) (descartados).

## 1. Decisión

Claude Code y Devin **nunca trabajan al mismo tiempo**, así que ambos siguen usando `main` en la misma carpeta (`C:\PlatziProject\LaRioja-Bingo\LaRioja`). No se usan ramas de trabajo ni worktrees.

El riesgo que queda es que **cada push a `main` despliega a producción** en Vercel. Se mitiga con cuatro medidas:

| Medida | Qué cubre |
|---|---|
| Hook `.githooks/pre-push` | Bloquea force-push y borrado de `main`. Corre `tsc --noEmit` antes de cada push. |
| Permisos `deny` de Claude Code (`.claude/settings.json`) | Impide a Claude usar `--force`, `--no-verify` y `reset --hard`. |
| Protocolo de turnos (`CLAUDE.md` y `.devin/rules/flujo-git.md`) | Evita pisarse cambios entre agentes. |
| Congelamiento y rollback | Reduce el impacto de errores de lógica, que ningún chequeo automático detecta. |

> Un `next build` que falla en Vercel **no** llega a producción: Vercel mantiene el despliegue anterior. Lo que sí llega son los errores de runtime o de lógica. Por eso son importantes la prueba local, el congelamiento y el rollback.

## 2. Protocolo de turnos

**Al iniciar**

1. `git status`. Si hay cambios sin commit del otro agente, avisar y no tocarlos.
2. `git pull --ff-only origin main`.

**Durante**

- Commits pequeños con conventional commits en español.
- Probar con `npm run dev` antes de subir cambios en `/registro`, `/ruleta`, `/tombola` o `/admin/bingo`.

**Al terminar**

- Dejar el working tree limpio: todo con commit y push, o descartado avisando.
- Verificar en Vercel que el despliegue quedó *Ready*.

**Prohibido**

- `--force`, `--no-verify`, `reset --hard` sobre trabajo publicado.
- Desactivar `.githooks`.

## 3. Hook `pre-push`

Archivo versionado: `.githooks/pre-push`. Se activa **una vez por clon**:

```bash
git config core.hooksPath .githooks
```

Qué hace:

1. Rechaza el borrado de `main` y cualquier push no fast-forward (force-push).
2. Si `origin/main` tiene commits que no están en local, pide `git pull --ff-only origin main`.
3. Avisa si quedan cambios sin commit.
4. Corre `npx tsc --noEmit` y aborta el push si hay errores.
5. Opcional: con `PREPUSH_BUILD=1` corre también `npm run build`.

No se activa con un script `prepare` de npm porque Vercel ejecuta `npm install` en un entorno donde ese `git config` podría fallar.

> `npm run lint` no se usa: Next 16 eliminó `next lint` y el proyecto no tiene configuración propia de ESLint.

## 4. Días de evento en vivo

Durante los días de evento no se hace **ningún push a `main`** sin aprobación explícita del dueño.

## 5. Si producción se rompe

1. En Vercel, ir a **Deployments**, elegir el despliegue anterior que funcionaba y aplicar **Instant Rollback / Promote to Production**.
2. Corregir con un **commit nuevo** en `main` (o `git revert <sha>`). Nunca reescribir historia.
3. Confirmar que el nuevo despliegue queda *Ready* antes de dar por cerrado el incidente.

## 6. Configuración manual en GitHub (dueño)

Crear un Ruleset sobre `main` (Settings → Rules → Rulesets) que:

- **bloquee force-push**;
- **bloquee el borrado** de la rama;
- **no exija Pull Request**, porque ambos agentes hacen push directo.

Así existe una barrera del lado del servidor aunque alguien use `--no-verify` o trabaje desde un clon sin el hook.

## 7. Verificación realizada (2026-10-08)

| Prueba | Resultado |
|---|---|
| Push fast-forward normal | Aceptado, `tsc` OK |
| Push no fast-forward (force) a `main` | Rechazado |
| Borrado de `main` | Rechazado |
| Push con un error de TypeScript | Rechazado, muestra el error de `tsc` |
