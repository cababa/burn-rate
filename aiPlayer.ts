/**
 * AI Player System - Multiple strategies for automated game testing
 */

import { GameState, CardData, MapNode, RelicData } from './types.ts';

/**
 * Interface for AI players that can make game decisions
 */
export interface AIPlayer {
    name: string;
    description: string;

    /**
     * Select a card to play from hand, or null to end turn
     */
    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null;

    /**
     * Select which map node to visit
     */
    selectMapNode(state: GameState, options: MapNode[]): MapNode;

    /**
     * Select a card from rewards, or null to skip
     */
    selectReward(state: GameState, options: CardData[]): CardData | null;

    /**
     * Select a relic from boss relic options
     */
    selectRelic(state: GameState, options: RelicData[]): RelicData | null;

    /**
     * Select card(s) for discard/exhaust selection screens
     */
    selectCards(state: GameState, cards: CardData[], count: number, action: string): CardData[];
}

/**
 * Base class with common utilities for AI players
 */
abstract class BaseAI implements AIPlayer {
    abstract name: string;
    abstract description: string;

    abstract selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null;

    selectMapNode(state: GameState, options: MapNode[]): MapNode {
        // Default: prefer combat > elite > event > rest > shop
        const priorities: Record<string, number> = {
            'problem': 1,
            'elite': 2,
            'opportunity': 3,
            'retrospective': 4,
            'vendor': 5,
            'treasure': 0,
            'boss': 1
        };

        // Sort by priority (lower is better)
        const sorted = [...options].sort((a, b) => {
            const prioA = priorities[a.type] ?? 10;
            const prioB = priorities[b.type] ?? 10;
            return prioA - prioB;
        });

        return sorted[0] || options[0];
    }

    selectReward(state: GameState, options: CardData[]): CardData | null {
        // Default: take highest rarity card
        const rarityOrder = ['rare', 'uncommon', 'common', 'basic', 'starter'];
        const sorted = [...options].sort((a, b) => {
            return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        });
        return sorted[0] || null;
    }

    selectCards(state: GameState, cards: CardData[], count: number, action: string): CardData[] {
        // Default: select first N cards
        return cards.slice(0, count);
    }

    selectRelic(state: GameState, options: RelicData[]): RelicData | null {
        // Score each relic based on its effects
        const scored = options.map(relic => {
            let score = 0;
            const effect = relic.effect;
            const value = effect?.value || 0;
            const effectType = effect?.type || '';

            // Energy is king
            if (effectType.includes('bandwidth') || effectType.includes('energy')) score += value * 30;

            // Combat start bonuses
            if (effectType === 'gain_block' || effectType === 'start_block') score += value * 1.5;
            if (effectType === 'strength' || effectType === 'gain_strength') score += value * 10;
            if (effectType === 'apply_vulnerable') score += value * 8;

            // Consistency bonuses
            if (effect?.draw_bonus) score += effect.draw_bonus * 15;

            // Heal/sustain
            if (effectType === 'heal' || effectType === 'end_heal') score += value * 1.5;

            // Trigger bonuses
            if (relic.trigger === 'on_enemy_death') score += 10;
            if (relic.trigger === 'on_attack_count') score += 8;
            if (relic.trigger === 'first_attack') score += 6;

            // Penalties
            if (effect?.add_wounds) score -= effect.add_wounds * 5;
            if (effect?.disable_rest) score -= 10;
            if (effect?.enemy_strength) score -= effect.enemy_strength * 8;
            if (effect?.card_limit) score -= 5;

            // Rarity bonus
            if (relic.rarity === 'boss') score += 5;
            if (relic.rarity === 'rare') score += 3;

            return { relic, score };
        });

        // Sort by score and take highest
        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.relic || null;
    }

