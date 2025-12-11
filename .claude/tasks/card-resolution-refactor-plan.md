# Card Resolution Refactor: Action Queue Architecture

## Overview

Refactor the monolithic `resolveCardEffect` function (~1000 lines, gameLogic.ts:2404-3231) into a data-driven action queue with typed effect handlers and explicit UI prompts.

## Current Problems

- 40+ effect types handled via nested if/else chains
- Inline relic/power triggers mixed with card logic
- UI status changes (CARD_SELECTION, DISCARD_SELECTION) blocking inline
- No separation between effect execution and animation events
- Difficult to test, debug, and extend

## Target Architecture

```
Card Play → Effect Handlers → Action Queue → Reducer → GameState + Events
                                   ↓
                            PendingChoice (pause)
                                   ↓
                            UI Selection
                                   ↓
                            ChoiceResult → Resume
```

**Core Principles:**
1. Cards/relics/potions enqueue atomic `Action` objects
2. Single `ActionReducer` processes actions deterministically using seeded RNG
3. Effects emit `GameEvent` records for UI/animation consumption
4. Player choices = `PendingChoice` objects that pause queue

---

## Phase 1: Infrastructure (Current)

### File Structure

```
burn-rate/
├── engine/
│   ├── actions.ts      # Action types & payloads
│   ├── events.ts       # GameEvent types
│   ├── choices.ts      # PendingChoice types
│   ├── ActionQueue.ts  # FIFO queue implementation
│   ├── EventLog.ts     # Append-only event collector
│   └── RNGService.ts   # SeededRandom wrapper
├── types.ts            # Add pendingEvents to GameState
└── gameLogic.ts        # Add USE_NEW_CARD_RESOLVER flag
```

### Implementation Details

#### engine/actions.ts

```typescript
export type ActionType =
  | 'PAY_COST' | 'PLAY_CARD' | 'DEAL_DAMAGE' | 'GAIN_BLOCK'
  | 'APPLY_STATUS' | 'DRAW_CARDS' | 'MOVE_CARD' | 'UPGRADE_CARD'
  | 'SELECT_CARDS' | 'EXHAUST_CARD' | 'SPAWN_ENEMY' | 'END_TURN'
  | 'CHECK_VICTORY' | 'TRIGGER_HOOK';

export interface BaseAction<T extends ActionType = ActionType, P = any> {
  type: T;
  payload: P;
  source?: string; // card/relic/potion ID
  meta?: { hits?: number; randomEachHit?: boolean; };
}

export type Action = BaseAction;

// Key payload shapes
export interface DealDamagePayload {
  targets: 'single' | 'all' | 'random';
  targetId?: string;
  amount: number;
  hits?: number;
  strengthMultiplier?: number;
}

export interface GainBlockPayload { amount: number; }
export interface DrawCardsPayload { count: number; }
export interface MoveCardPayload {
  cardId: string;
  from: 'hand' | 'drawPile' | 'discardPile' | 'exhaustPile' | 'deck';
  to: 'hand' | 'drawPile' | 'discardPile' | 'exhaustPile' | 'deck';
  position?: 'top' | 'bottom';
}
```

#### engine/events.ts

```typescript
export type GameEventType =
  | 'CARD_QUEUED' | 'CARD_PLAYED' | 'HIT' | 'BLOCK_GAINED'
  | 'STATUS_CHANGED' | 'CARD_MOVED' | 'DECK_SHUFFLED'
  | 'CHOICE_PROMPTED' | 'CHOICE_RESOLVED' | 'TURN_STARTED' | 'TURN_ENDED'
  | 'VICTORY' | 'DEFEAT' | 'NUMBER_POP' | 'SHAKE';

export interface GameEvent {
  type: GameEventType;
  payload: Record<string, any>;
  timestamp: number;
  source?: string;
}
```

#### engine/choices.ts

```typescript
import type { CardData } from '../types';
import type { Action } from './actions';

export type ChoiceZone = 'hand' | 'discardPile' | 'drawPile' | 'exhaustPile' | 'deck';

export interface PendingChoice {
  id: string;
  source: string;
  zone: ChoiceZone;
  count: number;
  kind?: string; // 'upgrade' | 'exhaust' | 'discard' | ...
  filter?: (card: CardData) => boolean;
  followUpAction: Action;
  message: string;
}

export interface ChoiceResult {
  choiceId: string;
  selectedCardIds: string[];
}
```

