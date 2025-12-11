import type { CardData } from '../types.ts';
import type { Action } from './actions.ts';

/**
 * Zones that card choices can be drawn from.
 */
export type ChoiceZone =
  | 'hand'
  | 'discardPile'
  | 'drawPile'
  | 'exhaustPile'
  | 'deck';

/**
 * Represents a pending selection required from the player in order
 * to continue processing the action queue (e.g. choose a card to
 * upgrade, exhaust, discard, or retrieve).
 */
export interface PendingChoice {
  /** Unique identifier for this choice instance. */
  id: string;
  /** ID of the source that initiated this choice (e.g. card/relic/event). */
  source: string;
  /** Zone from which the player should pick cards. */
  zone: ChoiceZone;
  /** How many cards must be selected. */
  count: number;
  /**
   * Optional semantic tag for UI logic, e.g. 'upgrade' | 'exhaust' | 'discard'.
   */
  kind?: string;
  /**
   * Optional filter to constrain which cards are eligible.
   * This is evaluated in the reducer/selection manager, not in React.
   */
  filter?: (card: CardData) => boolean;
  /**
   * Action to enqueue once the choice is resolved. The reducer will
   * typically embed the selectedCardIds from ChoiceResult into this
   * action's payload before enqueueing.
   */
  followUpAction: Action;
  /** Message to show while the choice is active. */
  message: string;
}

/**
 * Data returned from the UI when a player resolves a PendingChoice.
 */
export interface ChoiceResult {
  choiceId: string;
  selectedCardIds: string[];
}