    /**
     * Get playable cards from hand
     */
    protected getPlayableCards(state: GameState): CardData[] {
        return state.hand.filter(card => {
            if (card.unplayable) return false;
            const cost = card.cost === -1 ? 1 : card.cost; // X-cost needs at least 1
            if (state.playerStats.bandwidth < cost) return false;

            // Check play conditions
            if (card.playCondition === 'only_attacks_in_hand') {
                const otherCards = state.hand.filter(c => c.id !== card.id);
                if (!otherCards.every(c => c.type === 'attack')) return false;
            }

            return true;
        });
    }

    /**
     * Get a valid target enemy
     */
    protected getTargetEnemy(state: GameState): string | undefined {
        const aliveEnemies = state.enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) return undefined;

        // Target lowest HP enemy by default
        const sorted = [...aliveEnemies].sort((a, b) => a.hp - b.hp);
        return sorted[0].id;
    }

    /**
     * Calculate incoming damage this turn
     */
    protected getIncomingDamage(state: GameState): number {
        return state.enemies.reduce((acc, enemy) => {
            if (enemy.hp <= 0) return acc;
            if (enemy.currentIntent.type === 'attack') {
                return acc + enemy.currentIntent.value;
            }
            return acc;
        }, 0);
    }

    /**
     * Calculate total block available from cards in hand
     */
    protected getAvailableBlock(state: GameState): number {
        let totalBlock = 0;
        let availableEnergy = state.playerStats.bandwidth;

        const blockCards = this.getPlayableCards(state)
            .filter(c => c.effects.some(e => e.type === 'block'))
            .sort((a, b) => {
                const aBlock = a.effects.find(e => e.type === 'block')?.value || 0;
                const bBlock = b.effects.find(e => e.type === 'block')?.value || 0;
                const aCost = a.cost === -1 ? availableEnergy : a.cost;
                const bCost = b.cost === -1 ? availableEnergy : b.cost;
                return (bBlock / bCost) - (aBlock / aCost); // Efficiency
            });

        for (const card of blockCards) {
            const cost = card.cost === -1 ? availableEnergy : card.cost;
            if (cost <= availableEnergy) {
                const blockValue = card.effects.find(e => e.type === 'block')?.value || 0;
                totalBlock += blockValue;
                availableEnergy -= cost;
            }
        }

        return totalBlock;
    }
}

/**
 * Aggressive AI - Prioritizes damage output, minimal blocking
 */
export class AggressiveAI extends BaseAI {
    name = 'Aggressive';
    description = 'Prioritizes dealing damage over blocking';

    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null {
        const playable = this.getPlayableCards(state);
        if (playable.length === 0) return null;

        // Sort by damage potential (highest first)
        const sorted = [...playable].sort((a, b) => {
            const aDamage = a.effects.reduce((sum, e) => {
                if (e.type === 'damage') return sum + e.value;
                if (e.type === 'apply_status' && (e.status === 'vulnerable' || e.status === 'weak') && e.target !== 'self') {
                    return sum + 5; // Value debuffs
                }
                return sum;
            }, 0);

            const bDamage = b.effects.reduce((sum, e) => {
                if (e.type === 'damage') return sum + e.value;
                if (e.type === 'apply_status' && (e.status === 'vulnerable' || e.status === 'weak') && e.target !== 'self') {
                    return sum + 5;
                }
                return sum;
            }, 0);

            // Prefer damage cards, then by cost efficiency
            if (aDamage > 0 && bDamage === 0) return -1;
            if (bDamage > 0 && aDamage === 0) return 1;
            return bDamage - aDamage;
        });

        const card = sorted[0];
        return { card, targetEnemyId: this.getTargetEnemy(state) };
    }

    selectMapNode(state: GameState, options: MapNode[]): MapNode {
        // Aggressive: prefer elites > combat > events
        const priorities: Record<string, number> = {
            'elite': 0,
            'problem': 1,
            'boss': 1,
            'treasure': 2,
            'opportunity': 3,
            'vendor': 4,
            'retrospective': 5
        };

        const sorted = [...options].sort((a, b) => {
            return (priorities[a.type] ?? 10) - (priorities[b.type] ?? 10);
        });

        return sorted[0] || options[0];
    }
}

/**
 * Defensive AI - Prioritizes block and survival
 */
