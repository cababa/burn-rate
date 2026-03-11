/**
 * Card to Actions Converter
 * 
 * Converts a CardData object into an array of Actions for the ActionReducer.
 * Phase 2 scope: damage, block, draw, apply_status effects.
 */

import type { CardData, CardEffect } from '../types.ts';
import type {
  Action,
  DealDamagePayload,
  GainBlockPayload,
  DrawCardsPayload,
  ApplyStatusPayload,
  DealDamagePerBlockPayload,
  DealDamagePerMatchesPayload,
  DealDamageRampagePayload,
  DealDamageLifestealPayload,
  DealDamageFeedPayload,
  FiendFirePayload,
  AddCardPayload,
  ExhaustRandomFromHandPayload,
  ExhaustNonAttacksFromHandPayload,
  SelectCardsPayload,
} from './actions.ts';

// Effect types the new engine currently supports.
const SUPPORTED_EFFECT_TYPES: CardEffect['type'][] = [
  'damage',
  'block',
  'draw',
  'apply_status',
  'damage_scale_mitigation',
  'damage_scale_matches',
  'damage_rampage',
  'damage_lifesteal',
  'damage_feed',
  'fiend_fire',
  'gain_bandwidth',
  'add_copy',
  'add_card',
  'add_card_to_hand',
  'exhaust_random',
  'exhaust_non_attacks',
  'second_wind',
  'exhaust_choice',
  'upgrade_hand',
  'retrieve_discard',
  'discard',
  'put_on_deck',
  'exhume',
  'conditional_strength',
  'conditional_refund',
  'blood_cost',
  'double_strength',
  'lose_hp',
];

export const SUPPORTED_EFFECT_TYPE_SET = new Set<CardEffect['type']>(SUPPORTED_EFFECT_TYPES);

export const isEffectTypeSupported = (effect: CardEffect | CardEffect['type']): boolean => {
  if (typeof effect !== 'string' && effect.type === 'upgrade_hand' && (effect.value || 0) > 1) {
    // Upgrade-all flows still rely on legacy resolver behavior.
    return false;
  }
  const type = typeof effect === 'string' ? effect : effect.type;
  return SUPPORTED_EFFECT_TYPE_SET.has(type);
};

/** 
 * Convert a card play into a sequence of Actions.
 * 
 * @param card - The card being played
 * @param target - Whether the card targets 'enemy' or 'self'
 * @param targetEnemyId - Specific enemy ID for single-target effects
 * @param costPaid - For X-cost cards, the bandwidth spent (defaults to card.cost)
 * @returns Array of Actions to enqueue
 */
export function cardToActions(
  card: CardData,
  target: 'enemy' | 'self',
  targetEnemyId?: string,
  costPaid?: number
): Action[] {
  const actions: Action[] = [];
  const source = card.id;
  
  // Determine actual cost paid (for X-cost cards)
  const actualCost = card.cost === -1 ? (costPaid ?? 0) : card.cost;
  
  // PAY_COST action (if cost > 0)
  if (actualCost > 0) {
    actions.push({
      type: 'PAY_COST',
      payload: { amount: actualCost },
      source,
    });
  }
  
  // For X-cost cards, effects loop based on cost paid
  const loops = card.cost === -1 ? actualCost : 1;
  
  // Convert each effect, collapsing consecutive identical damage effects into
  // a single multi-hit action so attack reactions can resolve in StS order.
  for (let i = 0; i < card.effects.length; i++) {
    const effect = card.effects[i];

    if (effect.type === 'damage') {
      let hits = loops;
      while (i + 1 < card.effects.length) {
        const next = card.effects[i + 1];
        if (
          next.type !== 'damage' ||
          next.value !== effect.value ||
          next.target !== effect.target ||
          next.strengthMultiplier !== effect.strengthMultiplier
        ) {
          break;
        }
        hits += loops;
        i += 1;
      }

      const isRandomEnemy = effect.target === 'enemy' && card.description.toLowerCase().includes('random enemy');
      const payload: DealDamagePayload = {
        targets: effect.target === 'all_enemies' ? 'all' : isRandomEnemy ? 'random' : 'single',
        targetId: isRandomEnemy ? undefined : targetEnemyId,
        amount: effect.value,
        hits,
        strengthMultiplier: effect.strengthMultiplier,
      };
      actions.push({ type: 'DEAL_DAMAGE', payload, source });
      continue;
    }

    const effectActions = effectToActions(effect, card, target, targetEnemyId, loops);
    actions.push(...effectActions);
  }
  
  return actions;
}

/**
 * Convert a single CardEffect into Actions.
 */