#### engine/ActionQueue.ts

```typescript
import type { Action } from './actions';

export class ActionQueue {
  private queue: Action[] = [];

  enqueue(action: Action): void { this.queue.push(action); }
  enqueueMany(actions: Action[]): void { this.queue.push(...actions); }
  dequeue(): Action | undefined { return this.queue.shift(); }
  peek(): Action | undefined { return this.queue[0]; }
  isEmpty(): boolean { return this.queue.length === 0; }
  toArray(): Action[] { return [...this.queue]; }
}
```

#### engine/EventLog.ts

```typescript
import type { GameEvent } from './events';

export class EventLog {
  private events: GameEvent[] = [];

  append(event: GameEvent): void { this.events.push(event); }
  appendMany(events: GameEvent[]): void { this.events.push(...events); }
  drain(): GameEvent[] { const copy = this.events; this.events = []; return copy; }
  peekAll(): GameEvent[] { return [...this.events]; }
}
```

#### engine/RNGService.ts

```typescript
import type { SeededRandom, GameRNG } from '../rng';

export type RNGStreamName = 'map' | 'cards' | 'relics' | 'potions' | 'events' | 'encounters' | 'shuffle' | 'misc';

export class RNGService {
  private readonly stream: SeededRandom;
  private readonly name: RNGStreamName;

  constructor(rng: GameRNG, stream: RNGStreamName = 'misc') {
    this.name = stream;
    this.stream = rng[stream];
  }

  next(): number { return this.stream.next(); }
  nextInt(min: number, max: number): number { return this.stream.nextInt(min, max); }
  pick<T>(array: T[]): T { return this.stream.pick(array); }
  shuffle<T>(array: T[]): T[] { return this.stream.shuffle(array); }
}
```

#### types.ts Addition

```typescript
import type { GameEvent } from './engine/events';

export interface GameState {
  // ... existing fields ...
  
  /** Transient events from last reducer run (for UI/animations) */
  pendingEvents?: GameEvent[];
}
```

#### gameLogic.ts Flag

```typescript
// Feature flag for new card resolver
const USE_NEW_CARD_RESOLVER = false;

// TODO: Branch resolveCardEffect based on flag
```

---

## Phase 2: Core Reducer

### File: engine/ActionReducer.ts

```typescript
export class ActionReducer {
  constructor(
    private state: GameState,
    private queue: ActionQueue,
    private eventLog: EventLog,
    private rng?: RNGService
  ) {}

  processAll(): { state: GameState; events: GameEvent[] } {
    while (!this.queue.isEmpty()) {
      const action = this.queue.dequeue()!;
      this.processAction(action);
      
      // Check for pending choice (pause)
      if (this.state.pendingSelection) break;
    }
    return { state: this.state, events: this.eventLog.drain() };
  }

  private processAction(action: Action): void {
    switch (action.type) {
      case 'DEAL_DAMAGE': this.handleDealDamage(action); break;
      case 'GAIN_BLOCK': this.handleGainBlock(action); break;
      case 'DRAW_CARDS': this.handleDrawCards(action); break;
      case 'APPLY_STATUS': this.handleApplyStatus(action); break;
      // ... more handlers
    }
  }
}
```

### Initial Handlers

1. **PAY_COST** - Deduct bandwidth
2. **DEAL_DAMAGE** - Target resolution, block absorption, HP change, victory check
3. **GAIN_BLOCK** - Apply dexterity/frail modifiers, trigger Juggernaut
4. **APPLY_STATUS** - Handle artifact negation
5. **DRAW_CARDS** - Shuffle if needed, hand limit, evolve trigger

---

## Phase 3: Effect Handlers Expansion

Migrate all effect types from `resolveCardEffect` to return `Action[]`:

### Priority 1 (Core Combat)
- damage, damage_scale_mitigation, damage_scale_matches, damage_rampage
- damage_lifesteal, damage_feed, fiend_fire
- block, double_block, second_wind