export class DefensiveAI extends BaseAI {
    name = 'Defensive';
    description = 'Prioritizes blocking and survival over damage';

    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null {
        const playable = this.getPlayableCards(state);
        if (playable.length === 0) return null;

        const incomingDamage = this.getIncomingDamage(state);
        const currentMitigation = state.playerStats.mitigation;
        const needBlock = incomingDamage > currentMitigation;

        // Sort by defensive value
        const sorted = [...playable].sort((a, b) => {
            const aBlock = a.effects.reduce((sum, e) => e.type === 'block' ? sum + e.value : sum, 0);
            const bBlock = b.effects.reduce((sum, e) => e.type === 'block' ? sum + e.value : sum, 0);
            const aDamage = a.effects.reduce((sum, e) => e.type === 'damage' ? sum + e.value : sum, 0);
            const bDamage = b.effects.reduce((sum, e) => e.type === 'damage' ? sum + e.value : sum, 0);

            // If we need block, prioritize block cards
            if (needBlock) {
                if (aBlock > 0 && bBlock === 0) return -1;
                if (bBlock > 0 && aBlock === 0) return 1;
                if (aBlock !== bBlock) return bBlock - aBlock;
            }

            // Otherwise, still play damage cards
            return bDamage - aDamage;
        });

        const card = sorted[0];
        return { card, targetEnemyId: this.getTargetEnemy(state) };
    }

    selectMapNode(state: GameState, options: MapNode[]): MapNode {
        // Defensive: prefer rest > events > combat (avoid elites when low HP)
        const lowHp = state.playerStats.hp < state.playerStats.maxHp * 0.5;

        const priorities: Record<string, number> = lowHp ? {
            'retrospective': 0,
            'vendor': 1,
            'opportunity': 2,
            'treasure': 3,
            'problem': 4,
            'elite': 10,
            'boss': 5
        } : {
            'problem': 1,
            'opportunity': 2,
            'retrospective': 3,
            'vendor': 4,
            'treasure': 0,
            'elite': 5,
            'boss': 1
        };

        const sorted = [...options].sort((a, b) => {
            return (priorities[a.type] ?? 10) - (priorities[b.type] ?? 10);
        });

        return sorted[0] || options[0];
    }
}

/**
 * Balanced AI - Heuristic-based, adapts to situation
 */
export class BalancedAI extends BaseAI {
    name = 'Balanced';
    description = 'Adapts strategy based on current game state';

    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null {
        const playable = this.getPlayableCards(state);
        if (playable.length === 0) return null;

        const incomingDamage = this.getIncomingDamage(state);
        const currentMitigation = state.playerStats.mitigation;
        const unblockedDamage = Math.max(0, incomingDamage - currentMitigation);
        const hpPercent = state.playerStats.hp / state.playerStats.maxHp;

        // Score each card
        const scored = playable.map(card => {
            let score = 0;
            const cost = card.cost === -1 ? state.playerStats.bandwidth : card.cost;

            for (const effect of card.effects) {
                if (effect.type === 'damage') {
                    // Value damage more when enemies are low or we're healthy
                    let damageScore = effect.value;
                    if (hpPercent > 0.7) damageScore *= 1.5;

                    // Bonus for killing enemies
                    const target = state.enemies.find(e => e.hp > 0 && e.hp <= effect.value);
                    if (target) damageScore *= 2;

                    score += damageScore;
                }

                if (effect.type === 'block') {
                    // Value block based on incoming damage
                    let blockScore = effect.value;
                    if (unblockedDamage > 0) {
                        const effectiveBlock = Math.min(effect.value, unblockedDamage);
                        blockScore = effectiveBlock * 2; // Double value for necessary block
                    }
                    if (hpPercent < 0.3) blockScore *= 1.5; // Critical HP
                    score += blockScore;
                }

                if (effect.type === 'draw') {
                    score += effect.value * 3; // Card draw is valuable
                }

                if (effect.type === 'apply_status') {
                    if (effect.status === 'vulnerable' && effect.target !== 'self') score += 8;
                    if (effect.status === 'weak' && effect.target !== 'self') score += 6;
                    if (effect.status === 'strength' && effect.target === 'self') score += effect.value * 3;
                }

                if (effect.type === 'gain_bandwidth') {
                    score += effect.value * 5;
                }
            }

            // Normalize by cost (efficiency)
            if (cost > 0) score = score / cost;

            // Bonus for 0-cost cards
            if (cost === 0) score += 5;

            return { card, score };
        });

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        const best = scored[0];
        return { card: best.card, targetEnemyId: this.getTargetEnemy(state) };
    }
}

