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
