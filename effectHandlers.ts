/**
 * Effect Handler System
 * 
 * Modular handlers for each card effect type.
 * Each handler is a pure function that takes effect parameters and returns a result.
 * This makes effects easier to test, debug, and maintain.
 */

import { CardData, CardEffect, GameState, EnemyData, RelicData, PlayerStatuses, CharacterStats } from './types.ts';
import { GAME_DATA } from './constants.ts';

// ============================================
// TYPES
// ============================================

export interface EffectContext {
    effect: CardEffect;
    card: CardData;
    state: GameState;
    targetEnemy: EnemyData | null;
    allEnemies: EnemyData[];
    playerStatuses: PlayerStatuses;
    relics: RelicData[];
}

export interface EffectResult {
    // Updated state components
    playerStatuses: PlayerStatuses;
    enemies: EnemyData[];
    mitigation: number;
    bandwidth: number;
    hand: CardData[];
    drawPile: CardData[];
    discardPile: CardData[];
    exhaustPile: CardData[];
    // Messaging
    message: string;
    // Flow control
    triggerVictory: boolean;
    newGameStatus?: GameState['status'];
    pendingSelection?: GameState['pendingSelection'];
    pendingDiscard?: number;
}

// Handler function type
export type EffectHandler = (ctx: EffectContext, currentResult: EffectResult) => EffectResult;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateDamageValue(
    baseDamage: number,
    attackerStatuses: PlayerStatuses,
    defenderStatuses: { vulnerable: number; weak: number },
    strengthMultiplier: number = 1,
    relics: RelicData[] = []
): number {
    let damage = baseDamage + (attackerStatuses.strength * strengthMultiplier);

    // Weak reduces damage dealt by 25%
    if (attackerStatuses.weak > 0) {
        damage = damage * 0.75;
    }

    // Vulnerable increases damage taken by 50% (or 75% with Growth Mindset relic)
    if (defenderStatuses.vulnerable > 0) {
        const growthMindset = relics.find(r => r.effect.type === 'vulnerable_bonus');
        const vulnerableMultiplier = growthMindset ? 1.75 : 1.5;
        damage = damage * vulnerableMultiplier;
    }

    return Math.floor(damage);
}

// ============================================
// EFFECT HANDLERS
// ============================================

/**
 * Damage Effect Handler
 * Deals damage to target enemy or all enemies
 */
export const handleDamage: EffectHandler = (ctx, result) => {
    const { effect, playerStatuses, relics } = ctx;
    let { enemies, message } = result;

    // Determine targets
    let targets: EnemyData[] = [];
    if (effect.target === 'all_enemies') {
        targets = enemies.filter(e => e.hp > 0);
    } else if (ctx.targetEnemy && ctx.targetEnemy.hp > 0) {
        targets = [ctx.targetEnemy];
    }

    targets.forEach(target => {
        const damage = calculateDamageValue(
            effect.value,
            playerStatuses,
            target.statuses,
            effect.strengthMultiplier || 1,
            relics
        );

        let finalDamage = damage;

        // Apply target's mitigation (block)
        if (target.mitigation > 0) {
            const blocked = Math.min(target.mitigation, finalDamage);
            target.mitigation -= blocked;
            finalDamage -= blocked;
            message += ` (${blocked} blocked)`;
        }

        // Deal damage
        const prevHp = target.hp;
        target.hp = Math.max(0, target.hp - finalDamage);
        message += ` Dealt ${finalDamage} damage.`;

        // Trigger special enemy reactions
        if (target.statuses.curlUp > 0 && finalDamage > 0) {
            target.mitigation += target.statuses.curlUp;
            target.statuses.curlUp = 0;
        }
        if (target.statuses.malleable > 0 && finalDamage > 0) {
            target.mitigation += target.statuses.malleable;
            target.statuses.malleable += 1;
        }
        if (target.statuses.asleep > 0 && finalDamage > 0) {
            target.statuses.asleep = 0;
        }
    });

    // Check for victory
    const allDead = enemies.every(e => e.hp <= 0);

    return {
        ...result,
        enemies,
        message,
        triggerVictory: allDead
    };
};

/**
 * Block Effect Handler
 * Grants block (mitigation) to the player
 */
export const handleBlock: EffectHandler = (ctx, result) => {
    const { effect, playerStatuses } = ctx;
    let { mitigation, message } = result;

    let blockAmount = effect.value;

    // Frail reduces block gained by 25%
    if (playerStatuses.frail > 0) {
        blockAmount = Math.floor(blockAmount * 0.75);
    }

    mitigation += blockAmount;
    message += ` Gained ${blockAmount} block.`;

    return {
        ...result,
        mitigation,
        message
    };
};

/**
 * Draw Effect Handler
 * Draws cards from draw pile
 */
export const handleDraw: EffectHandler = (ctx, result) => {
    const { effect, playerStatuses } = ctx;
    let { hand, drawPile, discardPile, message } = result;

    // NoDraw status prevents drawing
    if (playerStatuses.noDraw > 0) {
        message += ' (Draw prevented)';
        return { ...result, message };
    }

    const cardsToDraw = effect.value;
    let drawnCount = 0;

    for (let i = 0; i < cardsToDraw; i++) {
        if (drawPile.length === 0 && discardPile.length > 0) {
            // Shuffle discard into draw pile
            drawPile = [...discardPile].sort(() => Math.random() - 0.5);
            discardPile = [];
        }

        if (drawPile.length > 0) {
            const card = drawPile.shift()!;
            hand.push(card);
            drawnCount++;
        }
    }

    if (drawnCount > 0) {
        message += ` Drew ${drawnCount} card${drawnCount > 1 ? 's' : ''}.`;
    }

    return {
        ...result,
        hand,
        drawPile,
        discardPile,
        message
    };
};

