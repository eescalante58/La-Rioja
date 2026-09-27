/**
 * Probe XFF — verifica si x-forwarded-for spoofeado segmenta los buckets
 * del rate limit de register_participant_cards.
 *
 * Uso: node --env-file=.env.local loadtest/probe-xff.mjs
 *
 * Seguro: usa wheel_id=-1, que falla DESPUÉS del chequeo de ráfaga
 * (solo inserta filas en registration_attempts, no datos de negocio).
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const RPC = `${SUPABASE_URL}/rest/v1/rpc/register_participant_cards`;

/**
 * Llama al RPC con una IP falsa y clasifica la respuesta.
 * @param {string} ip IP a enviar en x-forwarded-for.
 * @returns {Promise<string>} 'LIMITED' | 'passed' | 'HTTP..:..'
 */
async function call(ip) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({
      p_wheel_id: -1,
      p_player_name: "Probe",
      p_player_phone: "+15550000000",
      p_card_numbers: [1],
    }),
  });
  const body = await res.json().catch(() => ({}));
  const msg = body?.error ?? JSON.stringify(body);
  if (msg.includes("Demasiados intentos")) return "LIMITED";
  if (msg.includes("no está disponible")) return "passed";
  return `HTTP${res.status}:${msg.slice(0, 60)}`;
}

// Fase A: misma IP falsa 14 veces → debe bloquear a partir de la 11
let out = [];
for (let i = 0; i < 14; i++) out.push(`${i + 1}:${await call("203.0.113.77")}`);
console.log("Misma IP       →", out.join(" "));

// Fase B: 14 IPs distintas → ninguna debe bloquearse si el spoofing funciona
out = [];
for (let i = 0; i < 14; i++) out.push(`${i + 1}:${await call(`203.0.114.${i + 1}`)}`);
console.log("IPs distintas  →", out.join(" "));
