/**
 * Engine Actions
 *
 * Core action model used by the ActionReducer. Cards, relics, potions, and
 * enemy intents will eventually be translated into these atomic actions.
 */

/**
 * Enumerates the distinct kinds of actions the reducer can process.
 * This union can be extended over time as new behaviors are added.
 */
export type ActionType =
  | 'PAY_COST'
  | 'PLAY_CARD'
  | 'DEAL_DAMAGE'
  | 'GAIN_BLOCK'
  | 'APPLY_STATUS'
  | 'DRAW_CARDS'
  | 'MOVE_CARD'
  | 'UPGRADE_CARD'
  | 'SELECT_CARDS'
  | 'EXHAUST_CARD'
  | 'SPAWN_ENEMY'
  | 'END_TURN'
  | 'CHECK_VICTORY'
  | 'TRIGGER_HOOK'
  // Damage variant actions (Phase 3a)
  | 'DEAL_DAMAGE_PER_BLOCK'
  | 'DEAL_DAMAGE_PER_MATCHES'
  | 'DEAL_DAMAGE_RAMPAGE'
  | 'DEAL_DAMAGE_LIFESTEAL'
  | 'DEAL_DAMAGE_FEED'
  | 'FIEND_FIRE'
    | 'EXHUME'
    // Card manipulation actions (Phase 3b)
    | 'ADD_CARD'
  | 'EXHAUST_RANDOM_FROM_HAND'
  | 'EXHAUST_NON_ATTACKS_FROM_HAND'
  // Selection-based actions (Phase 5)
  | 'SELECT_CARDS'
  | 'UPGRADE_SELECTED'
  | 'EXHAUST_SELECTED'
  | 'DISCARD_SELECTED'
  | 'RETRIEVE_TO_HAND'
  | 'PUT_ON_DECK'
  // Conditional/special actions (Phase 3d)
  | 'CONDITIONAL_STRENGTH'
  | 'CONDITIONAL_REFUND'
  | 'BLOOD_COST_REFUND'
  | 'DOUBLE_STRENGTH'
  | 'LOSE_HP'
  | 'GAIN_BANDWIDTH';

/**
 * Base action type. Specific handlers will narrow the payload type
 * based on the ActionType when processing.
 */
export interface BaseAction<T extends ActionType = ActionType, P = any> {
  type: T;
  payload: P;
  /**
   * Optional identifier of the source that produced this action
   * (e.g. card ID, relic ID, potion ID, enemy ID).
   */
  source?: string;
  /**
   * Optional metadata for actions that conceptually represent multiple
   * repeated operations (e.g. X-cost multi-hit attacks).
   */
  meta?: {
    hits?: number;
    randomEachHit?: boolean;
  };
}

/**
 * Public alias for any engine action.
 * In later phases you can make this a discriminated union where
 * each ActionType maps to a specific payload shape.
 */
export type Action = BaseAction;

/**
 * Payload for dealing damage.
 */
export interface DealDamagePayload {
  /**
   * Targeting mode for this damage instance.
   * 'single'  - use targetId
   * 'all'     - all living enemies
   * 'random'  - one random living enemy
   */
  targets: 'single' | 'all' | 'random';
  /** Specific enemy ID for single-target damage. */
  targetId?: string;
  /** Base damage amount before status/relic modifiers. */
  amount: number;
  /** Number of hits (for multi-hit attacks). */
  hits?: number;
  /**
   * Strength multiplier (e.g. Heavy Blade / Brute Force style effects).
   * 1 = normal, 3 = triple strength, etc.
   */
  strengthMultiplier?: number;
}

/**
 * Payload for gaining block/mitigation.
 */
export interface GainBlockPayload {
  /** Raw block amount before dexterity/frail modifiers. */
  amount: number;
}

/**
 * Payload for drawing cards.
 */
export interface DrawCardsPayload {
  /** Number of cards to draw. */
  count: number;
}

/**
 * Zones a card can move between.
 */
export type CardZone =
  | 'hand'
  | 'drawPile'
  | 'discardPile'
  | 'exhaustPile'
  | 'deck';

/**
 * Payload for moving a card between zones.
 */
export interface MoveCardPayload {
  cardId: string;
  from: CardZone;
  to: CardZone;
  /**
   * When moving into a pile, indicates whether the card should be placed
   * on top (default) or bottom. Ignored for zones that are not piles.
   */
  position?: 'top' | 'bottom';
}

/**
 * Payload for applying a status effect.
 * This is intentionally stringly-typed to stay decoupled from the
 * concrete PlayerStatuses/EnemyStatuses shape for now.
 */
export interface ApplyStatusPayload {
  /**
   * Who is being targeted conceptually.
   * 'player'      - the player character
   * 'enemy'       - a specific enemy (use targetId)
   * 'all_enemies' - all enemies currently in combat
   */
  target: 'player' | 'enemy' | 'all_enemies';
  /** Specific enemy ID for enemy-targeted status. */
  targetId?: string;
  /** Status key (e.g. "vulnerable", "weak", "strength", etc.). */
  status: string;
  /** Positive or negative amount to add to the status stack. */
  amount: number;
  /**
   * Optional timing hint (e.g. 'end_of_turn') for temporary statuses that
   * should be automatically cleaned up by turn logic.
   */
  timing?: 'end_of_turn';
}

