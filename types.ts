import type { GameEvent } from './engine/events.ts';

export type CardType = 'attack' | 'skill' | 'power' | 'status';

export interface CardEffect {
  type: 'damage' | 'block' | 'draw' | 'heal' | 'apply_status' | 'add_card' | 'discard' | 'lose_bandwidth' | 'add_copy' | 'exhaust_random' | 'exhaust_targeted' | 'conditional_strength' | 'upgrade_hand' | 'damage_scale_mitigation' | 'damage_scale_matches' | 'retrieve_discard' | 'gain_bandwidth' | 'conditional_refund' | 'lose_hp_turn_end' | 'steal_capital' | 'escape' | 'split' | 'siphon'
  // New effect types for missing Ironclad cards
  | 'lose_hp' | 'play_top_card' | 'put_on_deck' | 'exhaust_choice' | 'exhaust_non_attacks' | 'second_wind' | 'sentinel_effect' | 'double_block' | 'add_card_to_hand'
  | 'dual_wield' | 'add_random_attack_zero_cost' | 'damage_rampage' | 'double_strength' | 'damage_feed' | 'damage_lifesteal' | 'fiend_fire' | 'exhume' | 'blood_cost';
  value: number;
  target?: 'enemy' | 'self' | 'all_enemies';
  status?: 'vulnerable' | 'weak' | 'strength' | 'metallicize' | 'evolve' | 'feelNoPain' | 'noDraw' | 'thorns' | 'antifragile' | 'artifact' | 'frail' | 'growth' | 'corruption'
  // New status effects for missing Ironclad cards
  | 'combust' | 'darkEmbrace' | 'rage' | 'fireBreathing' | 'barricade' | 'doubleTap' | 'berserk' | 'brutality' | 'juggernaut';
  cardId?: string;
  matchString?: string; // For scaling damage based on card names (e.g. Commit)
  strengthMultiplier?: number; // For Heavy Blade mechanics
  timing?: 'end_of_turn'; // For Flex effect (lose strength at end of turn)
}

export interface TooltipData {
  term: string;
  definition: string;
}

export interface CardData {
  id: string;
  character: 'cto' | 'ceo' | 'coo' | 'colorless' | 'status';
  name: string;
  type: CardType;
  rarity: 'basic' | 'common' | 'uncommon' | 'rare' | 'special' | 'starter'; // Added 'starter' to match current code, user said 'basic' for starter cards but 'starter' is clearer for internal logic
  cost: number; // -1 for X cost
  description: string; // Keep for UI, but logic uses effects
  effects: CardEffect[];
  upgraded?: {
    name: string;
    cost?: number;
    effects: CardEffect[];
  };
  keywords?: string[];
  tooltip?: TooltipData;

  // Legacy/Helper fields (can be refactored later or kept for ease)
  icon?: string;
  exhaust?: boolean;
  unplayable?: boolean;
  ethereal?: boolean;
  retain?: boolean;
  playCondition?: 'only_attacks_in_hand';
  innate?: boolean; // Card always starts in opening hand
}

export interface PlayerStatuses {
  vulnerable: number;
  weak: number;
  strength: number;
  dexterity: number;   // Block bonus
  // Powers
  metallicize: number; // Block at end of turn
  evolve: number;      // Draw when status drawn
  feelNoPain: number;  // Block when exhaust
  noDraw: number;      // Cannot draw cards
  thorns: number;      // Damage attacker
  antifragile: number; // Gain strength when lose HP from card
  artifact: number;    // Negate next debuff
  frail: number;       // Block is less effective
  growth: number;      // Gain strength each turn (Network Effects)
  corruption: number;  // Skills cost 0 but exhaust (Tech Debt)
  // New statuses for missing Ironclad cards
  combust: number;     // At end of turn, lose HP and deal damage to ALL
  darkEmbrace: number; // When exhaust, draw cards
  rage: number;        // This turn: gain block when playing attacks
  fireBreathing: number; // When draw status, deal damage to ALL
  barricade: number;   // Block persists between turns
  doubleTap: number;   // Next attack plays twice
  berserk: number;     // At turn start, gain energy
  brutality: number;   // At turn start, lose HP and draw
  juggernaut: number;  // When gain block, deal damage to random
  tempStrength: number; // Strength to lose at end of turn (Flex)
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  bandwidth: number;
  capital: number;
  mitigation: number;
  statuses: PlayerStatuses;
}