### Priority 2 (Card Manipulation)
- draw, discard, exhaust_random, exhaust_targeted, exhaust_choice
- upgrade_hand, retrieve_discard, put_on_deck, exhume
- add_card, add_copy, add_card_to_hand, dual_wield

### Priority 3 (Status/Powers)
- apply_status (20+ status types)
- conditional_strength, conditional_refund
- gain_bandwidth, lose_hp, blood_cost

### Priority 4 (Special)
- play_top_card (recursive)
- escape, split, siphon, steal_capital

---

## Phase 4: Trigger/Hook System

### File Structure

```
engine/hooks/
├── HookRegistry.ts
├── relicTriggers.ts
├── powerTriggers.ts
└── enemyTriggers.ts
```

### Hook Lifecycle Points

- onTurnStart, onTurnEnd
- onCardPlay, onCardExhaust, onCardDiscard
- onDamageDealt, onDamageTaken, onBlockGained
- onStatusApplied, onEnemyDeath, onHpLoss, onDraw

### Relics to Port

| Relic | Hook | Effect |
|-------|------|--------|
| Rage | onCardPlay (attack) | GainBlock |
| Double Tap | onCardPlay (attack) | ReplayCard |
| Fire Breathing | onDraw (status) | DealDamage(all) |
| Feel No Pain | onExhaust | GainBlock |
| Juggernaut | onBlockGained | DealDamage(random) |
| Phoenix Protocol | onExhaust | DealDamage(all) |
| Dark Embrace | onExhaust | DrawCards |
| Champion Belt | onApplyVulnerable | ApplyWeak |

---

## Phase 5: Selection/Choice System

### File: engine/SelectionManager.ts

Handle all selection workflows:
1. upgrade_hand → CARD_SELECTION → upgrade selected
2. exhaust_choice → CARD_SELECTION → exhaust selected
3. retrieve_discard → DISCARD_SELECTION → add to hand
4. put_on_deck → CARD_SELECTION → move to draw pile top
5. discard → DISCARD_SELECTION → discard selected

### Flow

```
Effect needs choice → Create PendingChoice → Set state.status
      ↓
Emit CHOICE_PROMPTED event → UI shows selection modal
      ↓
User selects → ChoiceResult returned → Resume reducer
      ↓
Enqueue followUpAction with selected cards
```

---

## Phase 6: Event-Animation Bridge

### Components to Update

- **Card.tsx** - Listen for CARD_MOVED, CARD_PLAYED
- **Unit.tsx** - Listen for HIT, STATUS_CHANGED, SHAKE
- **animations.ts** - Consume NUMBER_POP, HIT for VFX
- **FloatingNumbers.tsx** - Consume NUMBER_POP events

### Pattern

```typescript
// In App.tsx after state update
const events = newState.pendingEvents || [];
events.forEach(event => {
  switch (event.type) {
    case 'HIT': animateHit(event.payload); break;
    case 'NUMBER_POP': showFloatingNumber(event.payload); break;
    // ...
  }
});
```

---

## Phase 7: Migration Facade

### resolveCardEffect Wrapper

```typescript
export const resolveCardEffect = (prev: GameState, card: CardData, ...): GameState => {
  if (!USE_NEW_CARD_RESOLVER) {
    return legacyResolveCardEffect(prev, card, ...); // existing code
  }
  
  // New path
  const actions = cardToActions(card, target, targetEnemyId);
  const queue = new ActionQueue();
  queue.enqueueMany(actions);
  
  const eventLog = new EventLog();
  const rngService = rng ? new RNGService(rng, 'misc') : undefined;
  const reducer = new ActionReducer(prev, queue, eventLog, rngService);
  
  return reducer.processAll().state;
};
```

---

## Migration Safety

1. **Feature flag**: `USE_NEW_CARD_RESOLVER = false` initially
2. **Dual-path harness**: Run both old and new, assert state equality
3. **Golden tests**: From cardTests.ts, edgeCaseTests.ts, relicTests.ts
4. **Incremental routing**: Start with damage/block, expand
5. **Protected files**: No changes to narrativeService.ts or progressiveNarrativeService.ts

---

## Agent Assignments