/**
 * Payload for exhausting a card.
 */
export interface ExhaustCardPayload {
  cardId: string;
  from: CardZone;
}

/**
 * Payload for damage that scales with current block (Body Slam style).
 */
export interface DealDamagePerBlockPayload {
  targets: 'single' | 'all' | 'random';
  targetId?: string;
  /** Multiplier applied to current mitigation to get base damage. */
  factor: number;
}

/**
 * Payload for damage that scales with matching cards in the combat deck
 * (Perfected Strike / Compounding style).
 */
export interface DealDamagePerMatchesPayload {
  targets: 'single' | 'all' | 'random';
  targetId?: string;
  /** Base damage before match scaling. */
  base: number;
  /** Additional damage per matching card. */
  perMatch: number;
  /** Substring used to identify matching cards by name. */
  matchString: string;
}

/**
 * Payload for ramping damage that increases each time the card is played
 * (Rampage / Viral Growth).
 */
export interface DealDamageRampagePayload {
  /** The specific card instance being ramped (stores bonus on this card). */
  cardId: string;
  targets: 'single' | 'all' | 'random';
  targetId?: string;
  /** Base damage before rampage bonus. */
  base: number;
  /** How much extra damage to add to this card for future plays. */
  increment: number;
}

/**
 * Payload for lifesteal-style damage that heals the player based on
 * unblocked damage dealt (Reaper / Hostile Takeover).
 */
export interface DealDamageLifestealPayload {
  targets: 'single' | 'all' | 'random';
  targetId?: string;
  /** Base damage per target before modifiers. */
  amount: number;
}

/**
 * Payload for Feed-style damage that permanently increases max HP on kill.
 */
export interface DealDamageFeedPayload {
  /** Target enemy to hit. */
  targetId: string;
  /** Base damage before modifiers. */
  amount: number;
  /** Max HP to gain if this damage kills the target. */
  maxHpGain: number;
}

/**
 * Payload for Fiend Fire-style effects that exhaust the hand and deal
 * damage per exhausted card to a single target.
 */
export interface FiendFirePayload {
  /** The Fiend Fire card instance being played. */
  cardId: string;
  /** Target enemy to receive the combined damage. */
  targetId: string;
  /** Damage per card exhausted from hand. */
  perCardDamage: number;
}

/**
 * Payload for Exhume - retrieves the most recent card from exhaust pile.
 */
export interface ExhumePayload {
  /** Number of cards to retrieve (typically 1). */
  count: number;
}

/**
 * Payload for adding new cards into a zone.
 * Either templateId (from GAME_DATA.cards) or copyOfCardId must be provided.
 */
export interface AddCardPayload {
  templateId?: string;
  copyOfCardId?: string;
  destination: 'hand' | 'drawPile' | 'discardPile';
  count: number;
  /** Optional override for cost on the new copies (e.g. 0-cost this turn). */
  costOverride?: number;
}

/**
 * Payload for exhausting a random selection of cards from the hand.
 */
export interface ExhaustRandomFromHandPayload {
  count: number;
}

/**
 * Payload for exhausting all non-attack cards from the hand.
 * Optionally grants block per exhausted card (Second Wind style).
 */
export interface ExhaustNonAttacksFromHandPayload {
  blockPerExhausted?: number;
}

/**
 * Payload for SELECT_CARDS - initiates a player selection.
 * Sets up a PendingChoice and pauses the reducer.
 */
export interface SelectCardsPayload {
  zone: 'hand' | 'discardPile' | 'drawPile' | 'exhaustPile';
  count: number;
  kind: 'upgrade' | 'exhaust' | 'discard' | 'retrieve' | 'putOnDeck';
  /** Optional filter function name (evaluated at runtime). */
  filterType?: 'upgradeable' | 'nonStatus' | 'any';
  message: string;
}

/**
 * Payload for UPGRADE_SELECTED - upgrades cards after selection.
 */
export interface UpgradeSelectedPayload {
  selectedCardIds: string[];
}

/**
 * Payload for EXHAUST_SELECTED - exhausts cards after selection.
 */
export interface ExhaustSelectedPayload {
  selectedCardIds: string[];
  from: 'hand' | 'discardPile' | 'drawPile' | 'exhaustPile';
}

/**
 * Payload for DISCARD_SELECTED - discards cards after selection.
 */
export interface DiscardSelectedPayload {
  selectedCardIds: string[];
}

/**
 * Payload for RETRIEVE_TO_HAND - moves cards from a zone to hand.
 */
export interface RetrieveToHandPayload {
  selectedCardIds: string[];
  from: 'discardPile' | 'exhaustPile' | 'drawPile';
}

/**
 * Payload for PUT_ON_DECK - moves cards to top of draw pile.
 */
export interface PutOnDeckPayload {
  selectedCardIds: string[];
  from: 'hand' | 'discardPile';
}