export interface CharacterData {
  id: string;
  name: string;
  title: string;
  description: string;
  stats: {
    starting_hp: number;
    starting_max_hp: number;
    starting_bandwidth: number;
    starting_capital: number;
  };
  starter_deck: { card_id: string; count: number }[];
  starter_relic: string;
  unique_mechanic?: {
    type: 'resource' | 'stance' | 'orbs';
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  unlock?: {
    default_unlocked: boolean;
  };
  // Visuals
  emoji: string; // Using emoji instead of sprite for MVP
  color?: string;
}

export type IntentType = 'attack' | 'buff' | 'debuff' | 'defend' | 'unknown';

export interface EnemyIntent {
  type: 'attack' | 'buff' | 'debuff' | 'unknown';
  value: number;
  icon: string;
  description: string;
  effects?: CardEffect[]; // To make it data driven
}

export interface EnemyAIAction {
  id: string;
  intent: 'attack' | 'buff' | 'debuff' | 'unknown';
  intent_value?: number;
  effects: CardEffect[];
  weight?: number; // For random
  condition?: string; // For conditional
}

export interface EnemyAIPattern {
  type: 'cycle' | 'random' | 'conditional';
  moves: EnemyAIAction[];
}

export interface EnemyStatuses {
  vulnerable: number;
  weak: number;
  strength: number;
  // New Powers
  metallicize: number; // Block at end of turn
  evolve: number;      // Draw when status drawn
  feelNoPain: number;  // Block when exhaust
  noDraw: number;      // Cannot draw cards
  thorns: number;      // Damage attacker
  antifragile: number; // Gain strength at start of turn
  growth: number;
  artifact: number;    // Negate next debuff
  curlUp: number;      // Block when hit
  malleable: number;   // Block when hit (stacking)
  asleep: number;      // Stunned/Inactive
  frail: number;       // Block is less effective
}

export type EntityStatus = PlayerStatuses | EnemyStatuses;

export interface EnemyData {
  id: string;
  name: string;
  act: number;
  type: 'normal' | 'elite' | 'boss';
  hp: number;
  maxHp: number;
  mitigation: number; // Block
  description: string;
  emoji: string;
  statuses: EnemyStatuses;
  ai_pattern?: EnemyAIPattern;
  rewards?: {
    capital: { min: number; max: number };
    card_reward: boolean;
  };
  currentIntent: EnemyIntent;
}

export type RelicTrigger =
  | 'turn_start'
  | 'turn_end'
  | 'combat_start'
  | 'combat_end'
  | 'on_play'
  | 'on_draw'
  | 'passive'
  | 'first_attack'
  | 'first_turn'
  | 'turn_end_conditional'
  | 'on_damaged'
  | 'on_card_reward'
  | 'on_attack_count'
  | 'combat_end_conditional'
  | 'on_enemy_death'
  | 'on_hp_loss'      // Ironclad: Self-Forming Clay, Runic Cube
  | 'on_vulnerable'   // Ironclad: Champion Belt
  | 'on_exhaust';     // Ironclad: Charon's Ashes

export interface RelicEffect {
  type: string;  // Flexible type for various relic effects
  value?: number;
  threshold?: number;
  draw_bonus?: number;
  card_limit?: number;
  add_wounds?: number;
  disable_rest?: boolean;
  enemy_strength?: number;
}

export interface RelicData {
  id: string;
  character: 'cto' | 'ceo' | 'coo' | 'shared';
  name: string;
  rarity: 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'event';
  trigger: RelicTrigger;
  effect: RelicEffect;
  description: string;
  icon: string;
  tooltip?: TooltipData;
  // Runtime state for counter-based relics
  attackCounter?: number;
  usedThisCombat?: boolean;
  // For Secret Weapon: the chosen skill card ID
  chosenCardId?: string;
}

// === POTION SYSTEM ===

export type PotionRarity = 'common' | 'uncommon' | 'rare';

export type PotionTarget = 'none' | 'enemy' | 'self' | 'card_in_discard' | 'cards_in_hand';

export type PotionEffectType =
  | 'damage' | 'damage_all' | 'block' | 'draw' | 'heal' | 'heal_percent'
  | 'gain_strength' | 'gain_dexterity' | 'gain_energy'
  | 'apply_vulnerable' | 'apply_weak'
  | 'temporary_strength' | 'temporary_dexterity'
  | 'add_random_attack' | 'add_random_skill' | 'add_random_power' | 'add_random_colorless'
  | 'upgrade_hand' | 'gain_artifact' | 'gain_plated_armor' | 'gain_regen' | 'gain_thorns'
  | 'return_from_discard' | 'gambler' | 'play_top_cards' | 'duplicate_next'
  | 'exhaust_choice' | 'gain_ritual' | 'gain_max_hp' | 'fairy' | 'escape'
  | 'snecko' | 'fill_potions' | 'gain_metallicize' | 'gain_intangible';

export interface PotionEffect {
  type: PotionEffectType;
  value: number;
  duration?: number; // For temporary effects (end of turn)
}

export interface PotionData {
  id: string;
  name: string;
  character: 'cto' | 'ceo' | 'coo' | 'watcher' | 'shared';
  rarity: PotionRarity;
  target: PotionTarget;
  description: string;
  icon: string;
  tooltip: TooltipData;
  effects: PotionEffect[];
  sacredBarkAffected: boolean; // Whether Sacred Bark doubles effects
}

export type MapNodeType = 'problem' | 'elite' | 'retrospective' | 'vendor' | 'opportunity' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  type: MapNodeType;
  floor: number;        // 1-16 (15 floors + boss)
  column: number;       // 0-6 position
  connections: string[];      // IDs of nodes this connects TO (next floor)
  parentConnections: string[]; // IDs of nodes that connect to this
  completed: boolean;
  accessible: boolean;  // Can player reach this from their path
}

