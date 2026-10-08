# Plan: flujo de Git con rama `ClaudeCode` y candados en Claude Code

> Estado: **descartado** — se eligió seguir en `main` por turnos (ver [Plan_Flujo_Main.md](Plan_Flujo_Main.md)) · Fecha: 2026-10-08

## 1. Contexto

- Hoy todo se trabaja en `main`, y **cada push a `main` despliega a producción** en Vercel.
- Devin también hace commits directamente en `main`.
- **Objetivo:** que Claude Code trabaje solo en la rama `ClaudeCode` y que sus cambios lleguen a `main` únicamente mediante un Pull Request aprobado.

Estado del repositorio al redactar este plan:

- Solo existe `main` (local y `origin/main`); no hay worktrees.
- En `main` hay cambios sin commit: configuración de Prettier, `.claude/`, `CLAUDE.md` y dos documentos de auditoría.
- `.claude/settings.json` ya tiene un hook `PostToolUse` que formatea con Prettier.

## 2. Análisis de la recomendación original

La idea de proteger en dos niveles es correcta: una regla escrita en `CLAUDE.md` y un hook que bloquea. Al implementarla hay que corregir lo siguiente:

| # | Problema en la propuesta original | Corrección |
|---|---|---|
| 1 | `rama.js` bloquea **cualquier** edición fuera de `ClaudeCode`, incluidos archivos ajenos al repo (memoria `~/.claude/...`, planes, scratchpad). | Bloquear solo si `tool_input.file_path` está dentro de `CLAUDE_PROJECT_DIR`. |
| 2 | `node .claude/hooks/rama.js` y `git branch` dependen del directorio actual. | Usar `"$CLAUDE_PROJECT_DIR/..."`, igual que el hook de Prettier, y ejecutar git con `cwd` en la raíz del proyecto. |
| 3 | El matcher `MultiEdit` ya no existe y falta `NotebookEdit`. | Usar el matcher `Write\|Edit\|NotebookEdit`. |
| 4 | Bash queda sin protección: Claude puede modificar archivos, hacer `git commit` o `git push` por consola. | Agregar un hook `PreToolUse` sobre `Bash\|PowerShell`. |
| 5 | Las reglas `deny` (`Bash(git push origin main:*)`) son fáciles de esquivar: `git push`, `git push origin HEAD:main`, `-f`. | El hook de Bash bloquea `commit`/`merge`/`push` fuera de `ClaudeCode`, cualquier push con destino `main` y `--force`/`-f`. Se permite `--force-with-lease` sobre `ClaudeCode`. Las reglas `deny` se mantienen como red adicional. |
| 6 | Los cambios sin commit actuales están en `main`. | `git checkout -b` los arrastra a la nueva rama, así que se commitean en `ClaudeCode`. |
| 7 | En detached HEAD o en worktrees (`claude/*`), el nombre de rama no es `ClaudeCode`. | El hook bloquea, que es lo esperado. El mensaje del hook lo explica. |
| 8 | Vercel genera previews de cada push a `ClaudeCode`. | Verificar que las variables de entorno existan en el entorno **Preview** de Vercel. |
| 9 | Proteger `main` exigiendo PR impediría a Devin hacer push directo. | **Actualizado:** Devin también pasa a su propia rama `Devin` y entra por PR (ver [Plan_Rama_Devin.md](Plan_Rama_Devin.md)). El Ruleset de `main` no lleva bypass para Devin. |
| 10 | Claude y Devin comparten una sola carpeta de trabajo; un `git checkout` de uno cambia la rama del otro. | Usar `git worktree`: `LaRioja/` → `ClaudeCode` y `LaRioja-Devin/` → `Devin` (ver plan de Devin §2.1). |

## 3. Pasos de implementación

### 3.1 Crear la rama

```bash
git fetch origin
git checkout -b ClaudeCode
```

Git distingue mayúsculas en los nombres de rama: siempre `ClaudeCode`.

### 3.2 Hook `.claude/hooks/rama.mjs`

Será un script ESM con JSDoc, en el mismo estilo que `.claude/hooks/prettier.mjs`:

- Lee por stdin el JSON del hook y obtiene la rama con `git branch --show-current` (`cwd` = `CLAUDE_PROJECT_DIR`).
- **Write / Edit / NotebookEdit:** si `file_path` está dentro del proyecto y la rama no es `ClaudeCode`, escribe el motivo en stderr y sale con `exit 2`, lo que bloquea la acción y le explica el motivo a Claude. En Windows, la comparación de rutas no distingue mayúsculas.
- **Bash / PowerShell:** analiza `tool_input.command` y bloquea con `exit 2` en estos casos:
  - `git commit`, `git merge` o `git push` cuando la rama no es `ClaudeCode`;
  - `git push` con destino `main` (`main`, `:main`, `HEAD:main`);
  - `git push --force` / `-f`. Se permite `--force-with-lease`.
