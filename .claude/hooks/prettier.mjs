/**
 * Hook PostToolUse de Claude Code: formatea con Prettier el archivo
 * que Claude acaba de crear o editar (Write/Edit).
 *
 * Recibe por stdin el JSON del hook y toma `tool_input.file_path`.
 * Usa `--ignore-unknown` para omitir extensiones que Prettier no soporta
 * y respeta `.prettierignore`. Nunca bloquea: cualquier error se ignora.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const payload = JSON.parse(input);
    const file = payload?.tool_input?.file_path ?? payload?.tool_response?.filePath;
    if (!file || !existsSync(file)) return;

    const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
    const bin = join(root, "node_modules", "prettier", "bin", "prettier.cjs");
    if (!existsSync(bin)) return;

    execFileSync(process.execPath, [bin, "--write", "--ignore-unknown", file], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    // Un fallo de formato no debe interrumpir el trabajo de Claude.
  }
});
