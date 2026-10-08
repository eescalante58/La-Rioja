---
trigger: always_on
---

# Regla: Flujo de Git (trabajo por turnos en `main`)

## Contexto

Devin y Claude Code trabajan sobre `main` en la misma carpeta, **nunca al mismo
tiempo**. Cada push a `main` despliega a producción en Vercel, así que un error
subido llega directo a los usuarios. Procedimiento completo en
`Documentacion/Plan_Flujo_Main.md`.

## Al iniciar el turno

- Ejecutar `git status`. Si hay cambios sin commit de otro agente, avisar al
  dueño y **no tocarlos**.
- Traer lo último: `git pull --ff-only origin main`.

## Durante el turno

- Commits pequeños con conventional commits en español (`fix(students): ...`).
- Probar con `npm run dev` antes de subir cambios que afecten `/registro`,
  `/ruleta`, `/tombola` o `/admin/bingo`.

## Al terminar el turno

- Dejar el working tree limpio: todo con commit y push, o descartado avisando
  al dueño.
- Verificar que el despliegue de Vercel quedó en estado _Ready_.

## Prohibido

- `git push --force` / `-f`, `--no-verify`, `git reset --hard` sobre trabajo
  publicado.
- Desactivar o modificar `core.hooksPath` / `.githooks`. El hook
  `.githooks/pre-push` rechaza force-push y borrado de `main` y corre
  `tsc --noEmit` antes de cada push.

## Congelamiento y rollback

- En días de evento en vivo: **ningún push a `main`** sin aprobación explícita
  del dueño.
- Si producción se rompe: Instant Rollback en Vercel al despliegue anterior y
  corregir con un commit nuevo. Nunca reescribir historia.
