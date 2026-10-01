/**
 * Prueba combinada pre-evento (hallazgo R-02 de la auditoría):
 * ráfaga de registros de /registro MIENTRAS se ejecutan giros reales de
 * tómbola — el escenario simultáneo del día del evento.
 *
 * QUÉ HACE:
 *   1. Lanza TOTAL registros contra el RPC register_participant_cards
 *      (misma ruta que el navegador de un asistente, IPs únicas por envío).
 *   2. En paralelo, dispara SPINS giros contra la app Next.js
 *      (POST /api/tombola/spin?id=<wheel>) cada SPIN_EVERY_MS ms.
 *
 * PRECONDICIONES (iguales al test del 27-sep, ver Prueba_carga_registro.md):
 *   - Evento ficticio TESTCARGA01 sembrado con la PRUEBA anterior
 *     (node --env-file=.env.local loadtest/seed.mjs), o uno nuevo.
 *   - Una ruleta modo "Participantes" publicada apuntando a ese evento,
 *     con prizes_number >= SPINS (o 0 = sin límite).
 *   - Límites en modo NORMAL (< 500 registros) o modo EVENTO si TOTAL
 *     supera el tope diario normal por IP — este script usa XFF único por
 *     envío, así que los buckets de rate limit no se acumulan.
 *
 * ⚠️ EFECTOS LATERALES: cada giro marca un cartón ganador REAL en la ruleta
 * ficticia y audita en wheel_spins. Limpiar después con la sección de
 * cleanup de loadtest/cleanup.sql (is_winner=false, borrar wheel_spins del
 * evento de prueba).
 *
 * Uso:
 *   node --env-file=.env.local loadtest/combined-test.mjs \
 *     --wheel <ID> --total 300 --spins 20 [--vus 60] [--ramp 30] \
 *     [--site https://lariojacflsv.site]
 */
import { writeFileSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Faltan env vars de Supabase");
  process.exit(1);
}

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const WHEEL_ID = Number(arg("wheel", 0));
const TOTAL = Number(arg("total", 300));
const SPINS = Number(arg("spins", 20));
const VUS = Number(arg("vus", 60));
const RAMP_MS = Number(arg("ramp", 30)) * 1000;
const SPIN_EVERY_MS = Number(arg("spinEvery", Math.max(2000, RAMP_MS / SPINS)));
const SITE = arg("site", "https://lariojacflsv.site");
if (!WHEEL_ID) {
  console.error("Falta --wheel <id>");
  process.exit(1);
}

const RPC = `${SUPABASE_URL}/rest/v1/rpc/register_participant_cards`;
const SPIN_URL = `${SITE}/api/tombola/spin?id=${WHEEL_ID}`;
const CARD_BASE = 900010; // 900001..900009 reservados (smoke test)
const CARD_END = 905000;
let nextTask = 0;
let nextCard = CARD_BASE;
const regResults = new Array(TOTAL);
const spinResults = new Array(SPINS);

function takeCards() {
  const n = 3 + Math.floor(Math.random() * 3);
  const cards = [];
  for (let i = 0; i < n && nextCard <= CARD_END; i++) cards.push(nextCard++);
  return cards;
}

async function runRegistration(taskId) {
  const jitter = Math.floor(Math.random() * 2000);
  await new Promise((r) => setTimeout(r, jitter));
  const cards = takeCards();
  const ip = `203.${Math.floor(taskId / 256)}.${taskId % 256}.1`;
  const t0 = performance.now();
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
      },
      body: JSON.stringify({
        p_wheel_id: WHEEL_ID,
        p_player_name: `Load Combo ${taskId}`,
        p_player_phone: `+503 9${String(1000000 + taskId).slice(-7)}`,
        p_card_numbers: cards,
      }),
    });
    const json = await res.json().catch(() => ({}));
    regResults[taskId] = {
      ms: Math.round(performance.now() - t0),
      ok: res.status === 200 && json?.success === true,
      status: res.status,
      error: json?.error || null,
    };
  } catch (e) {
    regResults[taskId] = {
      ms: Math.round(performance.now() - t0),
      ok: false,
      error: String(e),
    };
  }
}

async function runSpin(spinId) {
  const t0 = performance.now();
  try {
    const res = await fetch(SPIN_URL, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    spinResults[spinId] = {
      ms: Math.round(performance.now() - t0),
      ok: res.status === 200 && json?.success === true,
      status: res.status,
      winner: json?.winnerCardNumber ?? null,
      error: json?.error || null,
    };
  } catch (e) {
    spinResults[spinId] = {
      ms: Math.round(performance.now() - t0),
      ok: false,
      error: String(e),
    };
  }
}

function pct(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function summarize(name, results) {
  const ok = results.filter((r) => r?.ok).length;
  const times = results.filter(Boolean).map((r) => r.ms).sort((a, b) => a - b);
  const errors = results.filter((r) => r && !r.ok);
  console.log(`\n== ${name} ==`);
  console.log(`ok: ${ok}/${results.length}`);
  if (times.length) {
    console.log(`p50: ${pct(times, 50)}ms  p95: ${pct(times, 95)}ms  max: ${times[times.length - 1]}ms`);
  }
  const byErr = {};
  for (const e of errors) {
    const k = e.error || `HTTP ${e.status}`;
    byErr[k] = (byErr[k] || 0) + 1;
  }
  if (Object.keys(byErr).length) console.log("errores:", byErr);
}

async function worker() {
  while (nextTask < TOTAL) {
    const id = nextTask++;
    await runRegistration(id);
  }
}

console.log(`Combinada: ${TOTAL} registros (${VUS} VUs) + ${SPINS} giros contra ${SPIN_URL}`);
const t0 = Date.now();

// Giros espaciados en paralelo al burst de registros
const spinTimers = Array.from({ length: SPINS }, (_, i) =>
  new Promise((r) => setTimeout(r, i * SPIN_EVERY_MS)).then(() => runSpin(i)),
);

await Promise.all([...spinTimers, ...Array.from({ length: VUS }, worker)]);

console.log(`\nDuración total: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
summarize("Registros", regResults);
summarize("Giros de tómbola", spinResults);

const winners = spinResults.filter((s) => s?.winner).map((s) => s.winner);
const dup = winners.length - new Set(winners).size;
console.log(`\nGanadores únicos: ${new Set(winners).size}/${winners.length}${dup ? ` — ⚠️ ${dup} duplicados!` : " — sin duplicados"}`);

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(
  `loadtest/combined-result-${stamp}.json`,
  JSON.stringify({ regResults, spinResults }, null, 2),
);
console.log(`Detalle: loadtest/combined-result-${stamp}.json`);
console.log(`\n⚠️ Recuerda limpiar: is_winner=false y wheel_spins del evento de prueba (loadtest/cleanup.sql).`);