export type MapLayer = MapNode[];

// Encounter System
export interface EncounterEnemy {
  enemyId: string;
  count: [number, number]; // [min, max] for variance
}

export interface EncounterTemplate {
  id: string;
  name: string;
  enemies: EncounterEnemy[];
  weight: number;
  pool: 'easy' | 'hard';
}

// Event System
export interface EventChoice {
  id: string;
  label: string;
  description: string;
  condition?: {
    type: 'gold' | 'hp' | 'upgraded_cards' | 'deck_size';
    operator: '>=' | '<=' | '>' | '<';
    value: number;
  };
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'gain_gold' | 'lose_gold' | 'gain_hp' | 'lose_hp' | 'lose_max_hp' | 'gain_max_hp' |
  'gain_card' | 'remove_card' | 'upgrade_card' | 'transform_card' |
  'remove_card_choice' | 'upgrade_card_choice' | 'transform_card_choice' | 'exhaust_card_choice' |
  'exhaust_card' | 'add_status_card' | 'gain_relic' | 'gain_strength' |
  'apply_status' | 'fight_elite' | 'random_chance' | 'nothing';
  value?: number;
  cardRarity?: 'common' | 'uncommon' | 'rare' | 'random';
  relicRarity?: 'starter' | 'common' | 'uncommon' | 'rare' | 'boss' | 'special';
  statusId?: string;
  relicId?: string;
  chance?: number; // For random_chance type (0-100)
  successEffects?: EventEffect[];
  failureEffects?: EventEffect[];
}


export interface EventData {
  id: string;
  name: string;
  description: string;
  image?: string;
  choices: EventChoice[];
}

