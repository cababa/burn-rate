import type { GameState, EnemyData, EntityStatus, RelicData, CardData } from '../types.ts';
import { MAX_HAND_SIZE } from '../constants.ts';
import type {
  Action,
  DealDamagePayload,
  GainBlockPayload,
  DrawCardsPayload,
  ApplyStatusPayload,
  ExhaustCardPayload,
  DealDamagePerBlockPayload,
  DealDamagePerMatchesPayload,
  DealDamageRampagePayload,
  DealDamageLifestealPayload,
  DealDamageFeedPayload,
  FiendFirePayload,
  ExhumePayload,
  AddCardPayload,
  ExhaustRandomFromHandPayload,
  ExhaustNonAttacksFromHandPayload,
  SelectCardsPayload,
  UpgradeSelectedPayload,
  ExhaustSelectedPayload,
  DiscardSelectedPayload,
  RetrieveToHandPayload,
  PutOnDeckPayload,
} from './actions.ts';
import { GAME_DATA } from '../constants.ts';
import type { GameEvent, GameEventType } from './events.ts';
import type { PendingChoice, ChoiceResult } from './choices.ts';
import { ActionQueue } from './ActionQueue.ts';
import { EventLog } from './EventLog.ts';
import { getCrunchModeStrength, getPhoenixProtocolDamage, getPressureCookerWeak } from '../gameLogic.ts';

interface ReducerRNG {
  nextInt(min: number, max: number): number;
  pick<T>(array: T[]): T;
  shuffle<T>(array: T[]): T[];
}

/**
 * Core engine reducer that processes Actions from an ActionQueue, mutates
 * GameState, and emits GameEvents into an EventLog.
 *
 * Phase 2 scope:
 * - PAY_COST
 * - DEAL_DAMAGE
 * - GAIN_BLOCK
 * - DRAW_CARDS
 * - APPLY_STATUS
 * - EXHAUST_CARD
 * - CHECK_VICTORY
 *
 * Future phases will expand this with additional handlers and hook/choice logic.
 */
export class ActionReducer {
  private state: GameState;
  private readonly queue: ActionQueue;
  private readonly eventLog: EventLog;
  private readonly rng?: ReducerRNG;

  // Engine-level choice model (not yet wired to GameState.pendingSelection)
  private pendingChoice?: PendingChoice;

  constructor(
    state: GameState,
    queue: ActionQueue,
    eventLog: EventLog,
    rng?: ReducerRNG
  ) {
    this.state = state;
    this.queue = queue;
    this.eventLog = eventLog;
    this.rng = rng;
  }

  /**
   * Process actions until the queue is empty, a PendingChoice is set, or
   * the game enters a terminal state (VICTORY / GAME_OVER / VICTORY_ALL).
   */
  processAll(): { state: GameState; events: GameEvent[] } {
    while (!this.queue.isEmpty()) {
      const action = this.queue.dequeue()!;
      this.processAction(action);

      // Pause processing when a choice is required (engine-level) or when
      // the legacy pendingSelection is set on the GameState.
      if (this.pendingChoice || this.state.pendingSelection) {
        break;
      }

      if (
        this.state.status === 'GAME_OVER' ||
        this.state.status === 'VICTORY' ||
        this.state.status === 'VICTORY_ALL'
      ) {
        break;
      }
    }

    const events = this.eventLog.drain();
    return { state: this.state, events };
  }

  /**
   * Resume processing after a PendingChoice has been resolved by the UI.
   * For now this is a stub that enqueues the follow-up action with
   * selectedCardIds merged into its payload.
   */
  resume(choiceResult: ChoiceResult): { state: GameState; events: GameEvent[] } {
    if (!this.pendingChoice || this.pendingChoice.id !== choiceResult.choiceId) {
      // Nothing to resume or mismatched choice; return current state with no new events.
      return { state: this.state, events: [] };
    }

    const followUp = { ...this.pendingChoice.followUpAction };
    followUp.payload = {
      ...(followUp.payload || {}),
      selectedCardIds: choiceResult.selectedCardIds,
    };

    this.pendingChoice = undefined;
    this.queue.enqueue(followUp);

    return this.processAll();
  }

  /**
   * Dispatch a single Action to the appropriate handler.
   */
  private processAction(action: Action): void {
    switch (action.type) {
      case 'PAY_COST':
        this.handlePayCost(action);
        break;
      case 'DEAL_DAMAGE':
        this.handleDealDamage(action);
        break;
      case 'GAIN_BLOCK':
        this.handleGainBlock(action);
        break;
      case 'DRAW_CARDS':
        this.handleDrawCards(action);
        break;
      case 'APPLY_STATUS':
        this.handleApplyStatus(action);
        break;
      case 'EXHAUST_CARD':
        this.handleExhaustCard(action);
        break;
      case 'CHECK_VICTORY':
        this.handleCheckVictory(action);
        break;
      case 'DEAL_DAMAGE_PER_BLOCK':
        this.handleDealDamagePerBlock(action);
        break;
      case 'DEAL_DAMAGE_PER_MATCHES':
        this.handleDealDamagePerMatches(action);
        break;
      case 'DEAL_DAMAGE_RAMPAGE':
        this.handleDealDamageRampage(action);
        break;
      case 'DEAL_DAMAGE_LIFESTEAL':
        this.handleDealDamageLifesteal(action);
        break;
      case 'DEAL_DAMAGE_FEED':
        this.handleDealDamageFeed(action);
        break;
      case 'FIEND_FIRE':
        this.handleFiendFire(action);
        break;
      case 'EXHUME':
        this.handleExhume(action);
        break;
      case 'ADD_CARD':
        this.handleAddCard(action);
        break;
      case 'EXHAUST_RANDOM_FROM_HAND':
        this.handleExhaustRandomFromHand(action);
        break;
      case 'EXHAUST_NON_ATTACKS_FROM_HAND':
        this.handleExhaustNonAttacksFromHand(action);
        break;
      case 'SELECT_CARDS':
        this.handleSelectCards(action);
        break;
      case 'UPGRADE_SELECTED':
        this.handleUpgradeSelected(action);
        break;
      case 'EXHAUST_SELECTED':
        this.handleExhaustSelected(action);
        break;
      case 'DISCARD_SELECTED':
        this.handleDiscardSelected(action);
        break;
      case 'RETRIEVE_TO_HAND':
        this.handleRetrieveToHand(action);
        break;
      case 'PUT_ON_DECK':
        this.handlePutOnDeck(action);
        break;
      case 'CONDITIONAL_STRENGTH':
        this.handleConditionalStrength(action);
        break;
      case 'CONDITIONAL_REFUND':
        this.handleConditionalRefund(action);
        break;
      case 'BLOOD_COST_REFUND':
        this.handleBloodCostRefund(action);
        break;
      case 'DOUBLE_STRENGTH':
        this.handleDoubleStrength(action);
        break;
      case 'LOSE_HP':
        this.handleLoseHp(action);
        break;
      case 'GAIN_BANDWIDTH':
        this.handleGainBandwidth(action);
        break;
      // Other action types will be handled in later phases.
      default:
        break;
    }
  }

