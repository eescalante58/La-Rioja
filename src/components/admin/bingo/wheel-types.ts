/**
 * Tipos del módulo Ruleta La Rioja (admin).
 * Reflejan el shape devuelto por getWheels (wheel_configs + items anidados).
 */

/** Segmento persistido de una ruleta (fila de wheel_items). */
export interface WheelItem {
  id: number;
  wheel_id: number;
  company_id: number;
  event_id: string;
  mode: string;
  wheel_name: string;
  label: string;
  color: string | null;
  quantity: number;
  initial_quantity?: number;
  position: number | null;
  is_active: boolean;
}

/** Configuración de ruleta (wheel_configs) con sus segmentos anidados. */
export interface Wheel {
  id: number;
  company_id: number;
  event_id: string;
  mode: string;
  wheel_name: string;
  published: boolean;
  items: WheelItem[];
}

/** Registro de auditoría de un giro (fila de wheel_spins). */
export interface WheelSpin {
  id: number;
  wheel_id: number;
  company_id: number;
  event_id: string;
  mode: string;
  wheel_name: string;
  item_id: number | null;
  winner_label: string;
  card_number: number | null;
  prize_label: string | null;
  spun_by: string | null;
  spun_at: string;
}
