/**
 * Event-Animation Bridge
 * 
 * Consumes GameEvents from the ActionReducer and translates them
 * into animation triggers. This keeps animation logic separate from
 * the core game logic.
 */

import type { GameEvent } from './events.ts';
import {
  createFloatingNumber,
  type FloatingNumber,
  type AnimationEvent,
  ANIMATION_TIMING,
} from '../animations.ts';

/**
 * Animation queue entry for processing.
 */
export interface QueuedAnimation {
  type: 'damage' | 'block' | 'status' | 'card_move' | 'shuffle' | 'upgrade';
  targetId?: string;
  value?: number;
  delay: number;
  metadata?: Record<string, any>;
}

/**
 * Callbacks that UI components register to receive animation triggers.
 */
export interface AnimationCallbacks {
  onDamage?: (targetId: string, amount: number, blocked: number, lethal: boolean) => void;
  onBlock?: (amount: number) => void;
  onStatusChange?: (target: 'player' | 'enemy', targetId: string | undefined, status: string, amount: number) => void;
  onCardMove?: (cardId: string, from: string, to: string) => void;
  onShuffle?: () => void;
  onUpgrade?: (cardId: string) => void;
  onVictory?: () => void;
  onDefeat?: (reason: string) => void;
  onChoicePrompted?: (choiceId: string, zone: string, count: number, message: string) => void;
}

/**
 * Process GameEvents and trigger animations.
 */
export class EventAnimationBridge {
  private callbacks: AnimationCallbacks = {};
  private floatingNumbers: Map<string, FloatingNumber[]> = new Map();
  private animationQueue: QueuedAnimation[] = [];
  private isProcessing = false;

  /**
   * Register animation callbacks.
   */
  setCallbacks(callbacks: AnimationCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Process a batch of GameEvents from the reducer.
   */
  processEvents(events: GameEvent[]): void {
    for (const event of events) {
      this.processEvent(event);
    }
  }

  /**
   * Process a single GameEvent.
   */
  private processEvent(event: GameEvent): void {
    switch (event.type) {
      case 'HIT':
        this.handleHit(event);
        break;
      case 'BLOCK_GAINED':
        this.handleBlockGained(event);
        break;
      case 'STATUS_CHANGED':
        this.handleStatusChanged(event);
        break;
      case 'CARD_MOVED':
        this.handleCardMoved(event);
        break;
      case 'CARD_UPGRADED':
        this.handleCardUpgraded(event);
        break;
      case 'DECK_SHUFFLED':
        this.handleShuffle(event);
        break;
      case 'VICTORY':
        this.handleVictory(event);
        break;
      case 'DEFEAT':
        this.handleDefeat(event);
        break;
      case 'CHOICE_PROMPTED':
        this.handleChoicePrompted(event);
        break;
      // Other events can be handled as needed
      default:
        break;
    }
  }

  private handleHit(event: GameEvent): void {
    const { targetId, amount, blocked, lethal } = event.payload;
    
    // Create floating damage number
    if (amount > 0) {
      const floatNum = createFloatingNumber(amount, 'damage');
      this.addFloatingNumber(targetId, floatNum);
    }

    // Trigger callback
    this.callbacks.onDamage?.(targetId, amount, blocked || 0, lethal || false);
  }

  private handleBlockGained(event: GameEvent): void {
    const { amount } = event.payload;
    
    // Create floating block number
    const floatNum = createFloatingNumber(amount, 'block');
    this.addFloatingNumber('player', floatNum);

    // Trigger callback
    this.callbacks.onBlock?.(amount);
  }

  private handleStatusChanged(event: GameEvent): void {
    const { target, targetId, status, delta } = event.payload;
    
    // Trigger callback
    this.callbacks.onStatusChange?.(target, targetId, status, delta);
  }

  private handleCardMoved(event: GameEvent): void {
    const { cardId, from, to } = event.payload;
    
    // Trigger callback
    this.callbacks.onCardMove?.(cardId, from, to);
  }

  private handleCardUpgraded(event: GameEvent): void {
    const { cardId } = event.payload;
    
    // Trigger callback
    this.callbacks.onUpgrade?.(cardId);
  }

  private handleShuffle(_event: GameEvent): void {
    // Trigger callback
    this.callbacks.onShuffle?.();
  }

  private handleVictory(_event: GameEvent): void {
    // Trigger callback
    this.callbacks.onVictory?.();
  }

  private handleDefeat(event: GameEvent): void {
    const { reason } = event.payload;
    
    // Trigger callback
    this.callbacks.onDefeat?.(reason || 'unknown');
  }

  private handleChoicePrompted(event: GameEvent): void {
    const { choiceId, zone, count, message } = event.payload;
    
    // Trigger callback
    this.callbacks.onChoicePrompted?.(choiceId, zone, count, message);
  }

  /**
   * Add a floating number for a target.
   */
  private addFloatingNumber(targetId: string, floatNum: FloatingNumber): void {
    if (!this.floatingNumbers.has(targetId)) {
      this.floatingNumbers.set(targetId, []);
    }
    this.floatingNumbers.get(targetId)!.push(floatNum);
  }

  /**
   * Get active floating numbers for a target.
   */
  getFloatingNumbers(targetId: string): FloatingNumber[] {
    const nums = this.floatingNumbers.get(targetId) || [];
    const now = Date.now();
    // Filter to only visible ones
    const visible = nums.filter(n => now - n.startTime < ANIMATION_TIMING.DAMAGE_NUMBER_MS);
    this.floatingNumbers.set(targetId, visible);
    return visible;
  }

  /**
   * Clear all floating numbers.
   */
  clearFloatingNumbers(): void {
    this.floatingNumbers.clear();
  }
}

/**
 * Global bridge instance.
 */
export const eventAnimationBridge = new EventAnimationBridge();

/**
 * Convert GameEvents to legacy AnimationEvents format for compatibility.
 */
export function gameEventsToAnimationEvents(events: GameEvent[]): AnimationEvent[] {
  const animEvents: AnimationEvent[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'HIT': {
        const { targetId, amount, blocked, lethal } = event.payload;
        if (amount > 0 || blocked > 0) {
          animEvents.push({
            type: 'damage',
            targetId,
            value: amount,
            color: 'damage',
          });
        }
        break;
      }
      case 'BLOCK_GAINED': {
        const { amount } = event.payload;
        animEvents.push({
          type: 'block',
          targetId: 'player',
          value: amount,
          color: 'block',
        });
        break;
      }
      case 'STATUS_CHANGED': {
        const { target, targetId, status, delta } = event.payload;
        animEvents.push({
          type: 'status_apply',
          targetId: target === 'player' ? 'player' : targetId,
          statusType: status,
          value: delta,
          color: delta > 0 ? 'debuff' : 'buff',
        });
        break;
      }
      case 'CARD_MOVED': {
        const { cardId, to } = event.payload;
        if (to === 'hand') {
          animEvents.push({
            type: 'card_draw',
            targetId: cardId,
          });
        } else if (to === 'exhaustPile') {
          animEvents.push({
            type: 'card_exhaust',
            targetId: cardId,
          });
        }
        break;
      }
    }
  }

  return animEvents;
}
