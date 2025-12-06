

export type CardType = 'attack' | 'skill' | 'power' | 'status';

export interface CardEffect {
  type: 'damage' | 'block' | 'draw' | 'heal' | 'apply_status' | 'add_card' | 'discard' | 'lose_bandwidth' | 'add_copy' | 'exhaust_random' | 'exhaust_targeted' | 'conditional_strength' | 'upgrade_hand' | 'damage_scale_mitigation' | 'damage_scale_matches' | 'retrieve_discard' | 'gain_bandwidth' | 'conditional_refund' | 'lose_hp_turn_end' | 'steal_capital' | 'escape' | 'split' | 'siphon';
  value: number;
  target?: 'enemy' | 'self' | 'all_enemies';
  status?: 'vulnerable' | 'weak' | 'strength' | 'metallicize' | 'evolve' | 'feelNoPain' | 'noDraw' | 'thorns' | 'antifragile' | 'artifact' | 'frail';
  cardId?: string;
  matchString?: string; // For scaling damage based on card names (e.g. Commit)
  strengthMultiplier?: number; // For Heavy Blade mechanics
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
}

export interface PlayerStatuses {
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
  artifact: number;    // Negate next debuff
  frail: number;       // Block is less effective
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
  | 'on_enemy_death';

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
  type: 'gain_gold' | 'lose_gold' | 'gain_hp' | 'lose_hp' | 'lose_max_hp' |
  'gain_card' | 'remove_card' | 'upgrade_card' | 'transform_card' |
  'exhaust_card' | 'add_status_card' | 'gain_relic' | 'gain_strength' |
  'apply_status' | 'fight_elite' | 'random_chance' | 'nothing';
  value?: number;
  cardRarity?: 'common' | 'uncommon' | 'rare' | 'random';
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
  status: 'MENU' | 'CHARACTER_SELECT' | 'PLAYING' | 'VICTORY' | 'GAME_OVER' | 'ENEMY_TURN' | 'REWARD_SELECTION' | 'MAP' | 'RETROSPECTIVE' | 'VENDOR' | 'DISCARD_SELECTION' | 'CARD_SELECTION' | 'EVENT' | 'VICTORY_ALL';
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
  };
  pendingDiscard: number;
  deck: CardData[]; // Permanent deck
  pendingSelection?: {
    context: 'hand' | 'discard_pile';
    action: 'upgrade' | 'move_to_draw_pile' | 'exhaust';
    count: number;
  };
  currentEvent?: EventData;
}