/**
 * Smart AI - Mimics human decision-making patterns
 * Based on StS expert play patterns:
 * 1. Play 0-cost cards first (free value)
 * 2. Apply debuffs before attacks (multiplicative benefit)
 * 3. Calculate lethal - if we can kill, go all-in
 * 4. Block only what's needed (don't over-block)
 * 5. Target priority: attackers > low HP > high threat
 */
export class SmartAI extends BaseAI {
    name = 'Smart';
    description = 'Mimics human decision-making patterns for optimal play';

    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null {
        const playable = this.getPlayableCards(state);
        if (playable.length === 0) return null;

        const incomingDamage = this.getIncomingDamage(state);
        const currentBlock = state.playerStats.mitigation;
        const unblockedDamage = Math.max(0, incomingDamage - currentBlock);
        const hpPercent = state.playerStats.hp / state.playerStats.maxHp;
        const strength = state.playerStats.statuses.strength || 0;

        // Get best target
        const targetEnemyId = this.getSmartTarget(state);
        const targetEnemy = state.enemies.find(e => e.id === targetEnemyId);

        // Phase 1: Check for lethal - can we kill all enemies this turn?
        const canLethal = this.canAchieveLethal(state, playable);
        if (canLethal) {
            // Play any damage card, prioritize high damage and 0-cost
            const damageCards = playable
                .filter(c => c.effects.some(e => e.type === 'damage'))
                .sort((a, b) => {
                    const aCost = a.cost === -1 ? state.playerStats.bandwidth : a.cost;
                    const bCost = b.cost === -1 ? state.playerStats.bandwidth : b.cost;
                    if (aCost === 0 && bCost !== 0) return -1;
                    if (bCost === 0 && aCost !== 0) return 1;
                    const aDmg = a.effects.find(e => e.type === 'damage')?.value || 0;
                    const bDmg = b.effects.find(e => e.type === 'damage')?.value || 0;
                    return bDmg - aDmg;
                });
            if (damageCards.length > 0) {
                return { card: damageCards[0], targetEnemyId };
            }
        }

        // Phase 2: Play 0-cost cards first (free value)
        const zeroCostCards = playable.filter(c => c.cost === 0);
        if (zeroCostCards.length > 0) {
            // Prioritize: draw > damage > block > other
            const prioritized = zeroCostCards.sort((a, b) => {
                const aScore = this.getCardPriority(a, state, unblockedDamage);
                const bScore = this.getCardPriority(b, state, unblockedDamage);
                return bScore - aScore;
            });
            return { card: prioritized[0], targetEnemyId };
        }

        // Phase 3: Play powers and scaling cards early
        const powers = playable.filter(c => c.type === 'power');
        if (powers.length > 0) {
            return { card: powers[0], targetEnemyId };
        }

        // Phase 4: If enemy is vulnerable, prioritize attacks
        // Otherwise, apply vulnerable first if we have attacks remaining
        const hasVulnerableCards = playable.some(c =>
            c.effects.some(e => e.type === 'apply_status' && e.status === 'vulnerable' && e.target !== 'self')
        );
        const hasAttackCards = playable.some(c => c.type === 'attack' && c.effects.some(e => e.type === 'damage'));
        const enemyIsVulnerable = targetEnemy && targetEnemy.statuses.vulnerable > 0;

        if (hasVulnerableCards && hasAttackCards && !enemyIsVulnerable) {
            // Apply vulnerable first to boost subsequent attacks
            const vulnCards = playable.filter(c =>
                c.effects.some(e => e.type === 'apply_status' && e.status === 'vulnerable' && e.target !== 'self')
            );
            if (vulnCards.length > 0) {
                return { card: vulnCards[0], targetEnemyId };
            }
        }

        // Phase 5: If we're safe (have enough block), play attacks
        if (currentBlock >= incomingDamage) {
            const attacks = playable
                .filter(c => c.effects.some(e => e.type === 'damage'))
                .sort((a, b) => {
                    const aDmg = this.getEffectiveDamage(a, state, targetEnemy);
                    const bDmg = this.getEffectiveDamage(b, state, targetEnemy);
                    const aCost = a.cost === -1 ? state.playerStats.bandwidth : a.cost;
                    const bCost = b.cost === -1 ? state.playerStats.bandwidth : b.cost;
                    // Efficiency: damage per energy
                    return (bDmg / Math.max(1, bCost)) - (aDmg / Math.max(1, aCost));
                });
            if (attacks.length > 0) {
                return { card: attacks[0], targetEnemyId };
            }
        }

        // Phase 6: We need block - calculate how much
        if (unblockedDamage > 0) {
            const blockCards = playable
                .filter(c => c.effects.some(e => e.type === 'block'))
                .sort((a, b) => {
                    const aBlock = a.effects.find(e => e.type === 'block')?.value || 0;
                    const bBlock = b.effects.find(e => e.type === 'block')?.value || 0;
                    const aCost = a.cost === -1 ? state.playerStats.bandwidth : a.cost;
                    const bCost = b.cost === -1 ? state.playerStats.bandwidth : b.cost;

                    // Prefer cards that exactly cover unblocked damage
                    const aExact = Math.abs(aBlock - unblockedDamage);
                    const bExact = Math.abs(bBlock - unblockedDamage);
                    if (aExact !== bExact) return aExact - bExact;

                    // Otherwise, efficiency
                    return (bBlock / Math.max(1, bCost)) - (aBlock / Math.max(1, aCost));
                });

            if (blockCards.length > 0) {
                return { card: blockCards[0], targetEnemyId };
            }
        }

        // Phase 7: Low HP survival mode - prioritize any block
        if (hpPercent < 0.3 && unblockedDamage > state.playerStats.hp * 0.5) {
            const anyBlock = playable.filter(c => c.effects.some(e => e.type === 'block'));
            if (anyBlock.length > 0) {
                return { card: anyBlock[0], targetEnemyId };
            }
        }

        // Phase 8: Play remaining attacks by efficiency
        const remainingAttacks = playable
            .filter(c => c.effects.some(e => e.type === 'damage'))
            .sort((a, b) => {
                const aDmg = this.getEffectiveDamage(a, state, targetEnemy);
                const bDmg = this.getEffectiveDamage(b, state, targetEnemy);
                return bDmg - aDmg;
            });

        if (remainingAttacks.length > 0) {
            return { card: remainingAttacks[0], targetEnemyId };
        }

        // Phase 9: Play any remaining card
        const remaining = playable.sort((a, b) => {
            const aCost = a.cost === -1 ? state.playerStats.bandwidth : a.cost;
            const bCost = b.cost === -1 ? state.playerStats.bandwidth : b.cost;
            return aCost - bCost; // Cheapest first
        });

        if (remaining.length > 0) {
            return { card: remaining[0], targetEnemyId };
        }

        return null;
    }

