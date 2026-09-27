/**
 * Seed para la prueba de carga del registro público.
 *
 * Crea en la company 1:
 *   - evento TESTCARGA01 (Activo)
 *   - wheel_configs Participantes publicada (imprime el wheel_id)
 *   - 5,000 cartones 'Vendido' en el rango 900001..905000
 *
 * Usa la service role key (bypass RLS) vía PostgREST.
 * Introspecta una fila real de cards/events para adaptar el payload
 * a las columnas existentes (el esquema no está en migraciones del repo).
 *
 * Uso: node --env-file=.env.local loadtest/seed.mjs
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SVC_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SVC_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SERVICE_ROLE_KEY");
  process.exit(1);
}

const REST = `${SUPABASE_URL}/rest/v1`;
const H = {
  apikey: SVC_KEY,
  Authorization: `Bearer ${SVC_KEY}`,
  "Content-Type": "application/json",
};
const EVENT_ID = "TESTCARGA01";
const COMPANY_ID = 1;
const CARD_START = 900001;
const CARD_COUNT = 5000;

/**
 * GET con service key; devuelve el JSON o lanza con el cuerpo del error.
 * @param {string} path Ruta PostgREST (sin base).
 */
async function get(path) {
  const res = await fetch(`${REST}${path}`, { headers: H });
  const body = await res.json();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${JSON.stringify(body)}`);
  return body;
}

/**
 * POST con service key; devuelve el JSON de la respuesta.
 * @param {string} path Ruta PostgREST.
 * @param {object|object[]} payload Filas a insertar.
 * @param {boolean} ret Si true, pide representación (Prefer: return=representation).
 */
async function post(path, payload, ret = false) {
  const res = await fetch(`${REST}${path}`, {
    method: "POST",
    headers: {
      ...H,
      Prefer: `resolution=merge-duplicates${ret ? ",return=representation" : ""}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST ${path} → ${res.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

/**
 * DELETE con service key filtrado por company+event (reset idempotente).
 * @param {string} table Tabla a limpiar.
 */
async function del(table) {
  const res = await fetch(
    `${REST}/${table}?company_id=eq.${COMPANY_ID}&event_id=eq.${EVENT_ID}`,
    { method: "DELETE", headers: H },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${table} → ${res.status} ${text.slice(0, 300)}`);
  }
}

// --- 0. Verificar company y esquema real -----------------------------------
const companies = await get(`/companies?select=company_id,company_name&company_id=eq.${COMPANY_ID}`);
if (!companies.length) throw new Error(`company_id=${COMPANY_ID} no existe`);
console.log(`Company OK: ${companies[0].company_id} ${companies[0].company_name ?? ""}`);

// Reset: si el seed corrió antes, borra residuos de TESTCARGA01 (orden por FKs)
console.log("Limpiando residuos previos de TESTCARGA01...");
for (const t of [
  "wheels_presents_cards",
  "wheel_participating_cards",
  "wheel_spins",
  "wheel_configs",
  "cards",
  "invoices",
  "events",
]) {
  await del(t);
}

const [sampleCard] = await get(`/cards?select=*&limit=1`);
const [sampleEvent] = await get(`/events?select=*&limit=1`);
console.log("Columnas cards:", sampleCard ? Object.keys(sampleCard).join(",") : "(tabla vacía)");
console.log("Columnas events:", sampleEvent ? Object.keys(sampleEvent).join(",") : "(tabla vacía)");

// --- 1. Evento ---------------------------------------------------------------
const eventRow = {
  company_id: COMPANY_ID,
  event_id: EVENT_ID,
  event_name: "PRUEBA CARGA registro (borrar)",
  event_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  card_value: 0,
  status: "Activo",
  is_active: true,
  event_manager: "LoadTest",
  event_cartons_number: CARD_COUNT,
};
// Solo columnas que existen en la tabla (por si difiere el esquema real)
const evCols = sampleEvent ? new Set(Object.keys(sampleEvent)) : null;
const eventPayload = evCols
  ? Object.fromEntries(Object.entries(eventRow).filter(([k]) => evCols.has(k)))
  : eventRow;
await post(`/events`, eventPayload);
console.log(`Evento ${EVENT_ID} listo`);

// --- 2. Ruleta Participantes publicada ---------------------------------------
const wheel = await post(
  `/wheel_configs`,
  {
    company_id: COMPANY_ID,
    event_id: EVENT_ID,
    mode: "Participantes",
    wheel_name: "PRUEBA-CARGA",
    published: true,
    time_rotation: 5,
    prizes_number: 0,
  },
  true,
);
const wheelId = Array.isArray(wheel) ? wheel[0].id : wheel?.id;
console.log(`Wheel Participantes id=${wheelId}`);

// --- 2b. Factura de prueba -----------------------------------------------------
// CHECK cards_sold_requires_invoice: un cartón 'Vendido' exige invoice_number.
// Creamos UNA factura LOADTEST-SEED y todos los cartones la referencian.
const [sampleInvoice] = await get(`/invoices?select=*&limit=1`);
const invCols = sampleInvoice ? new Set(Object.keys(sampleInvoice)) : null;
const invRow = {
  company_id: COMPANY_ID,
  event_id: EVENT_ID,
  invoice_number: "LOADTEST-SEED",
  invoice_date: new Date().toISOString().slice(0, 10),
  customer_name: "Prueba Carga",
  customer_email: "",
  phone_area: "505",
  phone_number: "00000000",
  whatsapp_number: "",
  manager_name: "LoadTest",
  cards_number: CARD_COUNT,
  card_price: 0,
  total_amount: 0,
  payment_method: "efectivo",
  status: "pagada",
  observation: "Factura ficticia para prueba de carga (borrar)",
  updated_at: new Date().toISOString(),
};
const invPayload = invCols
  ? Object.fromEntries(Object.entries(invRow).filter(([k]) => invCols.has(k)))
  : invRow;
await post(`/invoices`, invPayload);
console.log("Factura LOADTEST-SEED lista");

// --- 3. Cartones --------------------------------------------------------------
const cardCols = sampleCard ? new Set(Object.keys(sampleCard)) : null;
const mkCard = (n) => {
  const row = {
    company_id: COMPANY_ID,
    event_id: EVENT_ID,
    card_number: n,
    card_price: 0,
    card_type: "Virtual",
    card_status: "Vendido",
    sales_price: 0,
    invoice_number: "LOADTEST-SEED",
    sold_by: "LoadTest",
    player_name: "Prueba Carga",
    player_phone_number: "00000000",
    player_email: "",
    image_url: "loadtest",
    updated_at: new Date().toISOString(),
  };
  return cardCols
    ? Object.fromEntries(Object.entries(row).filter(([k]) => cardCols.has(k)))
    : row;
};

const CHUNK = 500;
for (let i = 0; i < CARD_COUNT; i += CHUNK) {
  const rows = [];
  for (let j = 0; j < CHUNK && i + j < CARD_COUNT; j++) rows.push(mkCard(CARD_START + i + j));
  await post(`/cards`, rows);
  console.log(`  cards ${CARD_START + i}..${CARD_START + i + rows.length - 1}`);
}

console.log(`\nSeed completo. Usa: --wheel ${wheelId}`);
