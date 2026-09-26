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
  /** Duración del giro de la tómbola en segundos (0 en modo Premios). */
  time_rotation: number;
  /** true = la pantalla pública agenda los giros sin intervención manual. */
  is_automatic_rotation: boolean;
  /** Segundos de espera entre giros automáticos. */
  automatic_timeout_rotation: number;
  /** Máximo de premios/giros configurados; 0 = sin límite. */
  prizes_number: number;
  items: WheelItem[];
}

/** Cartón participante de una tómbola (fila de wheel_participating_cards
 *  o wheels_presents_cards según el modo de la ruleta). */
export interface TombolaCard {
  id: number;
  card_number: number;
  is_winner: boolean;
  /** Solo modo Participantes: quien registró el cartón en /registro. */
  player_name?: string | null;
  player_phone_number?: string | null;
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
