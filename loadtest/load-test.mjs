/**
 * Prueba de carga: N envíos concurrentes a register_participant_cards
 * simulando el pico de registro de asistentes del evento.
 *
 * Uso:
 *   node --env-file=.env.local loadtest/load-test.mjs --wheel <ID> [--total 1200] [--vus 300] [--ramp 30]
 *
 * Cada iteración = 1 envío del formulario: jitter 0-2s, 3-5 cartones únicos,
 * teléfono único y x-forwarded-for único por VU (buckets de rate limit
 * separados, verificado por probe-xff.mjs).
 * Espera Enter antes de lanzar para coordinar el monitoreo del dashboard.
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
const TOTAL = Number(arg("total", 1200));
const VUS = Number(arg("vus", 300));
const RAMP_MS = Number(arg("ramp", 30)) * 1000;
if (!WHEEL_ID) {
  console.error("Falta --wheel <id>");
  process.exit(1);
}

const RPC = `${SUPABASE_URL}/rest/v1/rpc/register_participant_cards`;
const CARD_BASE = 900010; // 900001..900009 reservados (smoke test)
const CARD_END = 905000;
let nextTask = 0;
let nextCard = CARD_BASE;
const results = new Array(TOTAL);

/** Toma el siguiente bloque de cartones únicos (3-5 por registro). */
function takeCards() {
  const n = 3 + Math.floor(Math.random() * 3);
  const cards = [];
  for (let i = 0; i < n && nextCard <= CARD_END; i++) cards.push(nextCard++);
  return cards;
}

/**
 * Ejecuta un envío individual midiendo latencia y clasificando el resultado.
 * @param {number} taskId Índice de la iteración (0..TOTAL-1).
 */
async function runTask(taskId) {
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
        p_player_name: `Load Tester ${taskId}`,
        p_player_phone: `+1999${String(taskId).padStart(7, "0")}`,
        p_card_numbers: cards,
      }),
    });
    const body = await res.json().catch(() => ({}));
    const ms = performance.now() - t0;
    results[taskId] = {
      ms,
      http: res.status,
      ok: res.status === 200 && body?.success === true,
      err:
        body?.success === false
          ? body.error ?? "per-card"
          : res.status !== 200
            ? `HTTP ${res.status}`
            : null,
    };
  } catch (e) {
    results[taskId] = { ms: performance.now() - t0, http: 0, ok: false, err: `NET:${e.message}` };
  }
  const done = results.filter(Boolean).length;
  if (done % 100 === 0) console.log(`...${done}/${TOTAL}`);
}

/**
 * Worker virtual: arranca escalonado según la rampa y consume tareas
 * del contador compartido hasta agotar TOTAL.
 * @param {number} w Índice del worker (0..VUS-1).
 */
async function worker(w) {
  await new Promise((r) => setTimeout(r, (w / VUS) * RAMP_MS));
  while (true) {
    const t = nextTask++;
    if (t >= TOTAL) break;
    await runTask(t);
  }
}

const DELAY_MS = Number(arg("delay", 0)) * 1000;
if (DELAY_MS > 0) {
  console.log(
    `\n>>> ${TOTAL} envíos, ${VUS} VUs, rampa ${RAMP_MS / 1000}s, wheel=${WHEEL_ID}.` +
      `\n>>> Lanzando en ${DELAY_MS / 1000}s — abre el dashboard de Supabase...`,
  );
  await new Promise((r) => setTimeout(r, DELAY_MS));
}

const t0 = Date.now();
console.log(`\n[${new Date().toISOString()}] INICIO`);
await Promise.all(Array.from({ length: VUS }, (_, w) => worker(w)));
const wallS = (Date.now() - t0) / 1000;
console.log(`[${new Date().toISOString()}] FIN (${wallS.toFixed(1)}s)`);

const done = results.filter(Boolean);
const lat = done.map((r) => r.ms).sort((a, b) => a - b);
const pct = (p) => lat[Math.min(lat.length - 1, Math.ceil(p * lat.length) - 1)];
const ok = done.filter((r) => r.ok).length;
const errs = {};
for (const r of done) if (!r.ok) errs[r.err] = (errs[r.err] ?? 0) + 1;

const summary = {
  fecha: new Date().toISOString(),
  wheel_id: WHEEL_ID,
  total: TOTAL,
  enviados: done.length,
  exitosos: ok,
  fallidos: done.length - ok,
  wall_s: +wallS.toFixed(1),
  p50_ms: Math.round(pct(0.5)),
  p95_ms: Math.round(pct(0.95)),
  p99_ms: Math.round(pct(0.99)),
  max_ms: Math.round(lat.at(-1)),
  errores: errs,
};
console.log(JSON.stringify(summary, null, 2));
writeFileSync(
  `loadtest/loadtest-result-${Date.now()}.json`,
  JSON.stringify({ summary, results }, null, 2),
);