    /**
     * Check if we can kill all enemies this turn
     */
    private canAchieveLethal(state: GameState, playable: CardData[]): boolean {
        let totalDamage = 0;
        let availableEnergy = state.playerStats.bandwidth;
        const strength = state.playerStats.statuses.strength || 0;

        // Sort by efficiency
        const damageCards = playable
            .filter(c => c.effects.some(e => e.type === 'damage'))
            .sort((a, b) => {
                const aCost = a.cost === -1 ? availableEnergy : a.cost;
                const bCost = b.cost === -1 ? availableEnergy : b.cost;
                const aDmg = (a.effects.find(e => e.type === 'damage')?.value || 0) + strength;
                const bDmg = (b.effects.find(e => e.type === 'damage')?.value || 0) + strength;
                return (bDmg / Math.max(1, bCost)) - (aDmg / Math.max(1, aCost));
            });

        for (const card of damageCards) {
            const cost = card.cost === -1 ? availableEnergy : card.cost;
            if (cost <= availableEnergy) {
                const baseDmg = card.effects.find(e => e.type === 'damage')?.value || 0;
                totalDamage += baseDmg + strength;
                availableEnergy -= cost;
            }
        }

        // Check if we can kill all enemies
        const totalEnemyHp = state.enemies.reduce((sum, e) => e.hp > 0 ? sum + e.hp : sum, 0);
        return totalDamage >= totalEnemyHp;
    }