/**
 * Apply Status Effect Handler
 * Applies buffs/debuffs to player or enemies
 */
export const handleApplyStatus: EffectHandler = (ctx, result) => {
    const { effect } = ctx;
    let { playerStatuses, enemies, message } = result;

    const amount = effect.value;
    const statusType = effect.status || 'vulnerable';

    if (effect.target === 'self') {
        // Apply to player
        switch (statusType) {
            case 'strength':
                playerStatuses.strength += amount;
                message += ` Gained ${amount} Velocity.`;
                break;
            case 'metallicize':
                playerStatuses.metallicize += amount;
                message += ` Gained ${amount} Metallicize.`;
                break;
            case 'evolve':
                playerStatuses.evolve += amount;
                break;
            case 'feelNoPain':
                playerStatuses.feelNoPain += amount;
                break;
            case 'noDraw':
                playerStatuses.noDraw += amount;
                break;
            case 'thorns':
                playerStatuses.thorns += amount;
                message += ` Gained ${amount} Thorns.`;
                break;
            case 'antifragile':
                playerStatuses.antifragile += amount;
                break;
            case 'artifact':
                playerStatuses.artifact += amount;
                break;
            case 'growth':
                playerStatuses.growth += amount;
                message += ` Gained ${amount} Growth.`;
                break;
            case 'corruption':
                playerStatuses.corruption += amount;
                break;
        }
    } else if (effect.target === 'all_enemies') {
        // Apply to ALL enemies
        enemies.forEach(e => {
            if (statusType === 'vulnerable') {
                e.statuses.vulnerable += amount;
            } else if (statusType === 'weak') {
                e.statuses.weak += amount;
            } else if (statusType === 'strength') {
                e.statuses.strength += amount;
            }
        });
        message += ` Applied ${amount} ${statusType} to all enemies.`;
    } else if (ctx.targetEnemy) {
        // Apply to target enemy
        if (statusType === 'vulnerable') {
            ctx.targetEnemy.statuses.vulnerable += amount;
            message += ` Applied ${amount} Exposed.`;
        } else if (statusType === 'weak') {
            ctx.targetEnemy.statuses.weak += amount;
            message += ` Applied ${amount} Drained.`;
        } else if (statusType === 'strength') {
            ctx.targetEnemy.statuses.strength += amount;
        }
    }

    return {
        ...result,
        playerStatuses,
        enemies,
        message
    };
};

/**
 * Add Copy Effect Handler
 * Adds a copy of the played card to discard pile
 */
export const handleAddCopy: EffectHandler = (ctx, result) => {
    const { card } = ctx;
    let { discardPile, message } = result;

    const copy = { ...card, id: `${card.id}_copy_${Date.now()}` };
    discardPile.push(copy);
    message += ` Added copy of ${card.name} to discard.`;

    return {
        ...result,
        discardPile,
        message
    };
};

/**
 * Gain Bandwidth Effect Handler
 * Grants energy to the player
 */
export const handleGainBandwidth: EffectHandler = (ctx, result) => {
    const { effect } = ctx;
    let { bandwidth, message } = result;

    bandwidth += effect.value;
    message += ` Gained ${effect.value} Bandwidth.`;

    return {
        ...result,
        bandwidth,
        message
    };
};

// ============================================
// EFFECT HANDLER REGISTRY
// ============================================

export const EFFECT_HANDLERS: Record<string, EffectHandler> = {
    'damage': handleDamage,
    'block': handleBlock,
    'draw': handleDraw,
    'apply_status': handleApplyStatus,
    'add_copy': handleAddCopy,
    'gain_bandwidth': handleGainBandwidth,
};

/**
 * Execute an effect using the handler system
 * Falls back to returning the result unchanged if no handler exists
 */
export function executeEffectHandler(
    effectType: string,
    ctx: EffectContext,
    currentResult: EffectResult
): EffectResult {
    const handler = EFFECT_HANDLERS[effectType];
    if (handler) {
        return handler(ctx, currentResult);
    }
    // No handler found - return unchanged (will be handled by legacy code)
    return currentResult;
}

/**
 * Create initial effect result from game state
 */
export function createInitialResult(state: GameState, card: CardData): EffectResult {
    return {
        playerStatuses: { ...state.playerStats.statuses },
        enemies: state.enemies.map(e => ({ ...e, statuses: { ...e.statuses } })),
        mitigation: state.playerStats.mitigation,
        bandwidth: state.playerStats.bandwidth - (card.cost === -1 ? state.playerStats.bandwidth : card.cost),
        hand: state.hand.filter(c => c !== card),
        drawPile: [...state.drawPile],
        discardPile: [...state.discardPile],
        exhaustPile: [...state.exhaustPile],
        message: `Deployed ${card.name}.`,
        triggerVictory: false,
        newGameStatus: undefined,
        pendingSelection: undefined,
        pendingDiscard: 0
    };
}
