

export type CardType = 'attack' | 'skill' | 'power' | 'status';

export interface CardEffect {
  type: 'damage' | 'block' | 'draw' | 'heal' | 'apply_status' | 'add_card' | 'discard' | 'lose_bandwidth' | 'add_copy' | 'exhaust_random' | 'exhaust_targeted' | 'conditional_strength' | 'upgrade_hand' | 'damage_scale_mitigation' | 'damage_scale_matches' | 'retrieve_discard' | 'gain_bandwidth' | 'conditional_refund';
  value: number;
  target?: 'enemy' | 'self' | 'all_enemies';
  status?: 'vulnerable' | 'weak' | 'strength' | 'metallicize' | 'evolve' | 'feelNoPain' | 'noDraw' | 'thorns' | 'antifragile';
  cardId?: string;
  matchString?: string; // For scaling damage based on card names (e.g. Commit)
  strengthMultiplier?: number; // For Heavy Blade mechanics
}

export interface CardData {
  id: string;
  name: string;
  type: CardType;
  cost: number; // -1 for X cost
  description: string;
  effects: CardEffect[];
  icon?: string;
  upgraded?: boolean;
  exhaust?: boolean;
  unplayable?: boolean;
  ethereal?: boolean; // Disappears if not played
  retain?: boolean; // Stays in hand at end of turn
  playCondition?: 'only_attacks_in_hand'; // For Ship It! (Clash)
}

export interface RelicData {
    id: string;
    name: string;
    rarity: 'starter' | 'common' | 'rare' | 'boss';
    description: string;
    icon: string;
    trigger: 'combat_start' | 'turn_start' | 'combat_end';
    effect: {
        type: 'block' | 'heal' | 'bandwidth';
        value: number;
    };
    tooltip?: {
        term: string;
        definition: string;
    }
}

export interface EntityStatus {
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
}

export interface CharacterStats {
  hp: number;
  maxHp: number;
  bandwidth: number;
  capital: number;
  mitigation: number;
  statuses: EntityStatus;
}

export type IntentType = 'attack' | 'buff' | 'debuff' | 'defend' | 'unknown';

export interface EnemyIntent {
  type: IntentType;
  value: number;
  icon: string;
  description: string;
}

export interface EnemyStatus extends EntityStatus {
    growth: number;
}

export interface EnemyData {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  currentIntent: EnemyIntent;
  statuses: EnemyStatus;
  emoji: string;
  description: string;
}

export interface MapNode {
  id: string;
  type: 'problem' | 'boss' | 'retrospective' | 'vendor' | 'milestone';
  floor: number;
  lane: number;
  locked: boolean;
  completed: boolean;
}

export type MapLayer = MapNode[];

export interface GameState {
  playerStats: CharacterStats;
  enemy: EnemyData | null;
  hand: CardData[];
  drawPile: CardData[];
  discardPile: CardData[];
  exhaustPile: CardData[];
  relics: RelicData[];
  turn: number;
  floor: number;
  status: 'MENU' | 'CHARACTER_SELECT' | 'PLAYING' | 'VICTORY' | 'GAME_OVER' | 'ENEMY_TURN' | 'REWARD_SELECTION' | 'MAP' | 'RETROSPECTIVE' | 'VENDOR' | 'DISCARD_SELECTION' | 'CARD_SELECTION';
  rewardOptions: CardData[];
  message: string;
  map: MapLayer[];
  currentMapPosition: { floor: number; nodeId: string } | null;
  vendorStock?: CardData[];
  lastVictoryReward?: { capital: number; relic?: RelicData };
  pendingDiscard: number;
  pendingSelection?: {
      context: 'hand' | 'discard_pile';
      action: 'upgrade' | 'move_to_draw_pile' | 'exhaust';
      count: number;
  };
}