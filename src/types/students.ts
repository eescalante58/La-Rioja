import type { Card, Invoice } from "@/types/bingo";

/**
 * Tipos del módulo de alumnos (/admin/settings/students) compartidos entre
 * las Server Actions y el componente cliente.
 */

/** Factura embebida en el detalle de cartones de un alumno. */
export type StudentCardInvoice = Pick<
  Invoice,
  | "invoice_number"
  | "invoice_date"
  | "customer_name"
  | "customer_email"
  | "phone_area"
  | "phone_number"
  | "total_amount"
  | "payment_method"
  | "status"
>;

/**
 * Cartón asignado a un alumno con su factura (`students.getStudentCards`).
 * Los datos del cartón pueden faltar si la relación no existe; `invoices`
 * es many-to-one (leerlo con `singleRelation`).
 */
export type StudentCardDetail = Pick<Card, "card_number"> &
  Partial<Pick<Card, "card_type" | "card_status" | "invoice_number">> & {
    invoices?: StudentCardInvoice | StudentCardInvoice[] | null;
  };

/** Fila del export de asignaciones (`students.getAllAssignedCards`). */
export interface AssignedCardExportRow {
  student_id: number;
  student_name: string;
  student_level: string | null;
  company_id: number;
  event_id: string;
  /** Vacío cuando el alumno no tiene cartones asignados. */
  card_number: number | "";
  card_type: string | null | undefined;
  card_status: string | null | undefined;
}

/**
 * Fila importada desde CSV o JSON (alumnos o asignaciones): los valores
 * llegan como texto o número y se normalizan en el servidor.
 */
export type ImportRow = Record<string, string | number | undefined>;

/** Estadísticas de cartones de un evento (`students.getEventCardsInfo`). */
export interface EventCardsInfo {
  max: number;
  total: number;
  available: number;
}