function effectToActions(
  effect: CardEffect,
  card: CardData,
  target: 'enemy' | 'self',
  targetEnemyId?: string,
  loops: number = 1
): Action[] {
  const source = card.id;
  const actions: Action[] = [];
  
  for (let i = 0; i < loops; i++) {
    switch (effect.type) {
      case 'block': {
        const payload: GainBlockPayload = { amount: effect.value };
        actions.push({ type: 'GAIN_BLOCK', payload, source });
        break;
      }
      
      case 'draw': {
        const payload: DrawCardsPayload = { count: effect.value };
        actions.push({ type: 'DRAW_CARDS', payload, source });
        break;
      }
      
      case 'apply_status': {
        const statusTarget = effect.target === 'self' 
          ? 'player' 
          : effect.target === 'all_enemies' 
            ? 'all_enemies' 
            : 'enemy';
        
        const payload: ApplyStatusPayload = {
          target: statusTarget,
          targetId: statusTarget === 'enemy' ? targetEnemyId : undefined,
          status: effect.status || 'vulnerable',
          amount: effect.value,
          timing: effect.timing,
        };
        actions.push({ type: 'APPLY_STATUS', payload, source });
        break;
      }
      
      case 'damage_scale_mitigation': {
        const payload: DealDamagePerBlockPayload = {
          targets: effect.target === 'all_enemies' ? 'all' : 'single',
          targetId: targetEnemyId,
          factor: effect.value || 1,
        };
        actions.push({ type: 'DEAL_DAMAGE_PER_BLOCK', payload, source });
        break;
      }

      case 'damage_scale_matches': {
        const payload: DealDamagePerMatchesPayload = {
          targets: effect.target === 'all_enemies' ? 'all' : 'single',
          targetId: targetEnemyId,
          base: effect.value,
          // Perfected Strike / Compounding-style: +2 damage per matching card
          perMatch: 2,
          matchString: effect.matchString || 'Commit',
        };
        actions.push({ type: 'DEAL_DAMAGE_PER_MATCHES', payload, source });
        break;
      }

      case 'damage_rampage': {
        const payload: DealDamageRampagePayload = {
          cardId: card.id,
          targets: 'single',
          targetId: targetEnemyId,
          base: effect.value,
          // Viral Growth / Rampage-style: +5 damage each play
          increment: 5,
        };
        actions.push({ type: 'DEAL_DAMAGE_RAMPAGE', payload, source });
        break;
      }

      case 'damage_lifesteal': {
        const payload: DealDamageLifestealPayload = {
          targets: effect.target === 'all_enemies' ? 'all' : 'single',
          targetId: targetEnemyId,
          amount: effect.value,
        };
        actions.push({ type: 'DEAL_DAMAGE_LIFESTEAL', payload, source });
        break;
      }

      case 'damage_feed': {
        const payload: DealDamageFeedPayload = {
          targetId: targetEnemyId as string,
          amount: effect.value,
          // Acqui-Hire: gain 3 max Runway on kill
          maxHpGain: 3,
        };
        actions.push({ type: 'DEAL_DAMAGE_FEED', payload, source });
        break;
      }

      case 'fiend_fire': {
        const payload: FiendFirePayload = {
          cardId: card.id,
          targetId: targetEnemyId as string,
          perCardDamage: effect.value,
        };
        actions.push({ type: 'FIEND_FIRE', payload, source });
        break;
      }

      case 'gain_bandwidth': {
        actions.push({
          type: 'GAIN_BANDWIDTH',
          payload: { amount: effect.value },
          source,
        });
        break;
      }

      case 'add_copy': {
        const payload: AddCardPayload = {
          copyOfCardId: card.id,
          destination: 'discardPile',
          count: effect.value || 1,
        };
        actions.push({ type: 'ADD_CARD', payload, source });
        break;
      }

      case 'add_card': {
        if (!effect.cardId) break;
        // Legacy behavior: YOLO Deploy goes to drawPile, others to discardPile
        const destination = card.id === 'cto_yolo_deploy' ? 'drawPile' : 'discardPile';
        const payload: AddCardPayload = {
          templateId: effect.cardId,
          destination,
          count: effect.value || 1,
        };
        actions.push({ type: 'ADD_CARD', payload, source });
        break;
      }

      case 'add_card_to_hand': {
        if (!effect.cardId) break;
        const payload: AddCardPayload = {
          templateId: effect.cardId,
          destination: 'hand',
          count: effect.value || 1,
        };
        actions.push({ type: 'ADD_CARD', payload, source });
        break;
      }

      case 'exhaust_random': {
        const payload: ExhaustRandomFromHandPayload = {
          count: effect.value || 1,
        };
        actions.push({ type: 'EXHAUST_RANDOM_FROM_HAND', payload, source });
        break;
      }

      case 'exhaust_non_attacks': {
        const payload: ExhaustNonAttacksFromHandPayload = {};
        actions.push({ type: 'EXHAUST_NON_ATTACKS_FROM_HAND', payload, source });
        break;
      }

      case 'second_wind': {
        const payload: ExhaustNonAttacksFromHandPayload = {
          blockPerExhausted: effect.value,
        };
        actions.push({ type: 'EXHAUST_NON_ATTACKS_FROM_HAND', payload, source });
        break;
      }

      case 'exhaust_choice': {
        const payload: SelectCardsPayload = {
          zone: 'hand',
          count: effect.value || 1,
          kind: 'exhaust',
          filterType: 'any',
          message: `Choose ${effect.value || 1} card(s) to exhaust`,
        };
        actions.push({ type: 'SELECT_CARDS', payload, source });
        break;
      }

      case 'upgrade_hand': {
        const payload: SelectCardsPayload = {
          zone: 'hand',
          count: effect.value || 1,
          kind: 'upgrade',
          filterType: 'upgradeable',
          message: `Choose ${effect.value || 1} card(s) to upgrade`,
        };
        actions.push({ type: 'SELECT_CARDS', payload, source });
        break;
      }

      case 'retrieve_discard': {
        const count = effect.value || 1;
        const payload: SelectCardsPayload = {
          zone: 'discardPile',
          count,
          kind: 'retrieve',
          filterType: 'any',
          message: `Choose ${count} card(s) to place on top of your draw pile`,
        };
        actions.push({ type: 'SELECT_CARDS', payload, source });
        break;
      }

      case 'discard': {
        const payload: SelectCardsPayload = {
          zone: 'hand',
          count: effect.value || 1,
          kind: 'discard',
          filterType: 'any',
          message: `Choose ${effect.value || 1} card(s) to discard`,
        };
        actions.push({ type: 'SELECT_CARDS', payload, source });
        break;
      }

      case 'put_on_deck': {
        const payload: SelectCardsPayload = {
          zone: 'hand',
          count: effect.value || 1,
          kind: 'putOnDeck',
          filterType: 'any',
          message: `Choose ${effect.value || 1} card(s) to put on top of draw pile`,
        };
        actions.push({ type: 'SELECT_CARDS', payload, source });
        break;
      }

      case 'exhume': {
        // Exhume retrieves the most recent card from exhaust pile
        actions.push({
          type: 'EXHUME',
          payload: { count: effect.value || 1 },
          source
        });
        break;
      }

      case 'conditional_strength': {
        // Spot Weakness: gain strength if any enemy is attacking
        // This needs state context - emit a special action
        actions.push({
          type: 'CONDITIONAL_STRENGTH',
          payload: { amount: effect.value, condition: 'enemy_attacking' },
          source,
        });
        break;
      }

      case 'conditional_refund': {
        // Dropkick: refund bandwidth if enemy is vulnerable
        actions.push({
          type: 'CONDITIONAL_REFUND',
          payload: { amount: effect.value, condition: 'enemy_vulnerable', targetId: targetEnemyId },
          source,
        });
        break;
      }

      case 'blood_cost': {
        // Bootstrapped: refund bandwidth based on HP lost
        actions.push({
          type: 'BLOOD_COST_REFUND',
          payload: { cardCost: card.cost },
          source,
        });
        break;
      }

      case 'double_strength': {
        // Limit Break: double current strength
        actions.push({
          type: 'DOUBLE_STRENGTH',
          payload: {},
          source,
        });
        break;
      }

      case 'lose_hp': {
        actions.push({
          type: 'LOSE_HP',
          payload: { amount: effect.value },
          source,
        });
        break;
      }

      // Phase 4 stub - needs special handling (copy card multiple times)
      case 'exhaust_targeted':
      case 'dual_wield':
        // TODO: dual_wield needs custom logic to copy a card N times
        break;
      
      default:
        // Unknown effect type - skip for now
        break;
    }
  }
  
  return actions;
}

/**
 * Check if a card can be played (enough bandwidth).
 */
export function canPlayCard(card: CardData, bandwidth: number): boolean {
  if (card.cost === -1) {
    // X-cost cards can always be played (even for 0)
    return true;
  }
  return bandwidth >= card.cost;
}

/**
 * Get the effective cost of a card.
 */
export function getEffectiveCost(card: CardData, bandwidth: number): number {
  if (card.cost === -1) {
    return bandwidth; // X-cost uses all available bandwidth
  }
  return card.cost;
}
