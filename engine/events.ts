/**
 * Engine Events
 *
 * Lightweight description of what happened in the game, designed for
 * UI and animation layers to consume. Reducer code emits these events
 * alongside state changes.
 */

export type GameEventType =
  | 'CARD_QUEUED'
  | 'CARD_PLAYED'
  | 'HIT'
  | 'BLOCK_GAINED'
  | 'STATUS_CHANGED'
  | 'CARD_MOVED'
  | 'CARD_UPGRADED'
  | 'DECK_SHUFFLED'
  | 'CHOICE_PROMPTED'
  | 'CHOICE_RESOLVED'
  | 'TURN_STARTED'
  | 'TURN_ENDED'
  | 'VICTORY'
  | 'DEFEAT'
  | 'NUMBER_POP'
  | 'SHAKE';

export interface GameEvent {
  type: GameEventType;
  /**
   * Arbitrary event data. In later phases this can become a discriminated
   * union keyed by GameEventType, but for now a generic record keeps it
   * flexible and non-breaking.
   */
  payload: Record<string, any>;
  /**
   * Timestamp in ms since epoch. For now this is typically Date.now().
   * Used primarily for ordering/debugging, not gameplay.
   */
  timestamp: number;
  /**
   * Optional identifier for the originating source (card/relic/potion/enemy).
   */
  source?: string;
}