export interface GameState {
  playerStats: CharacterStats;
  enemies: EnemyData[]; // Was enemy: EnemyData | null
  // Helper to keep track of which enemy is being targeted by default or by user
  selectedEnemyId?: string;
  hand: CardData[];
  drawPile: CardData[];
  discardPile: CardData[];
  exhaustPile: CardData[];
  relics: RelicData[];
  turn: number;
  floor: number;
  status: 'MENU' | 'CHARACTER_SELECT' | 'STARTUP_INPUT' | 'INTRO_TWEET' | 'NEOW_BLESSING' | 'PLAYING' | 'VICTORY' | 'GAME_OVER' | 'ENEMY_TURN' | 'REWARD_SELECTION' | 'MAP' | 'RETROSPECTIVE' | 'VENDOR' | 'DISCARD_SELECTION' | 'CARD_SELECTION' | 'EVENT' | 'VICTORY_ALL';
  rewardOptions: CardData[];
  message: string;
  map: MapLayer[];
  currentMapPosition: { floor: number; nodeId: string } | null;
  vendorStock?: CardData[];
  lastVictoryReward?: {
    capital: number;           // Pending gold to claim
    cardRewards: CardData[];   // 3 card choices
    relic?: RelicData;
    goldCollected: boolean;    // Has player taken gold?
    cardCollected: boolean;    // Has player taken/skipped card?
    relicCollected: boolean;   // Has player taken the relic?
  };
  pendingDiscard: number;
  deck: CardData[]; // Permanent deck
  pendingSelection?: {
    type?: 'upgrade' | 'exhaust' | 'retrieve' | 'discard' | 'remove' | 'transform'; // Type of selection
    context: 'hand' | 'discard_pile' | 'discard' | 'deck';
    action: 'upgrade' | 'move_to_draw_pile' | 'exhaust' | 'add_to_hand' | 'remove' | 'transform';
    count: number;
    message?: string; // Optional message to show during selection
    eventContext?: boolean; // True if this selection is from an event (returns to MAP after)
  };

  currentEvent?: EventData;
  eventResult?: {
    choiceLabel: string;
    resultMessage: string;
    success?: boolean;
  };
  // === POTION SYSTEM ===
  potions: (PotionData | null)[]; // Array of potion slots (null = empty)
  potionSlotCount: number; // 3 standard, 2 for A11+
  potionDropChance: number; // Starts at 40, adjusts by 10 per drop/no-drop (resets each act)
  pendingPotionReward?: PotionData; // For potion reward selection
  duplicateNextCard: boolean; // For Duplication Potion effect

  // === FRIENDS & FAMILY ROUND (Neow's Blessing) ===
  pendingBlessingOptions?: NeowBlessing[]; // 4 blessing choices at run start

  // === SEED SYSTEM ===
  seed: string; // Run seed (displayed to player, enables deterministic reruns)

  // === NARRATIVE SYSTEM ===
  startupName?: string;      // Player's startup name
  startupOneLiner?: string;  // Startup one-liner description
  narrativeGenerated?: boolean;  // Whether narrative has been generated for this run

  // === ENGINE EVENT STREAM ===
  /** Transient events produced by the engine for UI/animations */
  pendingEvents?: GameEvent[];
}

// === FRIENDS & FAMILY ROUND (Neow's Blessing) ===
// At the start of each run, choose one bonus from your family/friends

export type NeowBlessingType =
  | 'heal'           // Restore HP
  | 'max_hp'         // Increase max HP
  | 'gold'           // Gain starting capital
  | 'random_card'    // Gain a random card
  | 'upgrade_card'   // Upgrade a card
  | 'remove_card'    // Remove a card
  | 'random_relic'   // Gain a random relic
  | 'transform_card' // Transform a card
  | 'random_colorless' // Gain random colorless card
  | 'boss_relic'     // Swap starter relic for boss relic (with downside)
  | 'composite';     // Multiple smaller effects

export interface NeowBlessingEffect {
  type: NeowBlessingType;
  value?: number;
  percent?: number; // For percentage-based effects
}

export interface NeowBlessing {
  id: string;
  category: 'gift' | 'sacrifice' | 'trade' | 'gamble'; // StS has 4 categories
  giver: string;        // Who's giving this blessing (Mom, Dad, Uncle, etc.)
  description: string;  // Player-facing description
  icon: string;
  effects: NeowBlessingEffect[];
  downside?: NeowBlessingEffect; // For the "risky" blessings
}