| Agent | Scope | Files |
|-------|-------|-------|
| Infra | Queue, EventLog, RNG, types | engine/* |
| Reducer | ActionReducer core | engine/ActionReducer.ts |
| Handlers | Effect handlers expansion | effectHandlers.ts |
| Hooks | Relic/power/enemy triggers | engine/hooks/* |
| Selection | PendingChoice workflows | engine/SelectionManager.ts |
| UI Bridge | Event consumption | components/*, animations.ts |
| Parity | Tests, migration | *Tests.ts |

---

## Acceptance Criteria

- [x] engine/ module compiles with no errors
- [ ] ActionQueue unit tests pass
- [ ] EventLog unit tests pass
- [ ] RNGService determinism tests pass
- [x] 7 core action handlers implemented (PAY_COST, DEAL_DAMAGE, GAIN_BLOCK, DRAW_CARDS, APPLY_STATUS, EXHAUST_CARD, CHECK_VICTORY)
- [x] 20+ effect handlers return Action[] (Phase 3a/3b/3c complete)
- [x] Hook/trigger system created with relic registry
- [x] 6 selection workflows work with PendingChoice (exhaust_choice, upgrade_hand, retrieve_discard, discard, put_on_deck, exhume)
- [x] EventAnimationBridge translates GameEvents to animations
- [ ] 100% parity tests pass
- [x] Feature flag wired in resolveCardEffect (USE_NEW_CARD_RESOLVER)

## Current Status

**Phases 1-6 Complete** (2024-12-10)

### Phase 1 & 2: Infrastructure + Core Reducer
- `engine/actions.ts` - Action types and payloads (25+ action types)
- `engine/events.ts` - GameEvent types
- `engine/choices.ts` - PendingChoice/ChoiceResult types
- `engine/ActionQueue.ts` - FIFO queue
- `engine/EventLog.ts` - Event collector
- `engine/RNGService.ts` - SeededRandom wrapper
- `engine/ActionReducer.ts` - Core reducer with 20+ handlers
- `engine/cardToActions.ts` - CardData → Action[] converter
- `engine/index.ts` - Barrel exports

### Phase 3a: Damage Variants
- DEAL_DAMAGE_PER_BLOCK (Body Slam)
- DEAL_DAMAGE_PER_MATCHES (Perfected Strike)
- DEAL_DAMAGE_RAMPAGE (Rampage/Viral Growth)
- DEAL_DAMAGE_LIFESTEAL (Reaper)
- DEAL_DAMAGE_FEED (Feed/Acqui-Hire)
- FIEND_FIRE

### Phase 3b: Card Manipulation
- ADD_CARD (from template or copy)
- EXHAUST_RANDOM_FROM_HAND
- EXHAUST_NON_ATTACKS_FROM_HAND (Second Wind)

### Phase 3c/5: Selection System
- SELECT_CARDS (initiates PendingChoice)
- UPGRADE_SELECTED
- EXHAUST_SELECTED
- DISCARD_SELECTED
- RETRIEVE_TO_HAND
- PUT_ON_DECK

Effect mappings: exhaust_choice, upgrade_hand, retrieve_discard, discard, put_on_deck, exhume

### Phase 4: Hook/Trigger System
- `engine/hooks/HookRegistry.ts` - Central hook registry
- `engine/hooks/relicTriggers.ts` - Relic-specific triggers
- Hooks: onTurnStart, onCombatStart, onCardExhaust, onBlockGained, onStatusApplied, onHpLoss, onEnemyDeath, onAttackPlay

### Phase 6: Event-Animation Bridge
- `engine/EventAnimationBridge.ts` - Translates GameEvents to UI animations
- Callbacks for damage, block, status, card moves, upgrades, shuffle, victory/defeat
- Floating number management
- Legacy AnimationEvent format conversion

### Modified files:
- `types.ts` - Added pendingEvents to GameState
- `gameLogic.ts` - Added USE_NEW_CARD_RESOLVER flag and feature branch

To test the new engine: Set `USE_NEW_CARD_RESOLVER = true` in gameLogic.ts (line 10)

---

## Unresolved Questions

1. Should we batch events by "logical step" or emit continuously?
2. How to handle recursive card plays (play_top_card) - nested reducer or re-enqueue?
3. Animation timing - should events include delay hints or let UI decide?
4. Should PendingChoice replace existing pendingSelection type or coexist during migration?
