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