    /**
     * Get smart target - prioritize attackers and low HP
     */
    private getSmartTarget(state: GameState): string | undefined {
        const aliveEnemies = state.enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) return undefined;

        // Score each enemy
        const scored = aliveEnemies.map(enemy => {
            let score = 0;

            // Prioritize attackers that will hit us this turn
            if (enemy.currentIntent.type === 'attack') {
                score += 50 + enemy.currentIntent.value;
            }

            // Prioritize low HP enemies (can kill)
            if (enemy.hp <= 20) score += 30;
            if (enemy.hp <= 10) score += 20;

            // Deprioritize sleeping/passive enemies
            if (enemy.statuses.asleep > 0) score -= 50;
            if (enemy.currentIntent.type === 'buff' || enemy.currentIntent.type === 'unknown') {
                score -= 10;
            }

            // Consider enemy strength (high threat)
            score += enemy.statuses.strength * 5;

            return { enemy, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].enemy.id;
    }

    /**
     * Get card priority for sorting
     */
    private getCardPriority(card: CardData, state: GameState, unblockedDamage: number): number {
        let score = 0;

        for (const effect of card.effects) {
            if (effect.type === 'draw') score += effect.value * 15;
            if (effect.type === 'damage') score += effect.value * 2;
            if (effect.type === 'block' && unblockedDamage > 0) score += effect.value * 3;
            if (effect.type === 'apply_status') {
                if (effect.status === 'vulnerable' && effect.target !== 'self') score += 20;
                if (effect.status === 'weak' && effect.target !== 'self') score += 15;
                if (effect.status === 'strength' && effect.target === 'self') score += effect.value * 10;
            }
            if (effect.type === 'gain_bandwidth') score += effect.value * 20;
        }

        return score;
    }

    /**
     * Calculate effective damage considering enemy vulnerable status
     */
    private getEffectiveDamage(card: CardData, state: GameState, target?: { statuses: { vulnerable: number } }): number {
        const baseDmg = card.effects.find(e => e.type === 'damage')?.value || 0;
        const strength = state.playerStats.statuses.strength || 0;
        let damage = baseDmg + strength;

        if (target && target.statuses.vulnerable > 0) {
            damage = Math.floor(damage * 1.5);
        }

        return damage;
    }

    selectMapNode(state: GameState, options: MapNode[]): MapNode {
        const hpPercent = state.playerStats.hp / state.playerStats.maxHp;
        const hasGoodDeck = state.deck.length > 12; // Built up deck

        // Dynamic priorities based on state
        const priorities: Record<string, number> = {};

        if (hpPercent < 0.4) {
            // Low HP: prioritize rest
            priorities['retrospective'] = 0;
            priorities['vendor'] = 1;
            priorities['opportunity'] = 2;
            priorities['treasure'] = 3;
            priorities['problem'] = 5;
            priorities['elite'] = 10;
            priorities['boss'] = 6;
        } else if (hpPercent < 0.7) {
            // Medium HP: balanced
            priorities['treasure'] = 0;
            priorities['problem'] = 1;
            priorities['opportunity'] = 2;
            priorities['retrospective'] = 3;
            priorities['vendor'] = 4;
            priorities['elite'] = hasGoodDeck ? 2 : 6;
            priorities['boss'] = 2;
        } else {
            // High HP: be aggressive
            priorities['elite'] = hasGoodDeck ? 0 : 3;
            priorities['treasure'] = 1;
            priorities['problem'] = 2;
            priorities['opportunity'] = 3;
            priorities['vendor'] = 4;
            priorities['retrospective'] = 5;
            priorities['boss'] = 2;
        }

        const sorted = [...options].sort((a, b) => {
            return (priorities[a.type] ?? 10) - (priorities[b.type] ?? 10);
        });

        return sorted[0] || options[0];
    }

    selectReward(state: GameState, options: CardData[]): CardData | null {
        // Smart card selection considering synergies and deck size
        const deckSize = state.deck.length;

        // If deck is getting bloated, be more selective
        if (deckSize > 25) {
            // Only take rare cards
            const rares = options.filter(c => c.rarity === 'rare');
            if (rares.length > 0) return rares[0];
            return null; // Skip
        }

        // Score each card based on effects
        const scored = options.map(card => {
            let score = 0;

            // Rarity bonus
            if (card.rarity === 'rare') score += 20;
            if (card.rarity === 'uncommon') score += 10;

            // Effect value
            for (const effect of card.effects) {
                if (effect.type === 'damage') score += effect.value * 0.5;
                if (effect.type === 'block') score += effect.value * 0.4;
                if (effect.type === 'draw') score += effect.value * 5;
                if (effect.type === 'apply_status') {
                    if (effect.status === 'vulnerable') score += 8;
                    if (effect.status === 'weak') score += 6;
                    if (effect.status === 'strength' && effect.target === 'self') score += effect.value * 5;
                }
                if (effect.type === 'gain_bandwidth') score += effect.value * 10;
            }

            // Cost efficiency
            if (card.cost === 0) score += 10;
            if (card.cost === 1) score += 5;
            if (card.cost >= 3) score -= 5;

            // Exhaust is situationally good
            if (card.exhaust) score -= 3;

            return { card, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.card || null;
    }
}

/**
 * Random AI - Random valid plays (for stress testing)
 */
export class RandomAI extends BaseAI {
    name = 'Random';
    description = 'Makes random valid plays (for edge case discovery)';

    selectCard(state: GameState): { card: CardData; targetEnemyId?: string } | null {
        const playable = this.getPlayableCards(state);
        if (playable.length === 0) return null;

        // 20% chance to end turn early
        if (Math.random() < 0.2) return null;

        // Pick random card
        const card = playable[Math.floor(Math.random() * playable.length)];

        // Pick random target
        const aliveEnemies = state.enemies.filter(e => e.hp > 0);
        const targetEnemyId = aliveEnemies.length > 0
            ? aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)].id
            : undefined;

        return { card, targetEnemyId };
    }

    selectMapNode(state: GameState, options: MapNode[]): MapNode {
        // Completely random
        return options[Math.floor(Math.random() * options.length)];
    }

    selectReward(state: GameState, options: CardData[]): CardData | null {
        // 30% chance to skip
        if (Math.random() < 0.3) return null;
        return options[Math.floor(Math.random() * options.length)] || null;
    }

    selectCards(state: GameState, cards: CardData[], count: number, action: string): CardData[] {
        // Shuffle and pick
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
}

/**
 * Factory function to create AI by name
 */
export function createAI(strategy: 'aggressive' | 'defensive' | 'balanced' | 'smart' | 'random'): AIPlayer {
    switch (strategy) {
        case 'aggressive': return new AggressiveAI();
        case 'defensive': return new DefensiveAI();
        case 'balanced': return new BalancedAI();
        case 'smart': return new SmartAI();
        case 'random': return new RandomAI();
        default: return new SmartAI();
    }
}

/**
 * Get all available AI strategies
 */
export function getAllStrategies(): AIPlayer[] {
    return [
        new AggressiveAI(),
        new DefensiveAI(),
        new BalancedAI(),
        new SmartAI(),
        new RandomAI()
    ];
}
