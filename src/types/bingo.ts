import type { Database, Tables } from "@/types/database";

/**
 * Tipos de dominio del módulo Bingo compartidos entre Route Handlers,
 * funciones `*-core.ts` y componentes cliente. Se derivan de los tipos
 * generados del esquema (`@/types/database`) para no duplicar columnas.
 */

/** Fila de `invoices`. */
export type Invoice = Tables<"invoices">;

/** Fila de `cards`. */
export type Card = Tables<"cards">;

/** Fila de `events`. */
export type BingoEvent = Tables<"events">;

/** País para los selectores de código de área telefónico. */
export type CountryCode = Pick<
  Tables<"country_codes">,
  "name" | "phone_code" | "flag_emoji" | "iso2"
>;

/**
 * Factura con los números de cartón asociados, como la devuelven
 * `GET /api/invoice` y los diálogos de factura.
 */
export type InvoiceWithCards = Invoice & { associated_cards?: number[] };

/** Alumno asignado embebido en `students_cards(students(...))`. */
export type AssignedStudent = Pick<Tables<"students">, "student_name" | "student_level">;

/**
 * Cartón del inventario de un evento (`getEventCardsCore`, columnas de
 * `EVENT_CARD_COLUMNS`). `students` es many-to-one: llega como objeto,
 * pero se acepta también arreglo (leerlo con `singleRelation`).
 */
export type InventoryCard = Pick<
  Card,
  | "company_id"
  | "event_id"
  | "card_number"
  | "card_type"
  | "card_status"
  | "card_price"
  | "sales_price"
  | "invoice_number"
  | "player_name"
  | "player_phone_number"
  | "player_email"
  | "sold_by"
  | "image_url"
  | "created_at"
  | "updated_at"
> & {
  students_cards?: { students: AssignedStudent | AssignedStudent[] | null }[] | null;
};

/** Evento en el que operan los diálogos de factura. */
export interface InvoiceEventContext {
  /** Empresa del evento (número, o texto cuando viene de la cookie). */
  companyId: number | string;
  eventId: string;
  cardValue?: number | null;
}

/** Fila devuelta por la RPC `busqueda_universal`. */
export type UniversalSearchRow =
  Database["public"]["Functions"]["busqueda_universal"]["Returns"][number];

/** Cartón enriquecido para el detalle rápido de la búsqueda universal. */
export type SearchCardDetail = Pick<
  Card,
  "card_number" | "player_name" | "card_status" | "card_type" | "invoice_number"
>;

/** Resultado de `GET /api/search`. */
export interface SearchResult {
  /** Origen del resultado: "invoice", "card", etc. */
  type: string;
  id: string;
  title: string;
  subtitle: string;
  details: string;
  /** Cartón enriquecido si `type === "card"`; si no, la fila de la RPC. */
  raw: SearchCardDetail | UniversalSearchRow;
}

/** Vendedor del evento (`GET /api/bingo/sellers`, vista `v_sold_by`). */
export interface Seller {
  sold_by: string | null;
}

/**
 * Evento mínimo que necesitan los diálogos de inventario (empresa, id y
 * nombre para el encabezado). Un `BingoEvent` completo también sirve.
 */
export type InventoryEventRef = Pick<BingoEvent, "company_id" | "event_id"> & {
  event_name?: string | null;
};
