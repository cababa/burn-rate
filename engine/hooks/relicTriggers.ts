/**
 * Relic Triggers
 * 
 * Registers relic-specific hook handlers into the HookRegistry.
 * Each relic that has an active trigger is registered here.
 */

import type { Action, GainBlockPayload, DealDamagePayload, DrawCardsPayload, ApplyStatusPayload } from '../actions.ts';
import type { HookContext } from './HookRegistry.ts';
import { globalHookRegistry } from './HookRegistry.ts';
import type { RelicData } from '../../types.ts';

/**
 * Initialize all relic triggers.
 * Call this once at game startup.
 */
export function initRelicTriggers(): void {
  // --- TURN START RELICS ---
  
  // Hourglass: Draw 1 card at turn start
  globalHookRegistry.register('onTurnStart', 'relic_hourglass', (_ctx, relic): Action[] => {
    const count = relic.effect.value || 1;
    return [{
      type: 'DRAW_CARDS',
      payload: { count } as DrawCardsPayload,
      source: relic.id,
    }];
  });

  // Coffee Mug: Gain 3 block at turn start
  globalHookRegistry.register('onTurnStart', 'relic_coffee_mug', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 3;
    return [{
      type: 'GAIN_BLOCK',
      payload: { amount } as GainBlockPayload,
      source: relic.id,
    }];
  });

  // Standing Desk: Gain 4 strength at turn start (first turn only - needs state tracking)
  // Note: first_turn trigger needs special handling in reducer

  // --- COMBAT START RELICS ---

  // Sticky Note: Apply 1 vulnerable to all enemies at combat start
  globalHookRegistry.register('onCombatStart', 'relic_sticky_note', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 1;
    return [{
      type: 'APPLY_STATUS',
      payload: {
        target: 'all_enemies',
        status: 'vulnerable',
        amount,
      } as ApplyStatusPayload,
      source: relic.id,
    }];
  });

  // Safety Net: Gain 10 block at combat start
  globalHookRegistry.register('onCombatStart', 'relic_safety_net', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 10;
    return [{
      type: 'GAIN_BLOCK',
      payload: { amount } as GainBlockPayload,
      source: relic.id,
    }];
  });

  // --- ON EXHAUST RELICS ---

  // Feel No Pain / Dark Embrace style: Gain block/draw on exhaust
  globalHookRegistry.register('onCardExhaust', 'relic_feel_no_pain', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 3;
    return [{
      type: 'GAIN_BLOCK',
      payload: { amount } as GainBlockPayload,
      source: relic.id,
    }];
  });

  globalHookRegistry.register('onCardExhaust', 'relic_dark_embrace', (_ctx, relic): Action[] => {
    const count = relic.effect.value || 1;
    return [{
      type: 'DRAW_CARDS',
      payload: { count } as DrawCardsPayload,
      source: relic.id,
    }];
  });

  // --- ON BLOCK GAINED RELICS ---

  // Juggernaut: Deal damage to random enemy when block is gained
  globalHookRegistry.register('onBlockGained', 'relic_juggernaut', (ctx, relic): Action[] => {
    const amount = relic.effect.value || 5;
    return [{
      type: 'DEAL_DAMAGE',
      payload: {
        targets: 'random',
        amount,
      } as DealDamagePayload,
      source: relic.id,
    }];
  });

  // --- ON VULNERABLE APPLIED RELICS ---

  // Champion Belt: Apply weak when vulnerable is applied
  globalHookRegistry.register('onStatusApplied', 'relic_champion_belt', (ctx, relic): Action[] => {
    if (ctx.status !== 'vulnerable') return [];
    const amount = relic.effect.value || 1;
    return [{
      type: 'APPLY_STATUS',
      payload: {
        target: 'enemy',
        targetId: ctx.targetId,
        status: 'weak',
        amount,
      } as ApplyStatusPayload,
      source: relic.id,
    }];
  });

  // --- ON HP LOSS RELICS ---

  // Rage (player takes damage → gain strength)
  globalHookRegistry.register('onHpLoss', 'relic_rage', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 1;
    return [{
      type: 'APPLY_STATUS',
      payload: {
        target: 'player',
        status: 'strength',
        amount,
      } as ApplyStatusPayload,
      source: relic.id,
    }];
  });

  // --- ON ENEMY DEATH RELICS ---

  // Blood Vial: Heal when enemy dies
  globalHookRegistry.register('onEnemyDeath', 'relic_blood_vial', (_ctx, relic): Action[] => {
    // Heal action would be needed - for now emit as HP modification
    // This could be a dedicated HEAL action in later phases
    return [];
  });

  // --- ON ATTACK RELICS ---

  // Rage (on attack play → gain block) - StS style
  globalHookRegistry.register('onAttackPlay', 'relic_rage_block', (_ctx, relic): Action[] => {
    const amount = relic.effect.value || 3;
    return [{
      type: 'GAIN_BLOCK',
      payload: { amount } as GainBlockPayload,
      source: relic.id,
    }];
  });
}

/**
 * Map legacy trigger strings to hook types.
 */
export function mapTriggerToHook(trigger: string): string | null {
  const mapping: Record<string, string> = {
    'turn_start': 'onTurnStart',
    'turn_end': 'onTurnEnd',
    'combat_start': 'onCombatStart',
    'combat_end': 'onCombatEnd',
    'on_exhaust': 'onCardExhaust',
    'on_hp_loss': 'onHpLoss',
    'on_damaged': 'onDamageTaken',
    'on_enemy_death': 'onEnemyDeath',
    'on_vulnerable': 'onStatusApplied',
    'first_attack': 'onAttackPlay',
  };
  return mapping[trigger] || null;
}
