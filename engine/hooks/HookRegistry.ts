/**
 * Hook Registry
 * 
 * Central registry for lifecycle hooks that relics, powers, and enemies
 * can subscribe to. When an event occurs, the reducer fires the appropriate
 * hook and collects any Actions to enqueue.
 */

import type { Action } from '../actions.ts';
import type { GameState, RelicData } from '../../types.ts';

/**
 * All possible hook lifecycle points.
 */
export type HookType =
  | 'onTurnStart'
  | 'onTurnEnd'
  | 'onCombatStart'
  | 'onCombatEnd'
  | 'onCardPlay'
  | 'onAttackPlay'
  | 'onCardExhaust'
  | 'onCardDiscard'
  | 'onDamageDealt'
  | 'onDamageTaken'
  | 'onBlockGained'
  | 'onStatusApplied'
  | 'onEnemyDeath'
  | 'onHpLoss'
  | 'onDraw';

/**
 * Context passed to hook handlers.
 */
export interface HookContext {
  state: GameState;
  /** For card-related hooks */
  cardId?: string;
  cardType?: string;
  /** For damage-related hooks */
  damageAmount?: number;
  targetId?: string;
  /** For status hooks */
  status?: string;
  statusAmount?: number;
  /** For block hooks */
  blockAmount?: number;
  /** For exhaust hooks */
  exhaustedCardId?: string;
}

/**
 * A hook handler function that examines context and returns Actions to enqueue.
 */
export type HookHandler = (context: HookContext, relic: RelicData) => Action[];

/**
 * Registry that maps hook types to handler functions per relic.
 */
export class HookRegistry {
  private handlers: Map<HookType, Map<string, HookHandler>> = new Map();

  /**
   * Register a handler for a specific hook type and relic ID.
   */
  register(hook: HookType, relicId: string, handler: HookHandler): void {
    if (!this.handlers.has(hook)) {
      this.handlers.set(hook, new Map());
    }
    this.handlers.get(hook)!.set(relicId, handler);
  }

  /**
   * Fire a hook and collect all Actions from registered handlers.
   * Only fires for relics the player currently has.
   */
  fire(hook: HookType, context: HookContext): Action[] {
    const hookHandlers = this.handlers.get(hook);
    if (!hookHandlers) return [];

    const actions: Action[] = [];
    const playerRelics = context.state.relics || [];

    for (const relic of playerRelics) {
      const handler = hookHandlers.get(relic.id);
      if (handler) {
        const relicActions = handler(context, relic);
        actions.push(...relicActions);
      }
    }

    return actions;
  }

  /**
   * Clear all registered handlers (for testing).
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Global hook registry instance.
 */
export const globalHookRegistry = new HookRegistry();