  // ============================================================
  // Core Handlers
  // ============================================================

  /**
   * PAY_COST - Deduct bandwidth from the player.
   * Expects payload: { amount: number }
   */
  private handlePayCost(action: Action): void {
    const payload = action.payload as { amount?: number } | undefined;
    const amount = Math.max(0, payload?.amount ?? 0);
    if (amount <= 0) return;

    const current = this.state.playerStats.bandwidth;
    const bandwidth = Math.max(0, current - amount);

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        bandwidth,
      },
    };
  }

  /**
   * DEAL_DAMAGE - From player to enemies (Phase 2 scope).
   * Expects DealDamagePayload:
   *   - targets: 'single' | 'all' | 'random'
   *   - targetId?: string
   *   - amount: number
   *   - hits?: number
   *   - strengthMultiplier?: number
   */
  private handleDealDamage(action: Action): void {
    const payload = action.payload as DealDamagePayload | undefined;
    if (!payload || payload.amount <= 0) return;

    const enemies = this.resolveDamagePayload(payload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
      emitBump: true,
    }).enemies;

    this.state = { ...this.state, enemies };

    // Inline victory check after damage.
    this.checkVictoryInternal();
  }

  /**
   * GAIN_BLOCK - Grant block to the player, applying Frail.
   * Expects GainBlockPayload: { amount: number }
   * Triggers Juggernaut via a placeholder hook.
   */
  private handleGainBlock(action: Action): void {
    const payload = action.payload as GainBlockPayload | undefined;
    if (!payload || payload.amount <= 0) return;

    const rawAmount = payload.amount;
    const statuses = this.state.playerStats.statuses;
    let effective = rawAmount;

    if (statuses.frail > 0) {
      effective = Math.floor(effective * 0.75);
    }

    if (effective <= 0) return;

    const mitigation = this.state.playerStats.mitigation + effective;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        mitigation,
      },
    };

    this.emitEvent(
      'BLOCK_GAINED',
      {
        amount: effective,
        rawAmount,
        frail: statuses.frail > 0,
      },
      action.source
    );

    // Placeholder for Juggernaut-style hooks (deal damage when gaining block).
    this.triggerJuggernautPlaceholder(effective);
  }

  /**
   * DRAW_CARDS - Draw cards from drawPile into hand.
   * Expects DrawCardsPayload: { count: number }
   * Phase 2: minimal behavior (no Evolve/NoDraw hooks yet).
   */
  private handleDrawCards(action: Action): void {
    const payload = action.payload as DrawCardsPayload | undefined;
    if (!payload || payload.count <= 0) return;

    // No Draw (Flow State): hard stop any draw effect for this turn.
    if (this.state.playerStats.statuses.noDraw > 0) {
      this.emitEvent(
        'STATUS_CHANGED',
        {
          target: 'player',
          status: 'noDraw',
          blockedDraw: payload.count,
        },
        action.source
      );
      return;
    }

    let drawPile = [...this.state.drawPile];
    let discardPile = [...this.state.discardPile];
    const hand = [...this.state.hand];
    const pendingDraws: number[] = [payload.count];
    let safety = 0;

    while (pendingDraws.length > 0 && safety < 50) {
      const drawCount = pendingDraws.shift()!;
      safety += 1;
      let statusDrawnThisBatch = 0;

      for (let i = 0; i < drawCount; i++) {
        if (drawPile.length === 0) {
          if (discardPile.length === 0) break;

          const toShuffle = [...discardPile];
          if (this.rng) {
            drawPile = this.rng.shuffle(toShuffle);
          } else {
            drawPile = toShuffle.sort(() => Math.random() - 0.5);
          }
          discardPile = [];

          this.emitEvent(
            'DECK_SHUFFLED',
            { from: 'discardPile', to: 'drawPile' },
            action.source
          );
        }

        const card = drawPile.pop();
        if (!card) break;

        if (hand.length < MAX_HAND_SIZE) {
          hand.push(card);
          this.emitEvent(
            'CARD_MOVED',
            {
              cardId: card.id,
              card: card,
              from: 'drawPile',
              to: 'hand',
            },
            action.source
          );

          if (card.type === 'status') {
            statusDrawnThisBatch += 1;
          }
        } else {
          // StS behavior: overdrawn cards are burned to discard, not skipped.
          discardPile.push(card);
          this.emitEvent(
            'CARD_MOVED',
            {
              cardId: card.id,
              card: card,
              from: 'drawPile',
              to: 'discardPile',
              handFull: true,
              burned: true,
            },
            action.source
          );
        }
      }

      if (statusDrawnThisBatch > 0) {
        const fireBreathing = this.state.playerStats.statuses.fireBreathing || 0;
        if (fireBreathing > 0) {
          const fireBreathingDamage = fireBreathing * statusDrawnThisBatch;
          this.applyNonAttackAoEDamage(fireBreathingDamage, action.source);
        }

        const evolve = this.state.playerStats.statuses.evolve || 0;
        if (evolve > 0 && this.state.playerStats.statuses.noDraw === 0) {
          pendingDraws.push(evolve * statusDrawnThisBatch);
        }
      }
    }

    this.state = {
      ...this.state,
      hand,
      drawPile,
      discardPile,
    };
  }

  /**
   * APPLY_STATUS - Apply a status to player/enemies, with Artifact negation
   * for debuffs.
   * Expects ApplyStatusPayload.
   */
  private handleApplyStatus(action: Action): void {
    const payload = action.payload as ApplyStatusPayload | undefined;
    if (!payload || payload.amount === 0) return;

    const { target, targetId, status, amount } = payload;

    if (target === 'player') {
      const playerStatuses = { ...this.state.playerStats.statuses };

      if (this.isDebuffStatus(status) && amount > 0 && playerStatuses.artifact > 0) {
        playerStatuses.artifact -= 1;
        this.emitEvent(
          'STATUS_CHANGED',
          {
            target: 'player',
            status: 'artifact',
            delta: -1,
            newValue: playerStatuses.artifact,
            blockedStatus: status,
          },
          action.source
        );
      } else {
        // Handle "Flex" style effects: strength with timing: 'end_of_turn'
        // should add to tempStrength instead of strength
        if (status === 'strength' && payload.timing === 'end_of_turn') {
          // For Caffeine Boost: value is -2 at end of turn, so we store +2 in tempStrength
          playerStatuses.tempStrength = (playerStatuses.tempStrength || 0) + Math.abs(amount);
          this.emitEvent(
            'STATUS_CHANGED',
            {
              target: 'player',
              status: 'tempStrength',
              delta: Math.abs(amount),
              newValue: playerStatuses.tempStrength,
            },
            action.source
          );
        } else {
          const prev = (playerStatuses as any)[status] ?? 0;
          (playerStatuses as any)[status] = prev + amount;
          this.emitEvent(
            'STATUS_CHANGED',
            {
              target: 'player',
              status,
              delta: amount,
              newValue: (playerStatuses as any)[status],
            },
            action.source
          );
        }
      }

      this.state = {
        ...this.state,
        playerStats: {
          ...this.state.playerStats,
          statuses: playerStatuses,
        },
      };
      return;
    }

    if (target === 'enemy') {
      const enemies = this.state.enemies.map(e => ({
        ...e,
        statuses: { ...e.statuses },
      }));

      const enemy = enemies.find(e => e.id === targetId);
      if (!enemy) {
        this.state = { ...this.state, enemies };
        return;
      }

      if (this.isDebuffStatus(status) && amount > 0 && enemy.statuses.artifact > 0) {
        enemy.statuses.artifact -= 1;
        this.emitEvent(
          'STATUS_CHANGED',
          {
            target: 'enemy',
            targetId: enemy.id,
            status: 'artifact',
            delta: -1,
            newValue: enemy.statuses.artifact,
            blockedStatus: status,
          },
          action.source
        );
      } else {
        const prev = (enemy.statuses as any)[status] ?? 0;
        (enemy.statuses as any)[status] = prev + amount;
        this.emitEvent(
          'STATUS_CHANGED',
          {
            target: 'enemy',
            targetId: enemy.id,
            status,
            delta: amount,
            newValue: (enemy.statuses as any)[status],
          },
            action.source
          );

          if (status === 'vulnerable' && amount > 0) {
            this.applyPressureCookerWeak(enemy, action.source);
          }
      }

      this.state = {
        ...this.state,
        enemies,
      };
      return;
    }

    if (target === 'all_enemies') {
      const enemies = this.state.enemies.map(e => ({
        ...e,
        statuses: { ...e.statuses },
      }));

      for (const enemy of enemies) {
        if (this.isDebuffStatus(status) && amount > 0 && enemy.statuses.artifact > 0) {
          enemy.statuses.artifact -= 1;
          this.emitEvent(
            'STATUS_CHANGED',
            {
              target: 'enemy',
              targetId: enemy.id,
              status: 'artifact',
              delta: -1,
              newValue: enemy.statuses.artifact,
              blockedStatus: status,
            },
            action.source
          );
        } else {
          const prev = (enemy.statuses as any)[status] ?? 0;
          (enemy.statuses as any)[status] = prev + amount;
          this.emitEvent(
            'STATUS_CHANGED',
            {
              target: 'enemy',
              targetId: enemy.id,
              status,
              delta: amount,
              newValue: (enemy.statuses as any)[status],
            },
              action.source
            );

          if (status === 'vulnerable' && amount > 0) {
            this.applyPressureCookerWeak(enemy, action.source);
          }
        }
      }

      this.state = {
        ...this.state,
        enemies,
      };
    }
  }

  /**
   * EXHAUST_CARD - Move a card from a given zone into the exhaustPile.
   * Expects ExhaustCardPayload: { cardId: string; from: CardZone }
   */
  private handleExhaustCard(action: Action): void {
    const payload = action.payload as ExhaustCardPayload | undefined;
    if (!payload) return;
    this.exhaustCardFromZone(payload.cardId, payload.from, action.source);
  }

  /**
   * CHECK_VICTORY - Explicit victory/defeat check.
   * Can be used as a standalone action or after a batch of actions.
   */
  private handleCheckVictory(_action: Action): void {
    this.checkVictoryInternal();
  }

  /**
   * DEAL_DAMAGE_PER_BLOCK - Damage scales with current player mitigation.
   * Equivalent to Body Slam-style effects.
   */
  private handleDealDamagePerBlock(action: Action): void {
    const payload = action.payload as DealDamagePerBlockPayload | undefined;
    if (!payload) return;

    const mitigation = this.state.playerStats.mitigation;
    if (mitigation <= 0) return;

    const factor = payload.factor ?? 1;
    const baseAmount = mitigation * factor;
    if (baseAmount <= 0) return;

    const targetPayload: DealDamagePayload = {
      targets: payload.targets,
      targetId: payload.targetId,
      amount: baseAmount,
    };

    const enemies = this.resolveDamagePayload(targetPayload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
    }).enemies;

    this.state = { ...this.state, enemies };
    this.checkVictoryInternal();
  }

  /**
   * DEAL_DAMAGE_PER_MATCHES - Damage scales with number of matching cards
   * in the combat deck (Perfected Strike / Compounding).
   */
  private handleDealDamagePerMatches(action: Action): void {
    const payload = action.payload as DealDamagePerMatchesPayload | undefined;
    if (!payload) return;

    const { base, perMatch, matchString } = payload;

    const allCards: CardData[] = [
      ...this.state.hand,
      ...this.state.drawPile,
      ...this.state.discardPile,
      ...this.state.exhaustPile,
    ];

    const matches = allCards.filter(card => card.name.includes(matchString)).length;
    const baseAmount = base + perMatch * matches;
    if (baseAmount <= 0) return;

    const targetPayload: DealDamagePayload = {
      targets: payload.targets,
      targetId: payload.targetId,
      amount: baseAmount,
    };

    const enemies = this.resolveDamagePayload(targetPayload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
    }).enemies;

    this.state = { ...this.state, enemies };
    this.checkVictoryInternal();
  }

  /**
   * DEAL_DAMAGE_RAMPAGE - Ramping damage that increases on each play.
   * Stores a rampageBonus field on the specific card instance.
   */
  private handleDealDamageRampage(action: Action): void {
    const payload = action.payload as DealDamageRampagePayload | undefined;
    if (!payload) return;

    const { cardId, base, increment } = payload;

    // Locate the card instance across all player zones
    const zones: (keyof GameState)[] = ['hand', 'drawPile', 'discardPile', 'exhaustPile', 'deck'];
    let cardRef: CardData | undefined;

    for (const zone of zones) {
      const pile = (this.state as any)[zone] as CardData[] | undefined;
      if (!pile) continue;
      const found = pile.find(c => c.id === cardId);
      if (found) {
        cardRef = found;
        break;
      }
    }

    let bonus = 0;
    if (cardRef && typeof (cardRef as any).rampageBonus === 'number') {
      bonus = (cardRef as any).rampageBonus;
    }

    const baseAmount = base + bonus;
    if (baseAmount <= 0) {
      if (cardRef) {
        (cardRef as any).rampageBonus = bonus + increment;
      }
      return;
    }

    const targetPayload: DealDamagePayload = {
      targets: payload.targets,
      targetId: payload.targetId,
      amount: baseAmount,
    };
    const damageResult = this.resolveDamagePayload(targetPayload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
    });

    // Increase rampage bonus for future plays
    if (cardRef) {
      (cardRef as any).rampageBonus = bonus + increment;
    }

    this.state = {
      ...this.state,
      enemies: damageResult.enemies,
    };
    this.checkVictoryInternal();
  }

  /**
   * DEAL_DAMAGE_LIFESTEAL - Deals damage and heals the player based on
   * unblocked damage dealt (Reaper / Hostile Takeover style).
   */
  private handleDealDamageLifesteal(action: Action): void {
    const payload = action.payload as DealDamageLifestealPayload | undefined;
    if (!payload || payload.amount <= 0) return;

    const targetPayload: DealDamagePayload = {
      targets: payload.targets,
      targetId: payload.targetId,
      amount: payload.amount,
    };
    const damageResult = this.resolveDamagePayload(targetPayload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
    });

    // Apply lifesteal heal
    let nextPlayerStats = this.state.playerStats;
    if (damageResult.totalUnblocked > 0) {
      const hpBefore = nextPlayerStats.hp;
      const maxHp = nextPlayerStats.maxHp;
      const healAmount = Math.min(damageResult.totalUnblocked, maxHp - hpBefore);
      if (healAmount > 0) {
        nextPlayerStats = {
          ...nextPlayerStats,
          hp: hpBefore + healAmount,
        };
      }
    }

    this.state = {
      ...this.state,
      enemies: damageResult.enemies,
      playerStats: nextPlayerStats,
    };
    this.checkVictoryInternal();
  }

  /**
   * DEAL_DAMAGE_FEED - Single-target damage that grants max HP if the
   * target is killed by this hit (Feed / Acqui-Hire).
   */
  private handleDealDamageFeed(action: Action): void {
    const payload = action.payload as DealDamageFeedPayload | undefined;
    if (!payload || payload.amount <= 0) return;

    const targetPayload: DealDamagePayload = {
      targets: 'single',
      targetId: payload.targetId,
      amount: payload.amount,
    };
    const damageResult = this.resolveDamagePayload(targetPayload, action, {
      attackerStatuses: this.state.playerStats.statuses,
      triggersAttackReactions: true,
    });

    let nextPlayerStats = this.state.playerStats;

    // Apply Feed-style max HP gain if this hit killed the target
    if (damageResult.killedTargetIds.includes(payload.targetId) && payload.maxHpGain > 0) {
      const newMaxHp = nextPlayerStats.maxHp + payload.maxHpGain;
      const newHp = Math.min(newMaxHp, nextPlayerStats.hp + payload.maxHpGain);
      nextPlayerStats = {
        ...nextPlayerStats,
        maxHp: newMaxHp,
        hp: newHp,
      };
    }

    this.state = {
      ...this.state,
      enemies: damageResult.enemies,
      playerStats: nextPlayerStats,
    };
    this.checkVictoryInternal();
  }

  /**
   * FIEND_FIRE - Exhausts the entire hand, then deals damage per exhausted
   * card to a single target.
   */
  private handleFiendFire(action: Action): void {
    const payload = action.payload as FiendFirePayload | undefined;
    if (!payload || payload.perCardDamage <= 0) return;

    let hand = [...this.state.hand];

    // Filter out the card being played (it's handled separately)
    const cardsToExhaust = hand.filter(c => c.id !== payload.cardId);
    const numToExhaust = cardsToExhaust.length;

    // Exhaust all OTHER cards from hand
    for (const card of cardsToExhaust) {
      this.exhaustCardFromZone(card.id, 'hand', action.source);
    }

    // Preserve any cards drawn by exhaust hooks (e.g. Dark Embrace).
    hand = [...this.state.hand];

    const totalBaseDamage = payload.perCardDamage * numToExhaust;

    if (totalBaseDamage > 0) {
      const targetPayload: DealDamagePayload = {
        targets: 'single',
        targetId: payload.targetId,
        amount: totalBaseDamage,
      };
      const damageResult = this.resolveDamagePayload(targetPayload, action, {
        attackerStatuses: this.state.playerStats.statuses,
        triggersAttackReactions: true,
      });
      this.state = {
        ...this.state,
        enemies: damageResult.enemies,
      };
    }

    this.state = {
      ...this.state,
      hand,
    };
    this.checkVictoryInternal();
  }

  /**
   * EXHUME - Retrieves the most recent card(s) from exhaust pile to hand.
   */
  private handleExhume(action: Action): void {
    const payload = action.payload as ExhumePayload | undefined;
    const count = payload?.count ?? 1;
    if (count <= 0) return;

    const exhaustPile = [...this.state.exhaustPile];
    const hand = [...this.state.hand];

    for (let i = 0; i < count && exhaustPile.length > 0; i++) {
      const retrieved = exhaustPile.pop()!;

      if (hand.length < MAX_HAND_SIZE) {
        hand.push(retrieved);
        this.emitEvent(
          'CARD_MOVED',
          { cardId: retrieved.id, from: 'exhaustPile', to: 'hand' },
          action.source
        );
      } else {
        // Hand full - card goes to discard instead
        const discardPile = [...this.state.discardPile, retrieved];
        this.state = { ...this.state, discardPile };
        this.emitEvent(
          'CARD_MOVED',
          { cardId: retrieved.id, from: 'exhaustPile', to: 'discardPile' },
          action.source
        );
      }
    }

    this.state = {
      ...this.state,
      hand,
      exhaustPile,
    };
  }

  /**
   * ADD_CARD - Create new card instances from templates or by copying an
   * existing card, then insert them into the specified destination zone.
   */
  private handleAddCard(action: Action): void {
    const payload = action.payload as AddCardPayload | undefined;
    if (!payload) return;

    const { templateId, copyOfCardId, destination, count, costOverride } = payload;
    if (!templateId && !copyOfCardId) return;
    if (count <= 0) return;

    let hand = [...this.state.hand];
    let drawPile = [...this.state.drawPile];
    let discardPile = [...this.state.discardPile];

    const resolveTemplate = (): CardData | null => {
      if (templateId) {
        const template = (GAME_DATA.cards as Record<string, CardData>)[templateId];
        return template || null;
      }
      if (copyOfCardId) {
        const zones: (keyof GameState)[] = ['hand', 'drawPile', 'discardPile', 'exhaustPile', 'deck'];
        for (const zone of zones) {
          const pile = (this.state as any)[zone] as CardData[] | undefined;
          if (!pile) continue;
          const found = pile.find(c => c.id === copyOfCardId);
          if (found) return found;
        }
      }
      return null;
    };

    for (let i = 0; i < count; i++) {
      const base = resolveTemplate();
      if (!base) break;

      const newCard: CardData = {
        ...base,
        id: `${base.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      };
      if (typeof costOverride === 'number') {
        newCard.cost = costOverride;
      }

      if (destination === 'hand') {
        if (hand.length < MAX_HAND_SIZE) {
          hand.push(newCard);
          this.emitEvent(
            'CARD_MOVED',
            { cardId: newCard.id, from: 'generated', to: 'hand' },
            action.source
          );
        } else {
          discardPile.push(newCard);
          this.emitEvent(
            'CARD_MOVED',
            { cardId: newCard.id, from: 'generated', to: 'discardPile', handFull: true },
            action.source
          );
        }
      } else if (destination === 'drawPile') {
        drawPile.push(newCard);
        this.emitEvent(
          'CARD_MOVED',
          { cardId: newCard.id, from: 'generated', to: 'drawPile' },
          action.source
        );
      } else {
        // destination === 'discardPile'
        discardPile.push(newCard);
        this.emitEvent(
          'CARD_MOVED',
          { cardId: newCard.id, from: 'generated', to: 'discardPile' },
          action.source
        );
      }
    }

    this.state = {
      ...this.state,
      hand,
      drawPile,
      discardPile,
    };
  }

  /**
   * EXHAUST_RANDOM_FROM_HAND - Exhaust a random subset of cards from hand.
   */
  private handleExhaustRandomFromHand(action: Action): void {
    const payload = action.payload as ExhaustRandomFromHandPayload | undefined;
    if (!payload || payload.count <= 0) return;

    let hand = [...this.state.hand];

    const toExhaust = Math.min(payload.count, hand.length);
    for (let i = 0; i < toExhaust; i++) {
      if (hand.length === 0) break;

      const index = this.rng
        ? this.rng.nextInt(0, hand.length - 1)
        : Math.floor(Math.random() * hand.length);
      const [card] = hand.splice(index, 1);
      this.state = {
        ...this.state,
        hand,
      };
      this.exhaustCardFromZone(card.id, 'hand', action.source);
      hand = [...this.state.hand];
    }
  }

  /**
   * EXHAUST_NON_ATTACKS_FROM_HAND - Exhaust all non-attack cards from hand.
   * Optionally grants block per exhausted card (Second Wind style).
   */
  private handleExhaustNonAttacksFromHand(action: Action): void {
    const payload = action.payload as ExhaustNonAttacksFromHandPayload | undefined;
    const toExhaust = this.state.hand.filter(card => card.type !== 'attack');

    if (toExhaust.length === 0) return;

    for (const card of toExhaust) {
      this.exhaustCardFromZone(card.id, 'hand', action.source);
    }

    // Apply optional block gain per exhausted card (Second Wind).
    if (payload?.blockPerExhausted && payload.blockPerExhausted > 0) {
      const totalBlock = payload.blockPerExhausted * toExhaust.length;
      if (totalBlock > 0) {
        const gainBlockAction: Action = {
          type: 'GAIN_BLOCK',
          payload: { amount: totalBlock } as GainBlockPayload,
          source: action.source,
        };
        this.handleGainBlock(gainBlockAction);
      }
    }
  }

  /**
   * SELECT_CARDS - Initiates a player selection by setting up a PendingChoice.
   * This pauses the reducer until the UI returns a ChoiceResult.
   */
  private handleSelectCards(action: Action): void {
    const payload = action.payload as SelectCardsPayload | undefined;
    if (!payload) return;

    const { zone, count, kind, filterType, message } = payload;

    // Build a follow-up action based on the kind
    let followUpAction: Action;
    switch (kind) {
      case 'upgrade':
        followUpAction = { type: 'UPGRADE_SELECTED', payload: { selectedCardIds: [] }, source: action.source };
        break;
      case 'exhaust':
        followUpAction = { type: 'EXHAUST_SELECTED', payload: { selectedCardIds: [], from: zone }, source: action.source };
        break;
      case 'discard':
        followUpAction = { type: 'DISCARD_SELECTED', payload: { selectedCardIds: [] }, source: action.source };
        break;
      case 'retrieve':
        followUpAction = { type: 'PUT_ON_DECK', payload: { selectedCardIds: [], from: zone }, source: action.source };
        break;
      case 'putOnDeck':
        followUpAction = { type: 'PUT_ON_DECK', payload: { selectedCardIds: [], from: zone }, source: action.source };
        break;
      default:
        return;
    }

    // Build filter function if needed
    let filter: ((card: CardData) => boolean) | undefined;
    if (filterType === 'upgradeable') {
      filter = (card: CardData) => !card.upgraded;
    } else if (filterType === 'nonStatus') {
      filter = (card: CardData) => card.type !== 'status';
    }

    const choiceId = `choice_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    this.pendingChoice = {
      id: choiceId,
      source: action.source || 'unknown',
      zone: zone as any,
      count,
      kind,
      filter,
      followUpAction,
      message,
    };

    // Set legacy state.status for UI compatibility
    const legacyStatus: GameState['status'] = 'CARD_SELECTION';

    // Map zone to context expected by pendingSelection
    const contextMap: Record<string, 'hand' | 'discard_pile' | 'discard' | 'deck'> = {
      hand: 'hand',
      discardPile: 'discard_pile',
      exhaustPile: 'discard_pile', // Use discard_pile for exhaust selections too
      drawPile: 'deck',
      deck: 'deck',
    };

    // Map kind to action expected by pendingSelection
    const actionMap: Record<string, 'upgrade' | 'move_to_draw_pile' | 'exhaust' | 'add_to_hand' | 'remove' | 'transform'> = {
      upgrade: 'upgrade',
      exhaust: 'exhaust',
      retrieve: 'move_to_draw_pile',
      putOnDeck: 'move_to_draw_pile',
      discard: 'exhaust', // Close enough for UI purposes
    };

    this.state = {
      ...this.state,
      status: legacyStatus as any,
      pendingSelection: {
        type: kind as any,
        context: contextMap[zone] || 'hand',
        action: actionMap[kind] || 'exhaust',
        count,
        message,
      },
    };

    this.emitEvent('CHOICE_PROMPTED', { choiceId, zone, count, kind, message }, action.source);
  }

  /**
   * UPGRADE_SELECTED - Upgrades the selected cards (sets upgraded = true).
   */
  private handleUpgradeSelected(action: Action): void {
    const payload = action.payload as UpgradeSelectedPayload | undefined;
    if (!payload || !payload.selectedCardIds || payload.selectedCardIds.length === 0) return;

    const selectedSet = new Set(payload.selectedCardIds);
    const zones: ('hand' | 'drawPile' | 'discardPile' | 'deck')[] = ['hand', 'drawPile', 'discardPile', 'deck'];

    const newState = { ...this.state };

    for (const zoneName of zones) {
      const pile = newState[zoneName] as CardData[];
      newState[zoneName] = pile.map(card => {
        if (selectedSet.has(card.id) && !card.upgraded) {
          this.emitEvent('CARD_UPGRADED', { cardId: card.id, cardName: card.name }, action.source);
          return { ...card, upgraded: true };
        }
        return card;
      }) as any;
    }

    this.state = newState;
  }

  /**
   * EXHAUST_SELECTED - Exhausts the selected cards from the specified zone.
   */
  private handleExhaustSelected(action: Action): void {
    const payload = action.payload as ExhaustSelectedPayload | undefined;
    if (!payload || !payload.selectedCardIds || payload.selectedCardIds.length === 0) return;

    const selectedSet = new Set(payload.selectedCardIds);
    const from = payload.from;
    const sourceZone = [...(this.state[from] as CardData[])];
    const toExhaust = sourceZone.filter(card => selectedSet.has(card.id));

    for (const card of toExhaust) {
      this.exhaustCardFromZone(card.id, from, action.source);
    }
  }

  /**
   * DISCARD_SELECTED - Discards the selected cards from hand.
   */
  private handleDiscardSelected(action: Action): void {
    const payload = action.payload as DiscardSelectedPayload | undefined;
    if (!payload || !payload.selectedCardIds || payload.selectedCardIds.length === 0) return;

    const selectedSet = new Set(payload.selectedCardIds);

    let hand = [...this.state.hand];
    let discardPile = [...this.state.discardPile];

    const toDiscard: CardData[] = [];
    const remaining: CardData[] = [];

    for (const card of hand) {
      if (selectedSet.has(card.id)) {
        toDiscard.push(card);
      } else {
        remaining.push(card);
      }
    }

    discardPile.push(...toDiscard);

    for (const card of toDiscard) {
      this.emitEvent('CARD_MOVED', { cardId: card.id, from: 'hand', to: 'discardPile' }, action.source);
    }

    this.state = {
      ...this.state,
      hand: remaining,
      discardPile,
    };
  }

  /**
   * RETRIEVE_TO_HAND - Moves selected cards from a zone to hand.
   */
  private handleRetrieveToHand(action: Action): void {
    const payload = action.payload as RetrieveToHandPayload | undefined;
    if (!payload || !payload.selectedCardIds || payload.selectedCardIds.length === 0) return;

    const selectedSet = new Set(payload.selectedCardIds);
    const from = payload.from;

    let sourceZone = [...(this.state[from] as CardData[])];
    let hand = [...this.state.hand];

    const toRetrieve: CardData[] = [];
    const remaining: CardData[] = [];

    for (const card of sourceZone) {
      if (selectedSet.has(card.id)) {
        toRetrieve.push(card);
      } else {
        remaining.push(card);
      }
    }

    // Respect hand limit
    for (const card of toRetrieve) {
      if (hand.length < MAX_HAND_SIZE) {
        hand.push(card);
        this.emitEvent('CARD_MOVED', { cardId: card.id, from, to: 'hand' }, action.source);
      } else {
        // Can't fit in hand, leave in source or discard
        remaining.push(card);
      }
    }

    this.state = {
      ...this.state,
      [from]: remaining,
      hand,
    };
  }

  /**
   * PUT_ON_DECK - Moves selected cards to top of draw pile.
   */
  private handlePutOnDeck(action: Action): void {
    const payload = action.payload as PutOnDeckPayload | undefined;
    if (!payload || !payload.selectedCardIds || payload.selectedCardIds.length === 0) return;

    const selectedSet = new Set(payload.selectedCardIds);
    const from = payload.from;

    let sourceZone = [...(this.state[from] as CardData[])];
    let drawPile = [...this.state.drawPile];

    const toMove: CardData[] = [];
    const remaining: CardData[] = [];

    for (const card of sourceZone) {
      if (selectedSet.has(card.id)) {
        toMove.push(card);
      } else {
        remaining.push(card);
      }
    }

    // Add to top of draw pile (end of array = top)
    for (const card of toMove) {
      drawPile.push(card);
      this.emitEvent('CARD_MOVED', { cardId: card.id, from, to: 'drawPile', position: 'top' }, action.source);
    }

    this.state = {
      ...this.state,
      [from]: remaining,
      drawPile,
    };
  }

  /**
   * CONDITIONAL_STRENGTH - Gain strength if condition is met.
   * Spot Weakness: gain if any enemy is attacking.
   */
  private handleConditionalStrength(action: Action): void {
    const payload = action.payload as { amount: number; condition: string } | undefined;
    if (!payload || payload.amount <= 0) return;

    if (payload.condition === 'enemy_attacking') {
      const anyAttacking = this.state.enemies.some(
        e => e.hp > 0 && e.currentIntent?.type === 'attack'
      );
      if (!anyAttacking) return;
    }

    const playerStatuses = { ...this.state.playerStats.statuses };
    playerStatuses.strength = (playerStatuses.strength || 0) + payload.amount;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        statuses: playerStatuses,
      },
    };

    this.emitEvent('STATUS_CHANGED', {
      target: 'player',
      status: 'strength',
      delta: payload.amount,
      newValue: playerStatuses.strength,
    }, action.source);
  }

  /**
   * CONDITIONAL_REFUND - Refund bandwidth if condition is met.
   * Dropkick: refund if target enemy is vulnerable.
   */
  private handleConditionalRefund(action: Action): void {
    const payload = action.payload as { amount: number; condition: string; targetId?: string } | undefined;
    if (!payload || payload.amount <= 0) return;

    if (payload.condition === 'enemy_vulnerable') {
      const enemy = this.state.enemies.find(e => e.id === payload.targetId);
      if (!enemy || enemy.statuses.vulnerable <= 0) return;
    }

    const bandwidth = this.state.playerStats.bandwidth + payload.amount;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        bandwidth,
      },
    };
  }

  /**
   * BLOOD_COST_REFUND - Refund bandwidth based on HP lost from max.
   * Bootstrapped style effect.
   */
  private handleBloodCostRefund(action: Action): void {
    const payload = action.payload as { cardCost: number } | undefined;
    if (!payload) return;

    const hpLost = this.state.playerStats.maxHp - this.state.playerStats.hp;
    const reduction = Math.min(payload.cardCost, Math.max(0, hpLost));
    const refund = reduction;

    if (refund <= 0) return;

    const bandwidth = this.state.playerStats.bandwidth + refund;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        bandwidth,
      },
    };
  }

  /**
   * DOUBLE_STRENGTH - Double current strength.
   * Limit Break style effect.
   */
  private handleDoubleStrength(action: Action): void {
    const playerStatuses = { ...this.state.playerStats.statuses };
    const current = playerStatuses.strength || 0;
    playerStatuses.strength = current * 2;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        statuses: playerStatuses,
      },
    };

    this.emitEvent('STATUS_CHANGED', {
      target: 'player',
      status: 'strength',
      delta: current,
      newValue: playerStatuses.strength,
    }, action.source);
  }

  /**
   * LOSE_HP - Player loses HP directly (not damage, bypasses block).
   */
  private handleLoseHp(action: Action): void {
    const payload = action.payload as { amount: number } | undefined;
    if (!payload || payload.amount <= 0) return;

    let newHp = Math.max(0, this.state.playerStats.hp - payload.amount);
    const playerStatuses = { ...this.state.playerStats.statuses };

    // Antifragile: gain strength when losing HP
    if (playerStatuses.antifragile > 0) {
      playerStatuses.strength = (playerStatuses.strength || 0) + playerStatuses.antifragile;
    }

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        hp: newHp,
        statuses: playerStatuses,
      },
    };

    this.checkVictoryInternal();
  }

  /**
   * GAIN_BANDWIDTH - Add bandwidth to the player.
   */
  private handleGainBandwidth(action: Action): void {
    const payload = action.payload as { amount: number } | undefined;
    if (!payload || payload.amount <= 0) return;

    const bandwidth = this.state.playerStats.bandwidth + payload.amount;

    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        bandwidth,
      },
    };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private resolveDamagePayload(
    payload: DealDamagePayload,
    action: Action,
    options: {
      attackerStatuses: EntityStatus;
      triggersAttackReactions: boolean;
      emitBump?: boolean;
    }
  ): { enemies: EnemyData[]; totalUnblocked: number; killedTargetIds: string[] } {
    const enemies: EnemyData[] = this.state.enemies.map(e => ({
      ...e,
      statuses: { ...e.statuses },
    }));
    const totalUnblockedByTarget = new Map<string, number>();
    const killedTargetIds = new Set<string>();
    const reactionState = new Map<string, { tookUnblockedHit: boolean; malleableBlock: number }>();

    if (options.emitBump && action.source) {
      this.emitEvent(
        'BUMP',
        {
          targetId: action.source,
          direction: action.source === 'player' ? 'right' : 'left',
        },
        action.source
      );
    }

    const hits = payload.hits && payload.hits > 0 ? payload.hits : 1;

    for (let hit = 0; hit < hits; hit++) {
      const targets = this.getTargetEnemies(payload, enemies);
      if (targets.length === 0) break;

      for (const enemy of targets) {
        if (enemy.hp <= 0) continue;

        const damage = this.calculateFinalDamage(
          payload.amount,
          options.attackerStatuses,
          enemy.statuses,
          payload.strengthMultiplier ?? 1,
          this.state.relics
        );

        let remaining = damage;
        let blocked = 0;

        if (enemy.mitigation > 0 && remaining > 0) {
          blocked = Math.min(enemy.mitigation, remaining);
          enemy.mitigation -= blocked;
          remaining -= blocked;
        }

        const prevHp = enemy.hp;
        if (remaining > 0) {
          enemy.hp = Math.max(0, enemy.hp - remaining);
          totalUnblockedByTarget.set(enemy.id, (totalUnblockedByTarget.get(enemy.id) || 0) + remaining);
          if (enemy.hp === 0) {
            killedTargetIds.add(enemy.id);
          }

          if (options.triggersAttackReactions) {
            const state = reactionState.get(enemy.id) || { tookUnblockedHit: false, malleableBlock: 0 };
            state.tookUnblockedHit = true;
            if (enemy.statuses.malleable > 0) {
              state.malleableBlock += enemy.statuses.malleable;
              enemy.statuses.malleable += 1;
            }
            reactionState.set(enemy.id, state);
          }
        }

        this.emitEvent(
          'HIT',
          {
            targetId: enemy.id,
            enemyName: enemy.name,
            amount: remaining,
            blocked,
            hpBefore: prevHp,
            hpAfter: enemy.hp,
            lethal: enemy.hp === 0,
          },
          action.source
        );
      }
    }

    if (options.triggersAttackReactions) {
      for (const enemy of enemies) {
        const reaction = reactionState.get(enemy.id);
        if (!reaction?.tookUnblockedHit) continue;

        if (enemy.statuses.curlUp > 0) {
          enemy.mitigation += enemy.statuses.curlUp;
          enemy.statuses.curlUp = 0;
        }

        if (reaction.malleableBlock > 0) {
          enemy.mitigation += reaction.malleableBlock;
        }

        if (enemy.statuses.asleep > 0) {
          enemy.statuses.asleep = 0;
        }

        if (
          enemy.id.startsWith('boss_the_monolith') &&
          enemy.hp <= enemy.maxHp / 2 &&
          enemy.currentIntent?.type !== 'unknown'
        ) {
          enemy.currentIntent = {
            type: 'unknown',
            value: 0,
            icon: 'unknown',
            description: 'Splitting...',
          };
        }
      }
    }

    return {
      enemies,
      totalUnblocked: Array.from(totalUnblockedByTarget.values()).reduce((sum, value) => sum + value, 0),
      killedTargetIds: Array.from(killedTargetIds),
    };
  }

  private applyNonAttackAoEDamage(amount: number, source?: string): void {
    if (amount <= 0) return;

    const enemies: EnemyData[] = this.state.enemies.map(e => ({
      ...e,
      statuses: { ...e.statuses },
    }));

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;

      let damage = amount;
      if (enemy.statuses.vulnerable > 0) {
        damage = Math.floor(damage * this.getVulnerableMultiplierInternal(this.state.relics));
      }

      if (enemy.mitigation > 0 && damage > 0) {
        const blocked = Math.min(enemy.mitigation, damage);
        enemy.mitigation -= blocked;
        damage -= blocked;
      }

      if (damage > 0) {
        enemy.hp = Math.max(0, enemy.hp - damage);
      }
    }

    this.state = {
      ...this.state,
      enemies,
    };
    this.checkVictoryInternal();
  }

  private exhaustCardFromZone(
    cardId: string,
    from: 'hand' | 'drawPile' | 'discardPile' | 'deck' | 'exhaustPile',
    source?: string
  ): CardData | undefined {
    let { hand, drawPile, discardPile, exhaustPile } = this.state;
    let deck = [...this.state.deck];
    let cardToExhaust: CardData | undefined;

    if (from === 'hand') {
      hand = [...hand];
      const index = hand.findIndex(c => c.id === cardId);
      if (index !== -1) {
        [cardToExhaust] = hand.splice(index, 1);
      }
    } else if (from === 'drawPile') {
      drawPile = [...drawPile];
      const index = drawPile.findIndex(c => c.id === cardId);
      if (index !== -1) {
        [cardToExhaust] = drawPile.splice(index, 1);
      }
    } else if (from === 'discardPile') {
      discardPile = [...discardPile];
      const index = discardPile.findIndex(c => c.id === cardId);
      if (index !== -1) {
        [cardToExhaust] = discardPile.splice(index, 1);
      }
    } else if (from === 'deck') {
      const index = deck.findIndex(c => c.id === cardId);
      if (index !== -1) {
        [cardToExhaust] = deck.splice(index, 1);
      }
    } else {
      return undefined;
    }

    if (!cardToExhaust) {
      return undefined;
    }

    exhaustPile = [...exhaustPile, cardToExhaust];

    this.emitEvent(
      'CARD_MOVED',
      {
        cardId: cardToExhaust.id,
        card: cardToExhaust,
        from,
        to: 'exhaustPile',
      },
      source
    );

    this.state = {
      ...this.state,
      hand,
      drawPile,
      discardPile,
      exhaustPile,
      deck,
    };

    this.onCardExhausted(cardToExhaust, source);
    return cardToExhaust;
  }

  private onCardExhausted(card: CardData, source?: string): void {
    const feelNoPain = this.state.playerStats.statuses.feelNoPain || 0;
    if (feelNoPain > 0) {
      this.handleGainBlock({
        type: 'GAIN_BLOCK',
        payload: { amount: feelNoPain } as GainBlockPayload,
        source,
      });
    }

    const sentinelEffect = card.effects?.find(effect => effect.type === 'sentinel_effect');
    if (sentinelEffect?.value) {
      this.handleGainBandwidth({
        type: 'GAIN_BANDWIDTH',
        payload: { amount: sentinelEffect.value },
        source,
      });
    }

    const phoenixDamage = getPhoenixProtocolDamage(this.state.relics);
    if (phoenixDamage > 0) {
      const enemies = this.state.enemies.map(enemy => ({
        ...enemy,
        statuses: { ...enemy.statuses },
      }));

      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        enemy.hp = Math.max(0, enemy.hp - phoenixDamage);
      }

      this.state = {
        ...this.state,
        enemies,
      };
      this.checkVictoryInternal();
    }

    const darkEmbrace = this.state.playerStats.statuses.darkEmbrace || 0;
    if (darkEmbrace > 0) {
      this.handleDrawCards({
        type: 'DRAW_CARDS',
        payload: { count: darkEmbrace } as DrawCardsPayload,
        source,
      });
    }
  }

  /**
   * Emit a GameEvent into the EventLog.
   */
  private emitEvent(
    type: GameEventType,
    payload: Record<string, any>,
    source?: string
  ): void {
    const event: GameEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source,
    };
    this.eventLog.append(event);
  }

  /**
   * Resolve target enemies based on DealDamagePayload.targets.
   */
  private getTargetEnemies(
    payload: DealDamagePayload,
    enemiesOverride?: EnemyData[]
  ): EnemyData[] {
    const enemies = (enemiesOverride ?? this.state.enemies).filter(e => e.hp > 0);
    if (enemies.length === 0) return [];

    switch (payload.targets) {
      case 'all':
        return enemies;
      case 'single': {
        if (payload.targetId) {
          const found = enemies.find(e => e.id === payload.targetId);
          return found ? [found] : [];
        }
        // Fallback: first living enemy
        return [enemies[0]];
      }
      case 'random': {
        if (!this.rng) {
          const idx = Math.floor(Math.random() * enemies.length);
          return [enemies[idx]];
        }
        const picked = this.rng.pick(enemies);
        return [picked];
      }
      default:
        return [];
    }
  }

  /**
   * Calculate final damage with strength, weak, and vulnerable modifiers.
   * Mirrors calculateDamage behavior from gameLogic.ts, including
   * Growth Mindset's vulnerable bonus and Crunch Mode strength bonus.
   */
  private calculateFinalDamage(
    baseDamage: number,
    attackerStatuses: EntityStatus,
    defenderStatuses: EntityStatus,
    strengthMultiplier: number = 1,
    relics: RelicData[] = []
  ): number {
    // Apply Crunch Mode (Red Skull) bonus strength when player HP ≤50%
    const crunchBonus = getCrunchModeStrength(
      relics,
      this.state.playerStats.hp,
      this.state.playerStats.maxHp
    );
    const effectiveStrength = ((attackerStatuses as any).strength || 0) + crunchBonus;

    let damage = baseDamage + effectiveStrength * strengthMultiplier;

    if ((attackerStatuses as any).weak > 0) {
      damage *= 0.75;
    }

    if ((defenderStatuses as any).vulnerable > 0) {
      const vulnMultiplier = this.getVulnerableMultiplierInternal(relics);
      damage *= vulnMultiplier;
    }

    if (damage < 0) damage = 0;
    return Math.floor(damage);
  }

  /**
   * Growth Mindset (vulnerable_bonus relic) handling.
   * Default vulnerable = 50% more damage; Growth Mindset = 75%.
   */
  private getVulnerableMultiplierInternal(relics: RelicData[]): number {
    const growthMindset = relics.find(r => r.effect.type === 'vulnerable_bonus');
    if (growthMindset) {
      return 1.75;
    }
    return 1.5;
  }

  /**
   * Simple classification of debuff statuses for Artifact negation.
   */
  private isDebuffStatus(status: string): boolean {
    return status === 'vulnerable' || status === 'weak' || status === 'frail' || status === 'noDraw';
  }

  /**
   * Shared victory/defeat check logic.
   */
  private checkVictoryInternal(): void {
    const playerHp = this.state.playerStats.hp;

    if (playerHp <= 0) {
      if (this.state.status !== 'GAME_OVER') {
        this.state = {
          ...this.state,
          status: 'GAME_OVER',
          message: this.state.message || 'RUNWAY DEPLETED. STARTUP FAILED.',
        };
        this.emitEvent('DEFEAT', { reason: 'hp_zero' });
      }
      return;
    }

    if (this.state.enemies.length === 0) return;

    const allDead = this.state.enemies.every(e => e.hp <= 0);
    if (allDead) {
      if (this.state.status !== 'VICTORY' && this.state.status !== 'VICTORY_ALL') {
        this.state = {
          ...this.state,
          status: 'VICTORY',
          message: this.state.message || 'PROBLEM SOLVED.',
        };
        this.emitEvent('VICTORY', {});
      }
    }
  }

  /**
   * Placeholder hook for Juggernaut-like effects (deal damage when block is gained).
   * In later phases this will enqueue TRIGGER_HOOK actions or direct damage actions.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private triggerJuggernautPlaceholder(_blockGained: number): void {
    if (_blockGained <= 0) return;

    const juggernaut = this.state.playerStats.statuses.juggernaut || 0;
    if (juggernaut <= 0) return;

    const enemies: EnemyData[] = this.state.enemies.map(e => ({
      ...e,
      statuses: { ...e.statuses },
    }));
    const live = enemies.filter(e => e.hp > 0);
    if (live.length === 0) return;

    const target = this.rng
      ? this.rng.pick(live)
      : live[Math.floor(Math.random() * live.length)];

    let damage = juggernaut;
    if (target.statuses.vulnerable > 0) {
      damage = Math.floor(damage * this.getVulnerableMultiplierInternal(this.state.relics));
    }
    if (damage <= 0) return;

    let remaining = damage;
    let blocked = 0;
    if (target.mitigation > 0) {
      blocked = Math.min(target.mitigation, remaining);
      target.mitigation -= blocked;
      remaining -= blocked;
    }

    const hpBefore = target.hp;
    if (remaining > 0) {
      target.hp = Math.max(0, target.hp - remaining);
    }

    this.emitEvent(
      'HIT',
      {
        targetId: target.id,
        enemyName: target.name,
        amount: remaining,
        blocked,
        hpBefore,
        hpAfter: target.hp,
        lethal: target.hp === 0,
        fromJuggernaut: true,
      },
      'juggernaut'
    );

    this.state = {
      ...this.state,
      enemies,
    };
    this.checkVictoryInternal();
  }

  private applyPressureCookerWeak(enemy: EnemyData, source?: string): void {
    const weakToApply = getPressureCookerWeak(this.state.relics);
    if (weakToApply <= 0) return;

    if (enemy.statuses.artifact > 0) {
      enemy.statuses.artifact -= 1;
      this.emitEvent(
        'STATUS_CHANGED',
        {
          target: 'enemy',
          targetId: enemy.id,
          status: 'artifact',
          delta: -1,
          newValue: enemy.statuses.artifact,
          blockedStatus: 'weak',
        },
        source
      );
      return;
    }

    const weakBefore = enemy.statuses.weak;
    enemy.statuses.weak += weakToApply;
    this.emitEvent(
      'STATUS_CHANGED',
      {
        target: 'enemy',
        targetId: enemy.id,
        status: 'weak',
        delta: weakToApply,
        newValue: enemy.statuses.weak,
        previousValue: weakBefore,
        fromRelic: 'pressure_cooker',
      },
      source
    );
  }
}