- Ante un error inesperado, o si no es un repositorio git, sale con `exit 0` y no bloquea.

### 3.3 `.claude/settings.json`

Se fusiona con lo existente, conservando el hook de Prettier:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|NotebookEdit",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/rama.mjs\"" }
        ]
      },
      {
        "matcher": "Bash|PowerShell",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/rama.mjs\"" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/prettier.mjs\"",
            "timeout": 30,
            "statusMessage": "Formateando con Prettier..."
          }
        ]
      }
    ]
  },
  "permissions": {
    "deny": [
      "Bash(git push origin main*)",
      "Bash(git push --force*)",
      "Bash(git push -f*)"
    ]
  }
}
```

### 3.4 Sección nueva en `CLAUDE.md`

```markdown
## Flujo de Git (obligatorio)
- Todo cambio se hace SOLO en la rama `ClaudeCode`. Nunca edites, hagas commit ni push en `main`.
- Al iniciar cada sesión ejecuta `git branch --show-current`. Si no estás en `ClaudeCode`, avísame antes de cambiar con `git checkout ClaudeCode`.
- Antes de trabajar, trae lo nuevo de `main` (Devin también hace commits ahí): `git fetch origin && git merge origin/main` desde `ClaudeCode`. Avísame si hay conflictos.
- Commits pequeños (conventional commits en español), subidos a `origin/ClaudeCode`.
- Los cambios llegan a `main` solo por Pull Request aprobado. Nunca hagas merge ni push a `main`.
- Estas reglas las hace cumplir `.claude/hooks/rama.mjs` (hooks `PreToolUse`).
```

### 3.5 Commits y publicación (en `ClaudeCode`)

1. `chore(tooling): agregar Prettier y hook de formato para Claude Code`
2. `chore(git): flujo de rama ClaudeCode con hooks de protección`
3. `docs: ...`: documentos de auditoría, `CLAUDE.md` y este plan (opcional, en un commit aparte).

```bash
git push -u origin ClaudeCode
```

### 3.6 Configuración manual (dueño del repositorio)

- **GitHub** (Settings → Rules → Rulesets): crear un ruleset para `main` que
  - exija Pull Request;
  - bloquee force-push y el borrado de la rama;
  - no tenga bypass para Devin. Devin hace push con la misma identidad del dueño, así que un bypass para él sería un bypass para todos. Opcionalmente, bypass solo para *Repository admin* en modo "solo pull requests". Ver [Plan_Rama_Devin.md](Plan_Rama_Devin.md) §3.6.
- **Vercel:** revisar que las variables de entorno estén definidas para el entorno *Preview*.

## 4. Flujo hacia producción

```
ClaudeCode ──► Pull Request en GitHub ──► revisar preview de Vercel ──► merge a main ──► producción
```

Como Devin sigue trabajando en `main`, conviene traer sus cambios a `ClaudeCode` con frecuencia para evitar conflictos grandes.

## 5. Archivos afectados

- `.claude/hooks/rama.mjs` (nuevo)
- `.claude/settings.json` (se agregan `PreToolUse` y `permissions.deny`)
- `CLAUDE.md` (sección nueva)

## 6. Verificación

**Pruebas del script por stdin** (en Git Bash, con rutas Windows vía `pwd -W`):

| Caso | Resultado esperado |
|---|---|
| Edit de un archivo del repo estando en `main` | `exit 2` (bloqueado) |
| Edit de un archivo fuera del repo estando en `main` | `exit 0` |
| Edit de un archivo del repo estando en `ClaudeCode` | `exit 0` |
| Bash `git push origin main` | `exit 2` |
| Bash `git push -f` | `exit 2` |
| Bash `git commit ...` estando en `main` | `exit 2` |
| Bash `git status` | `exit 0` |

**Prueba real en una sesión de Claude Code:**

1. En `ClaudeCode`, crear un archivo temporal: se permite y Prettier lo formatea.
2. `git checkout main` e intentar escribir un archivo temporal: Claude queda bloqueado y muestra el mensaje.
3. Volver a `ClaudeCode` y borrar el temporal.
4. Si el hook no se dispara, abrir una sesión nueva para que se recargue `settings.json`.

Además, validar que el JSON sea correcto:

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))"
```
