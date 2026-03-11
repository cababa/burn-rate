import { CardData, GameState, EnemyIntent, MapLayer, MapNode, MapNodeType, CharacterStats, RelicData, EntityStatus, EnemyData, CardEffect, PlayerStatuses, EnemyStatuses, EncounterTemplate, PotionData, PotionRarity } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE, MAP_CONFIG, ENCOUNTER_TEMPLATES } from './constants.ts';
import { getGlobalLogger } from './logger.ts';
import { SeededRandom } from './rng.ts';
// Effect handler system for modular card effect processing
import { EFFECT_HANDLERS, EffectContext, EffectResult, createInitialResult, executeEffectHandler } from './effectHandlers.ts';
import { ActionQueue, EventLog, ActionReducer, cardToActions, RNGService, isEffectTypeSupported } from './engine/index.ts';
import type { GameRNG } from './rng.ts';

const USE_NEW_CARD_RESOLVER = true;

// --- Math Helpers ---

export const calculateDamage = (baseDamage: number, attackerStatus: EntityStatus, defenderStatus: EntityStatus, strengthMultiplier: number = 1, relics?: RelicData[]): number => {
    let damage = baseDamage + (attackerStatus.strength * strengthMultiplier);
    if (attackerStatus.weak > 0) damage = damage * 0.75;
    if (defenderStatus.vulnerable > 0) {
        // Growth Mindset (Paper Phrog): Vulnerable = 75% instead of 50%
        const vulnerableMultiplier = relics ? getVulnerableMultiplierInternal(relics) : 1.5;
        damage = damage * vulnerableMultiplier;
    }
    return Math.floor(damage);
};

// Internal helper for calculateDamage (avoids circular dependency issues)
const getVulnerableMultiplierInternal = (relics: RelicData[]): number => {
    const growthMindset = relics.find(r => r.effect.type === 'vulnerable_bonus');
    if (growthMindset) {
        return 1.75; // 75% more damage
    }
    return 1.5; // Default 50% more damage
};

export const countCardsMatches = (cards: CardData[], matchString: string): number => {
    return cards.filter(c => c.name.includes(matchString)).length;
};

// --- Deck Helpers ---

export const generateStarterDeck = (): CardData[] => {
    const deck: CardData[] = [];
    for (let i = 0; i < 5; i++) deck.push({ ...GAME_DATA.cards.cto_commit, id: `commit_${i}_${Math.random().toString(36).substr(2, 9)}` });
    for (let i = 0; i < 4; i++) deck.push({ ...GAME_DATA.cards.cto_stay_focused, id: `stay_focused_${i}_${Math.random().toString(36).substr(2, 9)}` });
    deck.push({ ...GAME_DATA.cards.cto_hotfix, id: `hotfix_${Math.random().toString(36).substr(2, 9)}` });
    return deck;
};

export const getRandomRewardCards = (
    count: number,
    rng?: SeededRandom,
    forcedRarity?: 'common' | 'uncommon' | 'rare'
): CardData[] => {
    const getRarity = (): 'common' | 'uncommon' | 'rare' => {
        if (forcedRarity) return forcedRarity;
        const roll = rng ? rng.next() * 100 : Math.random() * 100;
        if (roll < 60) return 'common';
        if (roll < 97) return 'uncommon';
        return 'rare';
    };
    const pool = Object.values(GAME_DATA.cards).filter(c => c.type !== 'status' && c.rarity !== 'starter' && c.rarity !== 'special');
    const rewards: CardData[] = [];
    for (let i = 0; i < count; i++) {
        const targetRarity = getRarity();
        const rarityPool = pool.filter(c => c.rarity === targetRarity);
        const finalPool = rarityPool.length > 0 ? rarityPool : pool;
        const randomCard = rng ? rng.pick(finalPool) : finalPool[Math.floor(Math.random() * finalPool.length)];
        rewards.push({ ...randomCard, id: `reward_${Date.now()}_${i}` });
    }
    return rewards;
};

export const shuffle = (cards: CardData[], rng?: SeededRandom): CardData[] => {
    if (rng) return rng.shuffle(cards);
    return [...cards].sort(() => Math.random() - 0.5);
};

export const drawCards = (currentDraw: CardData[], currentDiscard: CardData[], count: number): { drawn: CardData[], newDraw: CardData[], newDiscard: CardData[] } => {
    let drawn: CardData[] = [];
    let newDraw = [...currentDraw];
    let newDiscard = [...currentDiscard];
    for (let i = 0; i < count; i++) {
        if (newDraw.length === 0) {
            if (newDiscard.length === 0) break;
            newDraw = shuffle(newDiscard);
            newDiscard = [];
        }
        const card = newDraw.pop();
        if (card) drawn.push(card);
    }
    return { drawn, newDraw, newDiscard };
};

/**
 * Draw cards with Innate prioritization (for combat start only)
 * Innate cards are guaranteed to be in the opening hand.
 * StS behavior: Innate cards are drawn first, then remaining slots filled normally.
 */
export const drawCardsWithInnate = (deck: CardData[], count: number): { drawn: CardData[], newDraw: CardData[], newDiscard: CardData[] } => {
    // Separate innate cards from the rest
    const innateCards = deck.filter(c => c.innate);
    const nonInnateCards = deck.filter(c => !c.innate);

    // Shuffle non-innate cards
    const shuffledNonInnate = shuffle(nonInnateCards);

    // Build the draw pile: innate cards on top (so they're drawn first)
    // In StS, innate cards are guaranteed to be in opening hand
    let drawn: CardData[] = [];

    // Draw innate cards first (up to hand size)
    const innateCount = Math.min(innateCards.length, count);
    drawn = [...innateCards.slice(0, innateCount)];

    // Fill remaining slots with non-innate cards
    const remainingSlots = count - drawn.length;
    for (let i = 0; i < remainingSlots && shuffledNonInnate.length > 0; i++) {
        const card = shuffledNonInnate.pop();
        if (card) drawn.push(card);
    }

    // Build new draw pile: remaining innate cards (if any overflow) + remaining non-innate cards
    const remainingInnate = innateCards.slice(innateCount);
    const newDraw = shuffle([...remainingInnate, ...shuffledNonInnate]);

    getGlobalLogger().log('INNATE_DRAW', `Drew ${innateCount} innate cards, ${remainingSlots} normal cards`);

    return { drawn, newDraw, newDiscard: [] };
};

export const processDrawnCards = (
    drawn: CardData[],
    hand: CardData[],
    discard: CardData[],
    drawPile: CardData[],
    stats: CharacterStats,
    message: string
): { hand: CardData[], discard: CardData[], drawPile: CardData[], stats: CharacterStats, message: string, drawnCards: CardData[] } => {
    let nextHand = [...hand];
    let nextDiscard = [...discard];
    let currentDrawPile = [...drawPile];
    let nextStats = { ...stats };
    let newMessage = message;
    let actualDrawn: CardData[] = [];

    let cardsToProcess = [...drawn];
    let safety = 0;

    while (cardsToProcess.length > 0 && safety < 20) {
        const card = cardsToProcess.shift();
        if (!card) continue;

        // Hand Limit
        if (nextHand.length < MAX_HAND_SIZE) {
            nextHand.push(card);
            actualDrawn.push(card);
            getGlobalLogger().log('CARD_ADDED_TO_HAND', `Added ${card.name} to hand.`);
        } else {
            nextDiscard.push(card);
            newMessage += ` (Hand full! Burned ${card.name})`;
            getGlobalLogger().log('CARD_BURNED', `Hand full, ${card.name} burned to discard.`);
            continue;
        }

        // Legacy Code (Void)
        if (card.effects?.some(e => e.type === 'lose_bandwidth') && card.unplayable) {
            nextStats.bandwidth = Math.max(0, nextStats.bandwidth - 1);
            newMessage += ` (Legacy Code drained 1 Bandwidth!)`;
            getGlobalLogger().log('LEGACY_CODE_EFFECT', `Legacy Code drained 1 Bandwidth.`);
        }

        // Evolve
        if (card.type === 'status' && nextStats.statuses.evolve > 0 && nextStats.statuses.noDraw === 0) {
            safety++;
            getGlobalLogger().log('EVOLVE_TRIGGER', `Evolve triggered, drawing ${nextStats.statuses.evolve} cards.`);
            const evolveResult = drawCards(currentDrawPile, nextDiscard, nextStats.statuses.evolve);
            currentDrawPile = evolveResult.newDraw;
            nextDiscard = evolveResult.newDiscard;
            evolveResult.drawn.forEach(c => cardsToProcess.push(c));
        }
    }

    return { hand: nextHand, discard: nextDiscard, drawPile: currentDrawPile, stats: nextStats, message: newMessage, drawnCards: actualDrawn };
};

export const upgradeCard = (card: CardData): CardData => {
    if (card.name.endsWith('+')) return card;
    if (card.id === 'cto_refactor') {
        const upgradedEffects = [{ type: 'block', value: 9, target: 'self' }, { type: 'exhaust_targeted', value: 1, target: 'self' }] as CardEffect[];
        return { ...card, name: card.name + "+", effects: upgradedEffects, description: "Gain 9 Mitigation. Exhaust a card." };
    }
    const newEffects = card.effects.map(effect => {
        if (effect.type === 'damage' || effect.type === 'block') return { ...effect, value: effect.value + 3 };
        if (effect.type === 'apply_status' && (effect.status === 'vulnerable' || effect.status === 'weak' || effect.status === 'strength')) return { ...effect, value: effect.value + 1 };
        if (effect.strengthMultiplier && effect.strengthMultiplier === 3) return { ...effect, strengthMultiplier: 5 };
        if (effect.type === 'upgrade_hand' && effect.value === 1) return { ...effect, value: 99 };
        return effect;
    });
    let newDesc = card.description.replace(/\d+/, (match) => (parseInt(match) + 3).toString());
    if (card.id === 'cto_brute_force') newDesc = newDesc.replace('3 times', '5 times');
    if (card.id === 'cto_tooling') newDesc = newDesc.replace('a card', 'ALL cards');
    return { ...card, name: card.name + "+", effects: newEffects, description: newDesc };
};

// --- Relic Helpers ---

export const applyCombatStartRelics = (currentStats: CharacterStats, relics: RelicData[], enemies: EnemyData[]): { stats: CharacterStats, enemies: EnemyData[], message: string } => {
    let newStats = { ...currentStats, statuses: { ...currentStats.statuses } };
    let newEnemies = enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    let messages: string[] = [];

    relics.forEach(relic => {
        // Reset combat-specific relic state
        relic.attackCounter = 0;
        relic.usedThisCombat = false;

        // Safety Net: Start with 10 Block
        if (relic.trigger === 'combat_start' && relic.effect.type === 'block') {
            newStats.mitigation += relic.effect.value || 0;
            messages.push(`${relic.name}: +${relic.effect.value} Mitigation`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} applied ${relic.effect.value} block at combat start.`);
        }

        // Sticky Note: Apply 1 Vulnerable to ALL enemies
        if (relic.trigger === 'combat_start' && relic.effect.type === 'apply_vulnerable_all') {
            const pressureCookerWeak = getPressureCookerWeak(relics);
            newEnemies.forEach(e => {
                e.statuses.vulnerable += relic.effect.value || 1;
                // Pressure Cooker: Also apply Weak when applying Vulnerable
                if (pressureCookerWeak > 0) {
                    e.statuses.weak += pressureCookerWeak;
                }
            });
            messages.push(`${relic.name}: All enemies Exposed!`);
            if (pressureCookerWeak > 0) {
                messages.push(`Pressure Cooker: All enemies Drained!`);
            }
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} applied vulnerable to all enemies at combat start.`);
        }

        // Fresh Eyes: Passive +1 Strength (applied at combat start)
        if (relic.trigger === 'passive' && relic.effect.type === 'strength') {
            newStats.statuses.strength += relic.effect.value || 1;
            messages.push(`${relic.name}: +${relic.effect.value} Strength`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} applied ${relic.effect.value} strength at combat start.`);
        }

        // Aggressive Growth: Enemies start with +1 Strength
        if (relic.effect.enemy_strength) {
            newEnemies.forEach(e => {
                e.statuses.strength += relic.effect.enemy_strength || 0;
            });
            messages.push(`${relic.name}: Enemies have +${relic.effect.enemy_strength} Strength`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} applied ${relic.effect.enemy_strength} strength to enemies at combat start.`);
        }
    });

    return { stats: newStats, enemies: newEnemies, message: messages.join(' ') };
};

// Get wound cards to add to deck for relics like Cutting Corners
export const getRelicWoundsToAdd = (relics: RelicData[]): CardData[] => {
    const wounds: CardData[] = [];
    relics.forEach(relic => {
        if (relic.effect.add_wounds && relic.effect.add_wounds > 0) {
            const bugCard = GAME_DATA.cards.card_bug;
            if (bugCard) {
                for (let i = 0; i < relic.effect.add_wounds; i++) {
                    wounds.push({ ...bugCard, id: `wound_${relic.id}_${i}_${Date.now()}` });
                }
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} added ${relic.effect.add_wounds} Bug cards to deck.`);
            }
        }
    });
    return wounds;
};

// Apply Smart Money (on_card_reward relic)
export const applyOnCardReward = (relics: RelicData[], currentStats: CharacterStats): { stats: CharacterStats, messages: string[] } => {
    let newStats = { ...currentStats };
    const messages: string[] = [];

    relics.forEach(relic => {
        if (relic.trigger === 'on_card_reward' && relic.effect.type === 'bonus_capital') {
            newStats.capital += relic.effect.value || 0;
            messages.push(`${relic.name}: +$${relic.effect.value}k!`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} capital on card reward.`);
        }
    });

    return { stats: newStats, messages };
};

// Secret Weapon: Get a skill card from deck to start with in hand
export const getSecretWeaponCard = (relics: RelicData[], deck: CardData[]): CardData | null => {
    const secretWeapon = relics.find(r => r.effect.type === 'start_with_card');
    if (!secretWeapon) return null;

    // If player chose a specific card, use the base card ID to find a matching card in deck
    // (card.id changes each run, but the base ID like 'cto_stay_focused' stays the same)
    if (secretWeapon.chosenCardId) {
        // First try exact match
        let chosen = deck.find(c => c.id === secretWeapon.chosenCardId);

        // If not found, try to find by base card name (same card type)
        if (!chosen) {
            // Extract base card type from ID (e.g., 'stay_focused_2_abc123' -> 'stay_focused')
            const chosenBase = secretWeapon.chosenCardId.split('_')[0];
            chosen = deck.find(c => c.id.startsWith(chosenBase) && c.type === 'skill');
        }

        if (chosen) {
            getGlobalLogger().log('RELIC_EFFECT', `${secretWeapon.name} added ${chosen.name} to starting hand.`);
            return chosen;
        }
    }

    // Fallback: Find any skill card in the deck
    const skillCards = deck.filter(c => c.type === 'skill');
    if (skillCards.length === 0) return null;

    // Pick a random skill card as fallback
    const chosen = skillCards[Math.floor(Math.random() * skillCards.length)];
    getGlobalLogger().log('RELIC_EFFECT', `${secretWeapon.name} added ${chosen.name} to starting hand (random fallback).`);
    return chosen;
};

export const applyCombatEndRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let messages: string[] = [];

    relics.forEach(relic => {
        // Git Repository: Heal 6 at end of combat
        if (relic.trigger === 'combat_end' && relic.effect.type === 'heal') {
            const healAmount = relic.effect.value || 0;
            const oldHp = newStats.hp;
            newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
            const actualHeal = newStats.hp - oldHp;
            if (actualHeal > 0) {
                messages.push(`${relic.name}: +${actualHeal} Runway`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} healed ${actualHeal} HP at combat end.`);
            }
        }

        // Second Wind: If HP ≤50%, heal 12
        if (relic.trigger === 'combat_end_conditional' && relic.effect.type === 'heal_if_low') {
            const threshold = (relic.effect.threshold || 50) / 100;
            if (newStats.hp <= newStats.maxHp * threshold) {
                const healAmount = relic.effect.value || 12;
                const oldHp = newStats.hp;
                newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
                const actualHeal = newStats.hp - oldHp;
                if (actualHeal > 0) {
                    messages.push(`${relic.name}: +${actualHeal} Runway (Second Wind!)`);
                    getGlobalLogger().log('RELIC_EFFECT', `${relic.name} healed ${actualHeal} HP (conditional) at combat end.`);
                }
            }
        }
    });

    return { stats: newStats, message: messages.join(' ') };
};

export const getTurnStartBandwidth = (relics: RelicData[], turn: number = 1): number => {
    let bandwidth = 3;
    relics.forEach(relic => {
        // Coffee Drip, Rate Limiter, Cutting Corners, No Rest, Aggressive Growth: +1 every turn
        if (relic.trigger === 'turn_start' && relic.effect.type === 'gain_bandwidth') {
            bandwidth += relic.effect.value || 0;
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} bandwidth at turn start.`);
        }
        // Fresh Start: +1 on first turn only
        if (relic.trigger === 'first_turn' && relic.effect.type === 'gain_bandwidth' && turn === 1) {
            bandwidth += relic.effect.value || 0;
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} bandwidth on first turn.`);
        }
        // IMPORTANT: Reset attack counters at turn start for per-turn relics (StS behavior)
        // Shuriken/Kunai/Ornamental Fan equivalents reset each turn, not each combat
        if (relic.trigger === 'on_attack_count') {
            relic.attackCounter = 0;
        }
    });
    return bandwidth;
};

export const applyTurnEndRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let messages: string[] = [];

    relics.forEach(relic => {
        // Fallback Position: If no block, gain 6
        if (relic.trigger === 'turn_end_conditional' && relic.effect.type === 'block_if_zero') {
            if (newStats.mitigation === 0) {
                newStats.mitigation += relic.effect.value || 6;
                messages.push(`${relic.name}: +${relic.effect.value} Mitigation (fallback)`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} block at turn end (conditional).`);
            }
        }
    });

    return { stats: newStats, message: messages.join(' ') };
};

export const applyOnAttackRelics = (relics: RelicData[], stats: CharacterStats): { stats: CharacterStats, bonusDamage: number, messages: string[] } => {
    let newStats = { ...stats, statuses: { ...stats.statuses } };
    let bonusDamage = 0;
    let messages: string[] = [];

    relics.forEach(relic => {
        // Opening Move: First attack deals +8 damage
        if (relic.trigger === 'first_attack' && relic.effect.type === 'bonus_damage' && !relic.usedThisCombat) {
            bonusDamage += relic.effect.value || 8;
            relic.usedThisCombat = true;
            messages.push(`${relic.name}: +${relic.effect.value} damage!`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} bonus damage on first attack.`);
        }

        // Increment attack counter for attack-count based relics
        if (relic.trigger === 'on_attack_count') {
            relic.attackCounter = (relic.attackCounter || 0) + 1;
            const threshold = relic.effect.threshold || 3;

            if (relic.attackCounter >= threshold) {
                relic.attackCounter = 0;

                // Momentum: +1 Strength every 3 attacks
                if (relic.effect.type === 'strength_per_attacks') {
                    newStats.statuses.strength += relic.effect.value || 1;
                    messages.push(`${relic.name}: +${relic.effect.value} Execution Power!`);
                    getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} Execution Power.`);
                }

                // Ship Cadence: +4 Block every 3 attacks
                if (relic.effect.type === 'block_per_attacks') {
                    newStats.mitigation += relic.effect.value || 4;
                    messages.push(`${relic.name}: +${relic.effect.value} Mitigation!`);
                    getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} Mitigation.`);
                }

                // Quick Learner: +1 Dexterity every 3 attacks
                if (relic.effect.type === 'dexterity_per_attacks') {
                    newStats.statuses.dexterity = (newStats.statuses.dexterity || 0) + (relic.effect.value || 1);
                    messages.push(`${relic.name}: +${relic.effect.value} Dexterity!`);
                    getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} Dexterity.`);
                }
            }
        }
    });

    return { stats: newStats, bonusDamage, messages };
};

export const applyOnEnemyDeathRelics = (relics: RelicData[], stats: CharacterStats): { stats: CharacterStats, drawCards: number, messages: string[] } => {
    let newStats = { ...stats };
    let drawCards = 0;
    let messages: string[] = [];

    relics.forEach(relic => {
        // Force Multiplier: +1 Energy and draw 1 when enemy dies
        if (relic.trigger === 'on_enemy_death' && relic.effect.type === 'energy_and_draw') {
            newStats.bandwidth += relic.effect.value || 1;
            drawCards += relic.effect.value || 1;
            messages.push(`${relic.name}: +${relic.effect.value} Bandwidth, Draw ${relic.effect.value}!`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} bandwidth and draw on enemy death.`);
        }
    });

    return { stats: newStats, drawCards, messages };
};

export const applyOnDamagedRelics = (relics: RelicData[], damageAmount: number, attackerId: string): { thornsDamage: number, messages: string[] } => {
    let thornsDamage = 0;
    let messages: string[] = [];

    if (damageAmount > 0) {
        relics.forEach(relic => {
            // Thick Skin: Deal 3 damage back when hit
            if (relic.trigger === 'on_damaged' && relic.effect.type === 'thorns') {
                thornsDamage += relic.effect.value || 3;
                messages.push(`${relic.name}: ${relic.effect.value} damage reflected!`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} reflected ${relic.effect.value} damage.`);
            }
        });
    }

    return { thornsDamage, messages };
};

export const hasRelic = (relics: RelicData[], relicId: string): boolean => {
    return relics.some(r => r.id === relicId);
};

export const canRestAtSite = (relics: RelicData[]): boolean => {
    return !relics.some(r => r.effect.disable_rest === true);
};

export const getCardLimit = (relics: RelicData[]): number | null => {
    for (const relic of relics) {
        if (relic.effect.card_limit) return relic.effect.card_limit;
    }
    return null;
};

export const getDrawBonus = (relics: RelicData[]): number => {
    let bonus = 0;
    relics.forEach(relic => {
        if (relic.effect.draw_bonus) bonus += relic.effect.draw_bonus;
    });
    return bonus;
};

export const hasSneckoEffect = (relics: RelicData[]): boolean => {
    return relics.some(r => r.effect.type === 'snecko');
};

export const hasRetainHand = (relics: RelicData[]): boolean => {
    return relics.some(r => r.effect.type === 'retain_hand');
};

// --- CTO-EXCLUSIVE RELIC HELPERS (Ironclad equivalents) ---

/**
 * Crunch Mode (Red Skull equivalent): +3 Strength while HP ≤50%
 */
export const getCrunchModeStrength = (relics: RelicData[], hp: number, maxHp: number): number => {
    const crunchMode = relics.find(r => r.effect.type === 'strength_when_low');
    if (!crunchMode) return 0;
    const threshold = (crunchMode.effect.threshold || 50) / 100;
    if (hp <= maxHp * threshold) {
        return crunchMode.effect.value || 3;
    }
    return 0;
};

/**
 * Growth Mindset (Paper Phrog equivalent): Vulnerable = 75% instead of 50%
 */
export const getVulnerableMultiplier = (relics: RelicData[]): number => {
    const growthMindset = relics.find(r => r.effect.type === 'vulnerable_bonus');
    if (growthMindset) {
        return 1.75; // 75% more damage
    }
    return 1.5; // Default 50% more damage
};

/**
 * Antifragile & Data-Driven (Self-Forming Clay / Runic Cube): On HP loss effects
 */
export const applyOnHpLossRelics = (relics: RelicData[], damageAmount: number): { blockNextTurn: number, drawCards: number, messages: string[] } => {
    let blockNextTurn = 0;
    let drawCards = 0;
    const messages: string[] = [];

    if (damageAmount > 0) {
        relics.forEach(relic => {
            // Antifragile: Gain 3 Block next turn
            if (relic.trigger === 'on_hp_loss' && relic.effect.type === 'block_next_turn') {
                blockNextTurn += relic.effect.value || 3;
                messages.push(`${relic.name}: +${relic.effect.value} Buffer next turn!`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} will grant ${relic.effect.value} block next turn.`);
            }
            // Data-Driven: Draw 1 card
            if (relic.trigger === 'on_hp_loss' && relic.effect.type === 'draw_on_hp_loss') {
                drawCards += relic.effect.value || 1;
                messages.push(`${relic.name}: Draw ${relic.effect.value}!`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} drew ${relic.effect.value} cards on HP loss.`);
            }
        });
    }

    return { blockNextTurn, drawCards, messages };
};

/**
 * Pressure Cooker (Champion Belt equivalent): Apply Weak when applying Vulnerable
 */
export const getPressureCookerWeak = (relics: RelicData[]): number => {
    const pressureCooker = relics.find(r => r.effect.type === 'apply_weak_on_vulnerable');
    if (pressureCooker) {
        return pressureCooker.effect.value || 1;
    }
    return 0;
};

/**
 * Phoenix Protocol (Charon's Ashes equivalent): Deal damage to ALL when exhausting
 */
export const getPhoenixProtocolDamage = (relics: RelicData[]): number => {
    const phoenix = relics.find(r => r.effect.type === 'damage_all_on_exhaust');
    if (phoenix) {
        return phoenix.effect.value || 3;
    }
    return 0;
};

/**
 * Wellness Program (Magic Flower equivalent): Healing is 50% more effective
 */
export const getHealingMultiplier = (relics: RelicData[]): number => {
    const wellness = relics.find(r => r.effect.type === 'healing_bonus');
    if (wellness) {
        return 1 + ((wellness.effect.value || 50) / 100);
    }
    return 1;
};

/**
 * Market Dominance (Brimstone equivalent): +2 Strength at turn start, enemies +1
 */
export const applyMarketDominanceRelics = (relics: RelicData[], stats: CharacterStats, enemies: EnemyData[]): { stats: CharacterStats, enemies: EnemyData[], messages: string[] } => {
    let newStats = { ...stats, statuses: { ...stats.statuses } };
    let newEnemies = enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    const messages: string[] = [];

    relics.forEach(relic => {
        if (relic.effect.type === 'strength_both') {
            // Player gains strength
            newStats.statuses.strength += relic.effect.value || 2;
            messages.push(`${relic.name}: +${relic.effect.value} Velocity`);
            getGlobalLogger().log('RELIC_EFFECT', `${relic.name} granted ${relic.effect.value} strength at turn start.`);

            // Enemies also gain strength
            if (relic.effect.enemy_strength) {
                newEnemies.forEach(e => {
                    e.statuses.strength += relic.effect.enemy_strength || 1;
                });
                messages.push(`(Enemies +${relic.effect.enemy_strength})`);
                getGlobalLogger().log('RELIC_EFFECT', `${relic.name} also granted ${relic.effect.enemy_strength} strength to enemies.`);
            }
        }
    });

    return { stats: newStats, enemies: newEnemies, messages };
};

export const getRelicsByRarity = (rarity: 'common' | 'uncommon' | 'rare' | 'boss'): RelicData[] => {
    return Object.values(GAME_DATA.relics).filter(r => r.rarity === rarity);
};

export const getRandomRelic = (rarity: 'common' | 'uncommon' | 'rare' | 'boss', excludeIds: string[] = []): RelicData | null => {
    const available = getRelicsByRarity(rarity).filter(r => !excludeIds.includes(r.id));
    if (available.length === 0) return null;
    return { ...available[Math.floor(Math.random() * available.length)] };
};

// === StS-ACCURATE RELIC DROP SYSTEM ===

/**
 * Get a relic from treasure chest (StS rates: 50% common, 33% uncommon, 17% rare)
 * Falls back to lower rarity if pool is empty
 */
export const getTreasureRelic = (excludeIds: string[] = []): RelicData | null => {
    const roll = Math.random() * 100;

    // StS treasure relic rates
    if (roll < 50) {
        // 50% common
        return getRandomRelic('common', excludeIds) || getRandomRelic('uncommon', excludeIds);
    } else if (roll < 83) {
        // 33% uncommon
        return getRandomRelic('uncommon', excludeIds) || getRandomRelic('common', excludeIds);
    } else {
        // 17% rare
        return getRandomRelic('rare', excludeIds) || getRandomRelic('uncommon', excludeIds) || getRandomRelic('common', excludeIds);
    }
};

/**
 * Get a relic from elite victory (StS: higher uncommon/rare weight)
 * Elite relics are typically uncommon with rare chance
 */
export const getEliteRelic = (excludeIds: string[] = []): RelicData | null => {
    const roll = Math.random() * 100;

    // StS elite rates favor uncommon/rare
    if (roll < 25) {
        // 25% common
        return getRandomRelic('common', excludeIds) || getRandomRelic('uncommon', excludeIds);
    } else if (roll < 80) {
        // 55% uncommon
        return getRandomRelic('uncommon', excludeIds) || getRandomRelic('common', excludeIds);
    } else {
        // 20% rare
        return getRandomRelic('rare', excludeIds) || getRandomRelic('uncommon', excludeIds) || getRandomRelic('common', excludeIds);
    }
};

/**
 * Get 3 boss relic choices (StS boss relic selection)
 * Returns array of 3 unique boss relics for player to choose from
 */
export const getBossRelicChoices = (excludeIds: string[] = []): RelicData[] => {
    const available = getRelicsByRarity('boss').filter(r => !excludeIds.includes(r.id));
    const choices: RelicData[] = [];
    const used = new Set<string>();

    // Pick up to 3 unique boss relics
    while (choices.length < 3 && choices.length < available.length) {
        const idx = Math.floor(Math.random() * available.length);
        const relic = available[idx];
        if (!used.has(relic.id)) {
            used.add(relic.id);
            choices.push({ ...relic });
        }
    }

    return choices;
};

/**
 * Get gold reward instead of boss relic (StS skip option)
 * Returns amount of gold player receives for skipping
 */
export const getBossRelicSkipGold = (): number => {
    // StS gives ~250 gold for skipping boss relic
    return 150 + Math.floor(Math.random() * 100); // 150-250 gold
};

// ==============================================
// POTION SYSTEM - StS-Accurate Implementation
// ==============================================

/**
 * Get all available potions for a character (shared + character-specific)
 */
export const getAvailablePotions = (character: string = 'cto'): PotionData[] => {
    return Object.values(GAME_DATA.potions).filter(p =>
        p.character === 'shared' || p.character === character
    );
};

/**
 * Get potions by rarity
 */
export const getPotionsByRarity = (rarity: PotionRarity, character: string = 'cto'): PotionData[] => {
    return getAvailablePotions(character).filter(p => p.rarity === rarity);
};

/**
 * Generate a random potion based on STS rarity weights
 * Common: 65%, Uncommon: 25%, Rare: 10%
 */
export const generateRandomPotion = (character: string = 'cto', excludeFruitJuice: boolean = false): PotionData => {
    const roll = Math.random() * 100;
    let rarity: PotionRarity;

    if (roll < 65) rarity = 'common';
    else if (roll < 90) rarity = 'uncommon';
    else rarity = 'rare';

    let availablePotions = getPotionsByRarity(rarity, character);

    // Exclude Fruit Juice (Equity Grant) from Entropic Brew
    if (excludeFruitJuice) {
        availablePotions = availablePotions.filter(p => p.id !== 'potion_equity_grant');
    }

    // Fallback to any rarity if none available
    if (availablePotions.length === 0) {
        availablePotions = getAvailablePotions(character);
        if (excludeFruitJuice) {
            availablePotions = availablePotions.filter(p => p.id !== 'potion_equity_grant');
        }
    }

    const selected = availablePotions[Math.floor(Math.random() * availablePotions.length)];
    return { ...selected };
};

/**
 * Check if a potion should drop after combat (StS mechanics)
 * Base chance: 40%, adjusts by ±10 per drop/miss
 */
export const checkPotionDrop = (currentChance: number): { dropped: boolean; newChance: number; potion?: PotionData } => {
    const roll = Math.random() * 100;

    if (roll < currentChance) {
        // Potion drops! Decrease chance by 10 (min 0)
        const potion = generateRandomPotion();
        getGlobalLogger().log('POTION_DROP', `Potion dropped! ${potion.name} (chance was ${currentChance}%)`);
        return {
            dropped: true,
            newChance: Math.max(0, currentChance - 10),
            potion
        };
    }

    // No drop, increase chance by 10 (max 100)
    getGlobalLogger().log('POTION_DROP', `No potion drop (chance was ${currentChance}%)`);
    return {
        dropped: false,
        newChance: Math.min(100, currentChance + 10)
    };
};

/**
 * Check if player can acquire a potion (has empty slot)
 */
export const canAcquirePotion = (potions: (PotionData | null)[]): boolean => {
    return potions.some(p => p === null);
};

/**
 * Add potion to first empty slot
 */
export const addPotionToSlot = (potions: (PotionData | null)[], potion: PotionData): (PotionData | null)[] => {
    const newPotions = [...potions];
    const emptySlotIndex = newPotions.findIndex(p => p === null);

    if (emptySlotIndex !== -1) {
        newPotions[emptySlotIndex] = potion;
        getGlobalLogger().log('POTION_ACQUIRE', `Added ${potion.name} to slot ${emptySlotIndex}`);
    } else {
        getGlobalLogger().log('POTION_ACQUIRE', `Cannot add ${potion.name} - no empty slots!`);
    }

    return newPotions;
};

/**
 * Remove potion from slot (after use or discard)
 */
export const removePotionFromSlot = (potions: (PotionData | null)[], slotIndex: number): (PotionData | null)[] => {
    const newPotions = [...potions];
    if (slotIndex >= 0 && slotIndex < newPotions.length) {
        const removed = newPotions[slotIndex];
        newPotions[slotIndex] = null;
        if (removed) {
            getGlobalLogger().log('POTION_REMOVE', `Removed ${removed.name} from slot ${slotIndex}`);
        }
    }
    return newPotions;
};

/**
 * Get the effect multiplier if Sacred Bark equivalent is present
 * (Doubles potion effects when sacredBarkAffected is true)
 */
export const getSacredBarkMultiplier = (relics: RelicData[]): number => {
    // TODO: Add Sacred Bark equivalent relic (e.g., "Investor's Choice")
    // For now, check if a relic with 'potion_double' effect exists
    const hasSacredBark = relics.some(r => r.effect?.type === 'potion_double');
    return hasSacredBark ? 2 : 1;
};

/**
 * Initialize default potion slots for game start
 */
export const initializePotionSlots = (slotCount: number = 3): (PotionData | null)[] => {
    return Array(slotCount).fill(null);
};

/**
 * Check for Fairy potion (Backup Plan) on death
 * Returns the heal amount or null if no fairy potion
 */
export const checkFairyPotion = (potions: (PotionData | null)[], maxHp: number, relics: RelicData[]): { healAmount: number; slotIndex: number } | null => {
    const fairyIndex = potions.findIndex(p => p?.id === 'potion_backup_plan');
    if (fairyIndex === -1) return null;

    const potion = potions[fairyIndex]!;
    const multiplier = potion.sacredBarkAffected ? getSacredBarkMultiplier(relics) : 1;
    const healPercent = (potion.effects[0]?.value || 30) * multiplier;
    const healAmount = Math.floor(maxHp * healPercent / 100);

    getGlobalLogger().log('POTION_FAIRY', `Backup Plan activated! Healing to ${healPercent}% (${healAmount} HP)`);

    return { healAmount, slotIndex: fairyIndex };
};

/**
 * Check if Smoke Bomb (Exit Strategy) can be used
 * Cannot be used against bosses
 */
export const canUseExitStrategy = (enemies: EnemyData[]): boolean => {
    return !enemies.some(e => e.type === 'boss');
};

/**
 * Resolve a potion's effects when used
 * Handles all potion effect types with Sacred Bark multiplier support
 */
export const resolvePotionEffect = (
    state: GameState,
    potion: PotionData,
    slotIndex: number,
    targetEnemyId?: string
): GameState => {
    let newState = { ...state };
    const multiplier = potion.sacredBarkAffected ? getSacredBarkMultiplier(state.relics) : 1;

    getGlobalLogger().log('POTION_USE', `Used ${potion.name}`, {
        potionName: potion.name,
        slotIndex,
        targetEnemyId,
        multiplier: potion.sacredBarkAffected ? multiplier : 1
    });

    // Remove potion from slot
    newState.potions = removePotionFromSlot(state.potions, slotIndex);

    // Get target enemy if applicable
    const targetEnemy = targetEnemyId
        ? newState.enemies.find(e => e.id === targetEnemyId)
        : newState.enemies[0];

    // Process each effect
    for (const effect of potion.effects) {
        const value = effect.value * multiplier;

        switch (effect.type) {
            case 'damage':
                if (targetEnemy) {
                    const damage = calculateDamage(value, newState.playerStats.statuses, targetEnemy.statuses, 1, newState.relics);
                    targetEnemy.hp = Math.max(0, targetEnemy.hp - damage);
                    getGlobalLogger().log('POTION_EFFECT', `Dealt ${damage} damage to ${targetEnemy.name}`, { amount: damage });
                }
                break;

            case 'damage_all':
                for (const enemy of newState.enemies) {
                    const damage = calculateDamage(value, newState.playerStats.statuses, enemy.statuses, 1, newState.relics);
                    enemy.hp = Math.max(0, enemy.hp - damage);
                    getGlobalLogger().log('POTION_EFFECT', `Dealt ${damage} damage to ${enemy.name}`, { amount: damage });
                }
                break;

            case 'block':
                newState.playerStats = {
                    ...newState.playerStats,
                    mitigation: newState.playerStats.mitigation + value
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} block`, { amount: value });
                break;

            case 'heal':
                const healAmount = Math.min(value, newState.playerStats.maxHp - newState.playerStats.hp);
                newState.playerStats = {
                    ...newState.playerStats,
                    hp: newState.playerStats.hp + healAmount
                };
                getGlobalLogger().log('POTION_EFFECT', `Healed ${healAmount} HP`, { amount: healAmount });
                break;

            case 'heal_percent':
                const percentHeal = Math.floor(newState.playerStats.maxHp * value / 100);
                const actualHeal = Math.min(percentHeal, newState.playerStats.maxHp - newState.playerStats.hp);
                newState.playerStats = {
                    ...newState.playerStats,
                    hp: newState.playerStats.hp + actualHeal
                };
                getGlobalLogger().log('POTION_EFFECT', `Healed ${actualHeal} HP (${value}% of max)`, { amount: actualHeal });
                break;

            case 'draw':
                const { drawn, newDraw, newDiscard } = drawCards(newState.drawPile, newState.discardPile, value);
                const processedDraw = processDrawnCards(drawn, newState.hand, newDiscard, newDraw, newState.playerStats, '');
                newState = {
                    ...newState,
                    hand: processedDraw.hand,
                    drawPile: processedDraw.drawPile,
                    discardPile: processedDraw.discard,
                    playerStats: processedDraw.stats
                };
                getGlobalLogger().log('POTION_EFFECT', `Drew ${drawn.length} cards`, { amount: drawn.length });
                break;

            case 'gain_energy':
                newState.playerStats = {
                    ...newState.playerStats,
                    bandwidth: newState.playerStats.bandwidth + value
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} energy`, { amount: value });
                break;

            case 'gain_strength':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        strength: newState.playerStats.statuses.strength + value
                    }
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Strength`, { amount: value });
                break;

            case 'gain_dexterity':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        dexterity: newState.playerStats.statuses.dexterity + value
                    }
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Dexterity`, { amount: value });
                break;

            case 'temporary_strength':
                // Temporary strength that wears off at end of turn
                // Mark this in a way that resolveEndTurn can handle
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        strength: newState.playerStats.statuses.strength + value
                    }
                };
                // TODO: Track temporary strength to remove at end of turn
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} temporary Strength`, { amount: value });
                break;

            case 'temporary_dexterity':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        dexterity: newState.playerStats.statuses.dexterity + value
                    }
                };
                // TODO: Track temporary dexterity to remove at end of turn
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} temporary Dexterity`, { amount: value });
                break;

            case 'apply_vulnerable':
                if (targetEnemy && targetEnemy.statuses.artifact > 0) {
                    targetEnemy.statuses.artifact--;
                    getGlobalLogger().log('POTION_EFFECT', `${targetEnemy.name}'s Artifact blocked Vulnerable`);
                } else if (targetEnemy) {
                    targetEnemy.statuses.vulnerable += value;
                    getGlobalLogger().log('POTION_EFFECT', `Applied ${value} Vulnerable to ${targetEnemy.name}`, { amount: value });
                }
                break;

            case 'apply_weak':
                if (targetEnemy && targetEnemy.statuses.artifact > 0) {
                    targetEnemy.statuses.artifact--;
                    getGlobalLogger().log('POTION_EFFECT', `${targetEnemy.name}'s Artifact blocked Weak`);
                } else if (targetEnemy) {
                    targetEnemy.statuses.weak += value;
                    getGlobalLogger().log('POTION_EFFECT', `Applied ${value} Weak to ${targetEnemy.name}`, { amount: value });
                }
                break;

            case 'gain_artifact':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        artifact: newState.playerStats.statuses.artifact + value
                    }
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Artifact`, { amount: value });
                break;

            case 'gain_thorns':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        thorns: newState.playerStats.statuses.thorns + value
                    }
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Thorns`, { amount: value });
                break;

            case 'gain_metallicize':
                newState.playerStats = {
                    ...newState.playerStats,
                    statuses: {
                        ...newState.playerStats.statuses,
                        metallicize: newState.playerStats.statuses.metallicize + value
                    }
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Metallicize`, { amount: value });
                break;

            case 'gain_max_hp':
                newState.playerStats = {
                    ...newState.playerStats,
                    maxHp: newState.playerStats.maxHp + value,
                    hp: newState.playerStats.hp + value
                };
                getGlobalLogger().log('POTION_EFFECT', `Gained ${value} Max HP`, { amount: value });
                break;

            case 'duplicate_next':
                newState.duplicateNextCard = true;
                getGlobalLogger().log('POTION_EFFECT', 'Next card played will be played twice');
                break;

            case 'upgrade_hand':
                // Upgrade all cards in hand
                for (const card of newState.hand) {
                    if (!card.name.endsWith('+')) {
                        card.name = card.name + '+';
                        // Upgrade effects (simplified - proper upgrade logic in separate function)
                        for (const cardEffect of card.effects) {
                            if (cardEffect.type === 'damage') cardEffect.value += 3;
                            if (cardEffect.type === 'block') cardEffect.value += 3;
                        }
                    }
                }
                getGlobalLogger().log('POTION_EFFECT', `Upgraded ${newState.hand.length} cards in hand`);
                break;

            case 'gambler':
                // Discard hand and draw same number
                const handSize = newState.hand.length;
                newState.discardPile = [...newState.discardPile, ...newState.hand];
                newState.hand = [];
                const gamblerDraw = drawCards(newState.drawPile, newState.discardPile, handSize);
                const processedGambler = processDrawnCards(gamblerDraw.drawn, [], gamblerDraw.newDiscard, gamblerDraw.newDraw, newState.playerStats, '');
                newState = {
                    ...newState,
                    hand: processedGambler.hand,
                    drawPile: processedGambler.drawPile,
                    discardPile: processedGambler.discard,
                    playerStats: processedGambler.stats
                };
                getGlobalLogger().log('POTION_EFFECT', `Discarded hand and drew ${processedGambler.hand.length} cards`);
                break;

            case 'return_from_discard':
                // Set pending selection for player to choose a card from discard
                if (newState.discardPile.length > 0) {
                    newState.pendingSelection = {
                        type: 'retrieve',
                        count: value,
                        action: 'add_to_hand',
                        context: 'discard',
                        message: `Choose ${value} card(s) to return to hand`
                    };
                    newState.status = 'CARD_SELECTION';
                    getGlobalLogger().log('POTION_EFFECT', `Selecting ${value} cards from discard pile`);
                }
                break;

            case 'add_random_attack':
                // Add random attack card to hand (0 cost this combat)
                const attacks = Object.values(GAME_DATA.cards).filter(c => c.type === 'attack' && c.rarity !== 'special' && c.rarity !== 'starter');
                if (attacks.length > 0) {
                    for (let i = 0; i < value; i++) {
                        const randomAttack = { ...attacks[Math.floor(Math.random() * attacks.length)], id: `random_attack_${Date.now()}_${i}`, cost: 0 };
                        newState.hand.push(randomAttack);
                    }
                    getGlobalLogger().log('POTION_EFFECT', `Added ${value} random attack(s) to hand`);
                }
                break;

            case 'add_random_skill':
                const skills = Object.values(GAME_DATA.cards).filter(c => c.type === 'skill' && c.rarity !== 'special' && c.rarity !== 'starter');
                if (skills.length > 0) {
                    for (let i = 0; i < value; i++) {
                        const randomSkill = { ...skills[Math.floor(Math.random() * skills.length)], id: `random_skill_${Date.now()}_${i}`, cost: 0 };
                        newState.hand.push(randomSkill);
                    }
                    getGlobalLogger().log('POTION_EFFECT', `Added ${value} random skill(s) to hand`);
                }
                break;

            case 'add_random_power':
                const powers = Object.values(GAME_DATA.cards).filter(c => c.type === 'power' && c.rarity !== 'special' && c.rarity !== 'starter');
                if (powers.length > 0) {
                    const randomPower = { ...powers[Math.floor(Math.random() * powers.length)], id: `random_power_${Date.now()}`, cost: 0 };
                    newState.hand.push(randomPower);
                    getGlobalLogger().log('POTION_EFFECT', `Added random power to hand: ${randomPower.name}`);
                }
                break;

            case 'add_random_colorless':
                // Add colorless card to hand - for now use any random non-starter card
                const colorless = Object.values(GAME_DATA.cards).filter(c => c.rarity !== 'special' && c.rarity !== 'starter');
                if (colorless.length > 0) {
                    const randomCard = { ...colorless[Math.floor(Math.random() * colorless.length)], id: `random_colorless_${Date.now()}`, cost: 0 };
                    newState.hand.push(randomCard);
                    getGlobalLogger().log('POTION_EFFECT', `Added random colorless card to hand: ${randomCard.name}`);
                }
                break;

            case 'escape':
                // Escape from combat (not for bosses, checked elsewhere)
                if (canUseExitStrategy(newState.enemies)) {
                    newState.status = 'MAP';
                    newState.enemies = [];
                    newState.message = 'Escaped from combat!';
                    getGlobalLogger().log('POTION_EFFECT', 'Escaped from combat');
                }
                break;

            case 'snecko':
                // Confusion effect - randomize costs of all cards in hand
                for (const card of newState.hand) {
                    card.cost = Math.floor(Math.random() * 4); // 0-3 cost
                }
                getGlobalLogger().log('POTION_EFFECT', 'Snecko confusion applied - randomized hand costs');
                break;

            case 'fill_potions':
                // Fill all empty slots with random potions
                const character = 'cto'; // TODO: Get from game state
                const newPotions = [...newState.potions];
                for (let i = 0; i < newPotions.length; i++) {
                    if (newPotions[i] === null) {
                        const randomPotion = generateRandomPotion(character, potion.id === 'potion_funding_surge');
                        if (randomPotion) {
                            newPotions[i] = randomPotion;
                            getGlobalLogger().log('POTION_EFFECT', `Generated ${randomPotion.name} in slot ${i}`);
                        }
                    }
                }
                newState.potions = newPotions;
                break;

            // Fairy potion is handled separately in checkFairyPotion
            case 'fairy':
                // This is a passive effect, handled by checkFairyPotion when player dies
                break;

            // Potions that need additional UI handling or are edge cases
            case 'exhaust_choice':
            case 'play_top_cards':
            case 'gain_ritual':
            case 'gain_plated_armor':
            case 'gain_regen':
            case 'gain_intangible':
                getGlobalLogger().log('POTION_EFFECT', `${effect.type} effect not yet fully implemented`);
                break;

            default:
                getGlobalLogger().log('WARNING', `Unknown potion effect type: ${effect.type}`);
        }
    }

    // Clean up dead enemies
    newState.enemies = newState.enemies.filter(e => e.hp > 0);

    // Check for victory
    if (newState.enemies.length === 0 && newState.status === 'PLAYING') {
        newState.status = 'VICTORY';
        newState.message = 'Victory!';
    }

    return newState;
};

// --- Map Generation (Exact Slay the Spire Algorithm) ---

// STS Map Constants
const STS_MAP = {
    LANES: 7,           // 7 possible columns (0-6)
    FLOORS: 15,         // 15 floors of nodes
    NUM_PATHS: 6,       // Exactly 6 spines from bottom to top

    // Fixed floors
    FLOOR_1_TYPE: 'problem' as MapNodeType,      // All floor 1 = normal fights
    FLOOR_9_TYPE: 'treasure' as MapNodeType,     // All floor 9 = chest
    FLOOR_15_TYPE: 'retrospective' as MapNodeType, // All floor 15 = rest

    // Room type ratios (percentage of total nodes)
    RATIOS: {
        vendor: 5,          // Shop 5%
        retrospective: 12,  // Rest 12%
        opportunity: 22,    // Event 22%
        elite: 8,           // Elite 8%
        // Normal fills the rest
    },

    // Constraints
    NO_ELITE_REST_BEFORE_FLOOR: 6,
    NO_REST_ON_FLOOR: 14,  // Floor 14 cannot be rest (floor 15 is rest)
};

// Step 1: Build 6 path spines from floor 1 to floor 15
const buildPathSpines = (rng?: SeededRandom): number[][] => {
    const paths: number[][] = [];
    const usedStartPositions: Set<number> = new Set();

    for (let pathIdx = 0; pathIdx < STS_MAP.NUM_PATHS; pathIdx++) {
        const path: number[] = [];

        // Choose starting position on floor 1
        let startCol: number;
        if (pathIdx < 2) {
            // First two paths MUST start in different bottom rooms
            do {
                startCol = rng ? rng.nextInt(0, STS_MAP.LANES - 1) : Math.floor(Math.random() * STS_MAP.LANES);
            } while (usedStartPositions.has(startCol));
            usedStartPositions.add(startCol);
        } else {
            // Paths 3-6 can start anywhere
            startCol = rng ? rng.nextInt(0, STS_MAP.LANES - 1) : Math.floor(Math.random() * STS_MAP.LANES);
        }
        path.push(startCol);

        // Walk upward floor by floor
        for (let floor = 2; floor <= STS_MAP.FLOORS; floor++) {
            const currentCol = path[path.length - 1];

            // Possible moves: up-left, straight up, up-right
            const possibleMoves: number[] = [];
            if (currentCol > 0) possibleMoves.push(currentCol - 1);
            possibleMoves.push(currentCol);
            if (currentCol < STS_MAP.LANES - 1) possibleMoves.push(currentCol + 1);

            // Filter out moves that would cause crossing with existing paths
            const validMoves = possibleMoves.filter(nextCol => {
                return !wouldCrossPath(paths, floor - 1, currentCol, nextCol);
            });

            // Pick a random valid move (fallback to any move if all would cross)
            const moves = validMoves.length > 0 ? validMoves : possibleMoves;
            const nextCol = rng ? rng.pick(moves) : moves[Math.floor(Math.random() * moves.length)];
            path.push(nextCol);
        }

        paths.push(path);
    }

    return paths;
};

// Check if moving from (floor, fromCol) to (floor+1, toCol) would cross an existing path
const wouldCrossPath = (existingPaths: number[][], floor: number, fromCol: number, toCol: number): boolean => {
    for (const path of existingPaths) {
        if (path.length <= floor) continue;

        const otherFromCol = path[floor - 1];
        const otherToCol = path[floor];

        // Crossing occurs if paths swap relative positions
        if (fromCol < otherFromCol && toCol > otherToCol) return true;
        if (fromCol > otherFromCol && toCol < otherToCol) return true;
    }
    return false;
};

// Step 2: Create nodes and connections from paths
interface NodeData {
    floor: number;
    column: number;
    connections: Set<string>;
    parentConnections: Set<string>;
}

const buildNodesFromPaths = (paths: number[][]): Map<string, NodeData> => {
    const nodes: Map<string, NodeData> = new Map();

    // Create nodes for each unique position visited by paths
    paths.forEach(path => {
        path.forEach((col, floorIdx) => {
            const floor = floorIdx + 1;
            const key = `${floor}_${col}`;

            if (!nodes.has(key)) {
                nodes.set(key, {
                    floor,
                    column: col,
                    connections: new Set(),
                    parentConnections: new Set()
                });
            }
        });
    });

    // Build connections
    paths.forEach(path => {
        for (let floorIdx = 0; floorIdx < path.length - 1; floorIdx++) {
            const floor = floorIdx + 1;
            const fromCol = path[floorIdx];
            const toCol = path[floorIdx + 1];

            const fromKey = `${floor}_${fromCol}`;
            const toKey = `${floor + 1}_${toCol}`;

            const fromNode = nodes.get(fromKey);
            const toNode = nodes.get(toKey);

            if (fromNode && toNode) {
                fromNode.connections.add(toKey);
                toNode.parentConnections.add(fromKey);
            }
        }
    });

    // Remove starting nodes that merge immediately (two floor-1 nodes going to same floor-2 node)
    const floor1Nodes = Array.from(nodes.entries()).filter(([k, n]) => n.floor === 1);
    const floor2Targets = new Map<string, string[]>();

    floor1Nodes.forEach(([key, node]) => {
        node.connections.forEach(targetKey => {
            if (!floor2Targets.has(targetKey)) {
                floor2Targets.set(targetKey, []);
            }
            floor2Targets.get(targetKey)!.push(key);
        });
    });

    // If multiple floor-1 nodes go to same floor-2 node, remove all but one
    floor2Targets.forEach((sources, target) => {
        if (sources.length > 1) {
            // Keep first, remove rest
            for (let i = 1; i < sources.length; i++) {
                nodes.delete(sources[i]);
            }
        }
    });

    return nodes;
};

// Step 3: Assign room types using bucket system
const assignRoomTypes = (nodes: Map<string, NodeData>, rng?: SeededRandom): Map<string, MapNodeType> => {
    const types: Map<string, MapNodeType> = new Map();

    // Pre-assign fixed floors
    nodes.forEach((node, key) => {
        if (node.floor === 1) {
            types.set(key, STS_MAP.FLOOR_1_TYPE); // All normal fights
        } else if (node.floor === 9) {
            types.set(key, STS_MAP.FLOOR_9_TYPE); // All treasure
        } else if (node.floor === 15) {
            types.set(key, STS_MAP.FLOOR_15_TYPE); // All rest
        }
    });

    // Count untyped nodes
    const untypedKeys = Array.from(nodes.keys()).filter(k => !types.has(k));
    const totalUntyped = untypedKeys.length;

    // Build bucket of room types based on ratios
    const bucket: MapNodeType[] = [];
    const targetCounts = {
        vendor: Math.round(totalUntyped * STS_MAP.RATIOS.vendor / 100),
        retrospective: Math.round(totalUntyped * STS_MAP.RATIOS.retrospective / 100),
        opportunity: Math.round(totalUntyped * STS_MAP.RATIOS.opportunity / 100),
        elite: Math.round(totalUntyped * STS_MAP.RATIOS.elite / 100),
    };

    // Add tokens to bucket
    for (let i = 0; i < targetCounts.vendor; i++) bucket.push('vendor');
    for (let i = 0; i < targetCounts.retrospective; i++) bucket.push('retrospective');
    for (let i = 0; i < targetCounts.opportunity; i++) bucket.push('opportunity');
    for (let i = 0; i < targetCounts.elite; i++) bucket.push('elite');

    // Fill rest with normal fights
    while (bucket.length < totalUntyped) {
        bucket.push('problem');
    }

    // Shuffle bucket
    for (let i = bucket.length - 1; i > 0; i--) {
        const j = rng ? rng.nextInt(0, i) : Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }

    // Assign types to untyped nodes with constraints
    const usedFromBucket: boolean[] = new Array(bucket.length).fill(false);

    // Sort untyped keys by floor for deterministic assignment
    untypedKeys.sort((a, b) => {
        const nodeA = nodes.get(a)!;
        const nodeB = nodes.get(b)!;
        if (nodeA.floor !== nodeB.floor) return nodeA.floor - nodeB.floor;
        return nodeA.column - nodeB.column;
    });

    untypedKeys.forEach(key => {
        const node = nodes.get(key)!;

        // Try each bucket item until one passes constraints
        for (let i = 0; i < bucket.length; i++) {
            if (usedFromBucket[i]) continue;

            const candidateType = bucket[i];
            if (isValidAssignment(candidateType, node, nodes, types)) {
                types.set(key, candidateType);
                usedFromBucket[i] = true;
                break;
            }
        }

        // Fallback: if no valid type found, use normal fight
        if (!types.has(key)) {
            types.set(key, 'problem');
        }
    });

    return types;
};

// Check if assigning a type to a node violates constraints
const isValidAssignment = (
    type: MapNodeType,
    node: NodeData,
    nodes: Map<string, NodeData>,
    assignedTypes: Map<string, MapNodeType>
): boolean => {
    // Rule 1: No elites or rests before floor 6
    if (node.floor < STS_MAP.NO_ELITE_REST_BEFORE_FLOOR) {
        if (type === 'elite' || type === 'retrospective') return false;
    }

    // Rule 2: No rest on floor 14
    if (node.floor === STS_MAP.NO_REST_ON_FLOOR && type === 'retrospective') {
        return false;
    }

    // Rule 3: No consecutive high-impact types (rest/elite/shop) on a path
    if (type === 'elite' || type === 'retrospective' || type === 'vendor') {
        // Check parent nodes
        for (const parentKey of node.parentConnections) {
            const parentType = assignedTypes.get(parentKey);
            if (parentType === type) return false;
        }
    }

    // Rule 4: Children of same parent must differ (for non-basic types)
    if (type === 'elite' || type === 'retrospective' || type === 'vendor' || type === 'opportunity') {
        // Find siblings (other nodes with same parent)
        for (const parentKey of node.parentConnections) {
            const parentNode = nodes.get(parentKey);
            if (!parentNode) continue;

            for (const siblingKey of parentNode.connections) {
                if (siblingKey === `${node.floor}_${node.column}`) continue;
                const siblingType = assignedTypes.get(siblingKey);
                if (siblingType === type) return false;
            }
        }
    }

    return true;
};

// Main map generation function
export const generateMap = (rng?: SeededRandom): MapLayer[] => {
    // Step 1: Build path spines
    const paths = buildPathSpines(rng);

    // Step 2: Create nodes from paths
    const nodeData = buildNodesFromPaths(paths);

    // Step 3: Assign room types
    const nodeTypes = assignRoomTypes(nodeData, rng);

    // Step 4: Convert to MapLayer format
    const layers: MapLayer[] = [];

    for (let floor = 1; floor <= STS_MAP.FLOORS; floor++) {
        const floorNodes: MapNode[] = [];

        nodeData.forEach((data, key) => {
            if (data.floor !== floor) return;

            const node: MapNode = {
                id: `f${floor}_c${data.column}`,
                type: nodeTypes.get(key) || 'problem',
                floor,
                column: data.column,
                connections: Array.from(data.connections).map(k => {
                    const [f, c] = k.split('_').map(Number);
                    return `f${f}_c${c}`;
                }),
                parentConnections: Array.from(data.parentConnections).map(k => {
                    const [f, c] = k.split('_').map(Number);
                    return `f${f}_c${c}`;
                }),
                completed: false,
                accessible: floor === 1
            };

            floorNodes.push(node);
        });

        // Sort by column
        floorNodes.sort((a, b) => a.column - b.column);
        layers.push(floorNodes);
    }

    // Step 5: Add boss floor (floor 16)
    const bossNode: MapNode = {
        id: 'boss',
        type: 'boss',
        floor: STS_MAP.FLOORS + 1,
        column: 3,
        connections: [],
        parentConnections: [],
        completed: false,
        accessible: false
    };

    // Connect all floor 15 nodes to boss
    if (layers[STS_MAP.FLOORS - 1]) {
        layers[STS_MAP.FLOORS - 1].forEach(node => {
            node.connections.push(bossNode.id);
            bossNode.parentConnections.push(node.id);
        });
    }

    layers.push([bossNode]);

    return layers;
};

/**
 * Get connected nodes from current map position for progressive narrative
 * Used to pre-generate MESO narratives for next possible paths
 */
export const getConnectedNodes = (
    map: MapLayer[],
    currentPosition: { floor: number; nodeId: string } | null
): MapNode[] => {
    if (!currentPosition) {
        // At start of map (floor 0), all floor 1 nodes are accessible
        return map[0] || [];
    }

    // Find current node
    const currentFloorIndex = currentPosition.floor - 1;
    const currentLayer = map[currentFloorIndex];
    const currentNode = currentLayer?.find(n => n.id === currentPosition.nodeId);

    if (!currentNode) return [];

    // Get connected nodes on next floor
    const nextFloorIndex = currentPosition.floor;
    const nextLayer = map[nextFloorIndex];

    if (!nextLayer) return [];

    return nextLayer.filter(n => currentNode.connections.includes(n.id));
};

// Encounter Spawning with Variance
export const getEncounterForFloor = (floor: number, rng?: SeededRandom): EnemyData[] => {
    // Floor 1 uses easy pool, floors 2+ use hard pool
    const pool = floor === 1 ? 'easy' : 'hard';
    const templates = ENCOUNTER_TEMPLATES.filter(t => t.pool === pool);

    // Weighted random selection
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    let roll = rng ? rng.next() * totalWeight : Math.random() * totalWeight;

    let selectedTemplate: EncounterTemplate | null = null;
    for (const template of templates) {
        roll -= template.weight;
        if (roll <= 0) {
            selectedTemplate = template;
            break;
        }
    }

    if (!selectedTemplate) selectedTemplate = templates[0];

    // Spawn enemies with variance
    const enemies: EnemyData[] = [];
    selectedTemplate.enemies.forEach(enemyConfig => {
        const count = rng
            ? rng.nextInt(enemyConfig.count[0], enemyConfig.count[1])
            : Math.floor(Math.random() * (enemyConfig.count[1] - enemyConfig.count[0] + 1)) + enemyConfig.count[0];
        const baseEnemy = GAME_DATA.enemies[enemyConfig.enemyId as keyof typeof GAME_DATA.enemies];

        if (baseEnemy) {
            for (let i = 0; i < count; i++) {
                const hpVariance = rng ? rng.nextInt(-2, 2) : Math.floor(Math.random() * 5) - 2;
                enemies.push({
                    ...baseEnemy,
                    id: `${baseEnemy.id}_${Date.now()}_${i}`,
                    hp: Math.max(1, baseEnemy.hp + hpVariance),
                    maxHp: Math.max(1, baseEnemy.maxHp + hpVariance),
                    statuses: { ...baseEnemy.statuses }
                });
            }
        }
    });

    return enemies;
};

// Get Elite Encounter
export const getEliteEncounter = (rng?: SeededRandom): EnemyData[] => {
    const eliteIds = ['scope_creep', 'over_engineer', 'legacy_systems'];
    const eliteId = rng ? rng.pick(eliteIds) : eliteIds[Math.floor(Math.random() * eliteIds.length)];

    if (eliteId === 'over_engineer') {
        const elite = GAME_DATA.enemies.over_engineer;
        return [{
            ...elite,
            id: `${elite.id}_${Date.now()}`,
            statuses: { ...elite.statuses }
        }];
    }

    // Scope Creep
    if (eliteId === 'scope_creep') {
        const elite = GAME_DATA.enemies.scope_creep;
        return [{
            ...elite,
            id: `${elite.id}_${Date.now()}`,
            statuses: { ...elite.statuses }
        }];
    }

    // Legacy Systems (3 sentries)
    return [
        { ...GAME_DATA.enemies.legacy_monolith, id: `legacy_monolith_${Date.now()}_1`, statuses: { ...GAME_DATA.enemies.legacy_monolith.statuses } },
        { ...GAME_DATA.enemies.legacy_hack, id: `legacy_hack_${Date.now()}_2`, statuses: { ...GAME_DATA.enemies.legacy_hack.statuses } },
        { ...GAME_DATA.enemies.legacy_patch, id: `legacy_patch_${Date.now()}_3`, statuses: { ...GAME_DATA.enemies.legacy_patch.statuses } }
    ];
};

// Get Boss Encounter (random from pool)
export const getBossEncounter = (rng?: SeededRandom): EnemyData[] => {
    const bossIds = ['boss_the_pivot', 'boss_burn_rate', 'boss_the_monolith'];
    const bossId = rng ? rng.pick(bossIds) : bossIds[Math.floor(Math.random() * bossIds.length)];
    const boss = GAME_DATA.enemies[bossId as keyof typeof GAME_DATA.enemies];

    return [{
        ...boss,
        id: `${boss.id}_${Date.now()}`,
        statuses: { ...boss.statuses }
    }];
};

// --- Game Logic ---

// --- AI Logic ---

const getNextIntent = (enemy: EnemyData, turn: number, playerHp: number): EnemyIntent => {
    const roll = Math.random() * 100;

    // --- COMMON ---
    if (enemy.id.startsWith('fanboy')) {
        if (turn === 1) return { type: 'buff', value: 3, icon: 'buff', description: "Build Hype" };
        const dmg = 6 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Overwhelm" };
    }

    if (enemy.id.startsWith('spaghetti_code')) {
        if (roll < 25) return { type: 'buff', value: 3, icon: 'buff', description: "Watch & Learn" };
        if (roll < 55) return { type: 'attack', value: 7, icon: 'attack', description: "Quick Clone" };
        return { type: 'attack', value: 11, icon: 'attack', description: "Steal Idea" };
    }

    if (enemy.id.startsWith('critical_bug')) {
        if (roll < 25) return { type: 'buff', value: 3, icon: 'buff', description: "Grow (Severity)" };
        const dmg = 6 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Critique" };
    }

    if (enemy.id.startsWith('minor_bug')) {
        if (roll < 25) return { type: 'debuff', value: 2, icon: 'debuff', description: "Doubt" };
        const dmg = 5 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Reject" };
    }

    if (enemy.id.startsWith('quick_hack') || enemy.id.startsWith('hotfix')) {
        if (roll < 50) return { type: 'attack', value: 3, icon: 'attack', description: "Quick Commit" };
        return { type: 'debuff', value: 1, icon: 'debuff', description: "Delay (Drained)" };
    }

    if (enemy.id.startsWith('tech_debt') || enemy.id.startsWith('bad_merge')) {
        if (roll < 30) return { type: 'debuff', value: 1, icon: 'debuff', description: "Add Complexity" };
        return { type: 'attack', value: 7, icon: 'attack', description: "Pile On" };
    }

    if (enemy.id.startsWith('legacy_module') || enemy.id.startsWith('merge_conflict')) {
        if (roll < 30) return { type: 'debuff', value: 2, icon: 'debuff', description: "Add Complexity" };
        return { type: 'attack', value: 16, icon: 'attack', description: "Veto" };
    }

    // Micromanager (Blue Slaver) - Pile On 13, Nitpick (7 + Weak)
    if (enemy.id.startsWith('micromanager')) {
        if (roll < 40) {
            const dmg = 7 + enemy.statuses.strength;
            return { type: 'attack', value: dmg, icon: 'attack', description: "Nitpick" };
        }
        const dmg = 13 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Pile On" };
    }

    // Feature Pusher (Dreamer) - Demand More 14, Push Hard (9 + Vuln), Distract
    if (enemy.id.startsWith('feature_pusher')) {
        if (turn === 1) return { type: 'debuff', value: 1, icon: 'debuff', description: "Distract" };
        if (roll < 45) {
            const dmg = 9 + enemy.statuses.strength;
            return { type: 'attack', value: dmg, icon: 'attack', description: "Push Hard" };
        }
        const dmg = 14 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Demand More" };
    }

    // Headhunter (Poacher) - Poach 10-12, Aggressive Bid 12, Exit with Hire
    if (enemy.id.startsWith('headhunter')) {
        if (turn >= 3 && roll < 15) return { type: 'buff', value: 0, icon: 'buff', description: "Exit with Hire" };
        if (roll < 50) {
            const dmg = 10 + enemy.statuses.strength;
            return { type: 'attack', value: dmg, icon: 'attack', description: "Poach" };
        }
        const dmg = 12 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Aggressive Bid" };
    }

    // Memory Leak (Energy Vampire) - Drain 6, Feed (Strength)
    if (enemy.id.startsWith('memory_leak')) {
        if (roll < 40) return { type: 'buff', value: 3, icon: 'buff', description: "Feed" };
        const dmg = 6 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Drain" };
    }

    // --- ELITES ---
    // Scope Creep - Escalate on skills, Derail 6+Vuln, Expand 14
    if (enemy.id.startsWith('scope_creep')) {
        if (turn === 1) return { type: 'buff', value: 2, icon: 'buff', description: "Escalate" };
        // Turn 2 is guaranteed Derail (debuff + attack), then alternate debuff/attack
        if (turn % 2 === 0) {
            const dmg = 6 + enemy.statuses.strength;
            return { type: 'debuff', value: dmg, icon: 'attack', description: "Derail" };
        }
        const dmg = 12 + enemy.statuses.strength;
        return { type: 'attack', value: dmg, icon: 'attack', description: "Expand" };
    }

    if (enemy.id.startsWith('over_engineer')) {
        if (enemy.statuses.asleep > 0) {
            return { type: 'debuff', value: 1, icon: 'debuff', description: "Stress Out" };
        }
        if (turn % 3 === 0) return { type: 'debuff', value: 1, icon: 'debuff', description: "Stress Out" };
        return { type: 'attack', value: 18, icon: 'attack', description: "Close In" };
    }

    if (enemy.id.startsWith('legacy_monolith') || enemy.id.startsWith('legacy_hack') || enemy.id.startsWith('legacy_patch')) {
        if (turn % 2 === 0) return { type: 'attack', value: 9, icon: 'attack', description: "Block Path" };
        return { type: 'debuff', value: 2, icon: 'debuff', description: "Pile Work" };
    }

    // --- BOSSES ---
    // The Pivot (Guardian) - Mode Shift between Offensive/Defensive
    if (enemy.id.startsWith('boss_the_pivot')) {
        // Track mode using asleep status as mode flag (0=offensive, 1+=defensive)
        const isDefensive = enemy.statuses.asleep > 0;

        if (isDefensive) {
            // Defensive Mode: Momentum (9), then Commit (8x2) to exit
            if (enemy.statuses.asleep >= 3) {
                // Commit exits defensive mode
                return { type: 'attack', value: 16, icon: 'attack', description: "Commit (x2)" };
            }
            return { type: 'attack', value: 9, icon: 'attack', description: "Momentum" };
        } else {
            // Offensive Mode: Evaluate, Big Shift, Cut Off, Chaos
            const cycle = turn % 4;
            if (cycle === 1) return { type: 'buff', value: 9, icon: 'buff', description: "Evaluate" };
            if (cycle === 2) return { type: 'attack', value: 32, icon: 'attack', description: "Big Shift" };
            if (cycle === 3) return { type: 'debuff', value: 2, icon: 'debuff', description: "Cut Off" };
            return { type: 'attack', value: 20, icon: 'attack', description: "Chaos (x4)" };
        }
    }

    if (enemy.id.startsWith('boss_burn_rate')) {
        if (turn === 1) return { type: 'attack', value: 0, icon: 'attack', description: "Divide Runway (x6)" };
        const cycle = (turn - 1) % 5;
        if (cycle === 0) return { type: 'attack', value: 6, icon: 'attack', description: "Burn Cash" };
        if (cycle === 1) return { type: 'debuff', value: 1, icon: 'debuff', description: "Burn" };
        if (cycle === 2) return { type: 'attack', value: 6, icon: 'attack', description: "Burn Cash" };
        if (cycle === 3) return { type: 'debuff', value: 2, icon: 'debuff', description: "Burn" };
        return { type: 'attack', value: 2, icon: 'attack', description: "Cash Crisis (x6)" };
    }

    if (enemy.id.startsWith('boss_the_monolith')) {
        const cycle = turn % 3;
        if (cycle === 1) return { type: 'debuff', value: 3, icon: 'debuff', description: "Baggage" };
        if (cycle === 2) return { type: 'buff', value: 0, icon: 'buff', description: "Prepare" };
        return { type: 'attack', value: 35, icon: 'attack', description: "Collapse" };
    }

    return { type: 'attack', value: 5, icon: 'attack', description: "Attack" };
};

export const resolveEndTurn = (prev: GameState): GameState => {
    getGlobalLogger().log('TURN_END', 'Player Turn Ended');

    let nextPlayerStatuses = { ...prev.playerStats.statuses };
    let nextMitigation = prev.playerStats.mitigation;
    let endTurnMessage = 'Enemy is executing intent...';
    const triggerJuggernaut = (blockGained: number, enemies: EnemyData[]) => {
        if (blockGained <= 0 || nextPlayerStatuses.juggernaut <= 0) return;
        const live = enemies.filter(e => e.hp > 0);
        if (live.length === 0) return;
        const target = live[Math.floor(Math.random() * live.length)];
        let dmg = nextPlayerStatuses.juggernaut;
        if (target.statuses.vulnerable > 0) dmg = Math.floor(dmg * getVulnerableMultiplier(prev.relics));
        target.hp = Math.max(0, target.hp - dmg);
        endTurnMessage += ` Juggernaut hit ${target.name} for ${dmg}.`;
    };

    // Decrement player statuses
    if (nextPlayerStatuses.vulnerable > 0) {
        nextPlayerStatuses.vulnerable--;
        if (nextPlayerStatuses.vulnerable === 0) getGlobalLogger().log('STATUS_EXPIRED', 'Exposed expired');
    }
    if (nextPlayerStatuses.weak > 0) {
        nextPlayerStatuses.weak--;
        if (nextPlayerStatuses.weak === 0) getGlobalLogger().log('STATUS_EXPIRED', 'Drained expired');
    }
    if (nextPlayerStatuses.frail > 0) {
        nextPlayerStatuses.frail--;
        if (nextPlayerStatuses.frail === 0) getGlobalLogger().log('STATUS_EXPIRED', 'Frail expired');
    }
    // Clear No Draw
    if (nextPlayerStatuses.noDraw > 0) {
        getGlobalLogger().log('STATUS_CLEARED', 'NoDraw cleared');
        nextPlayerStatuses.noDraw = 0;
    }

    // Apply Metallicize
    if (nextPlayerStatuses.metallicize > 0) {
        const blockGain = nextPlayerStatuses.metallicize;
        nextMitigation += blockGain;
        triggerJuggernaut(blockGain, prev.enemies);
        endTurnMessage += ` Metallicize: +${blockGain} Mitigation.`;
        getGlobalLogger().log('BLOCK_GAINED', `Metallicize triggered`, { amount: nextPlayerStatuses.metallicize });
    }

    const cardsToDiscard: CardData[] = [];
    const cardsToExhaust: CardData[] = [];
    const cardsToRetain: CardData[] = [];
    let currentHp = prev.playerStats.hp;
    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));

    prev.hand.forEach(card => {
        // Debug logging for Burnout
        if (card.name === 'Burnout' || card.id?.includes('burnout')) {
            console.log('[DEBUG Burnout] Card in hand:', card.name, 'id:', card.id, 'effects:', card.effects);
        }

        // Burnout Logic
        if (card.effects?.some(e => e.type === 'lose_hp_turn_end')) {
            const burnDamage = card.effects.find(e => e.type === 'lose_hp_turn_end')?.value || 0;
            currentHp = Math.max(0, currentHp - burnDamage);
            endTurnMessage += ` Burnout: -${burnDamage} Runway.`;
            getGlobalLogger().log('CARD_EFFECT_END_TURN', `Burnout from ${card.name} dealt ${burnDamage} Burn.`, { cardName: card.name, damage: burnDamage });

            // Antifragile Trigger
            if (nextPlayerStatuses.antifragile > 0) {
                nextPlayerStatuses.strength += nextPlayerStatuses.antifragile;
                endTurnMessage += ` (Antifragile: +${nextPlayerStatuses.antifragile} Execution Power)`;
                getGlobalLogger().log('STATUS_EFFECT', `Antifragile triggered, gained ${nextPlayerStatuses.antifragile} Execution Power.`);
            }
        }

        if (card.ethereal) {
            cardsToExhaust.push(card);
            getGlobalLogger().log('CARD_EXHAUSTED', `${card.name} archived due to Fleeting.`);
        }
        else if (card.retain) {
            cardsToRetain.push(card);
            getGlobalLogger().log('CARD_RETAINED', `${card.name} retained.`);
        }
        else {
            cardsToDiscard.push(card);
            getGlobalLogger().log('CARD_DISCARDED', `${card.name} discarded.`);
        }
    });

    if (cardsToExhaust.length > 0) {
        endTurnMessage += ` ${cardsToExhaust.length} card(s) faded away.`;
        if (nextPlayerStatuses.feelNoPain > 0) {
            nextMitigation += (nextPlayerStatuses.feelNoPain * cardsToExhaust.length);
            triggerJuggernaut(nextPlayerStatuses.feelNoPain * cardsToExhaust.length, newEnemies);
            getGlobalLogger().log('STATUS_EFFECT', `Feel No Pain triggered, gained ${nextPlayerStatuses.feelNoPain * cardsToExhaust.length} block.`);
        }
    }
    if (cardsToRetain.length > 0) endTurnMessage += ` Retained ${cardsToRetain.length} card(s).`;

    // Combust: end of turn HP loss and AoE damage
    if (nextPlayerStatuses.combust > 0) {
        const hpLoss = nextPlayerStatuses.combust;
        const combustDamage = nextPlayerStatuses.combust * 5;
        currentHp = Math.max(0, currentHp - hpLoss);
        newEnemies.forEach(enemy => {
            let dmg = combustDamage;
            if (enemy.statuses.vulnerable > 0) dmg = Math.floor(dmg * getVulnerableMultiplier(prev.relics));
            if (enemy.mitigation > 0) {
                const blocked = Math.min(enemy.mitigation, dmg);
                enemy.mitigation -= blocked;
                dmg -= blocked;
            }
            enemy.hp = Math.max(0, enemy.hp - dmg);
        });
        endTurnMessage += ` Combust hit all enemies for ${combustDamage}, -${hpLoss} Runway.`;
    }

    // Temporary/turn-based buffs cleanup
    if (nextPlayerStatuses.tempStrength > 0) {
        nextPlayerStatuses.strength -= nextPlayerStatuses.tempStrength;
        nextPlayerStatuses.tempStrength = 0;
        endTurnMessage += ` Lost temporary Velocity.`;
    }
    nextPlayerStatuses.rage = 0;
    nextPlayerStatuses.doubleTap = 0;

    let nextStatus: GameState['status'] = currentHp <= 0 ? 'GAME_OVER' : 'ENEMY_TURN';
    if (newEnemies.every(e => e.hp <= 0)) {
        nextStatus = 'VICTORY';
        endTurnMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
    }

    return {
        ...prev,
        playerStats: { ...prev.playerStats, hp: currentHp, statuses: nextPlayerStatuses, mitigation: nextMitigation },
        discardPile: [...prev.discardPile, ...cardsToDiscard],
        exhaustPile: [...prev.exhaustPile, ...cardsToExhaust],
        hand: cardsToRetain,
        enemies: newEnemies,
        status: nextStatus,
        message: endTurnMessage
    };
};

export const resolveEnemyTurn = (prev: GameState, rng?: SeededRandom): GameState => {
    getGlobalLogger().log('TURN_START', `Enemy Turn Started`);

    let newPlayerHp = prev.playerStats.hp;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newMessage = '';
    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    const enemiesToSpawn: EnemyData[] = [];
    let nextDrawPile = [...prev.drawPile];
    let nextDiscardPile = [...prev.discardPile];
    let bonusDrawFromHpLoss = 0;

    newEnemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const intent = enemy.currentIntent;
        const isHybridAttack = intent.description.includes('Derail');

        getGlobalLogger().log('ENEMY_ACTION', `${enemy.name} executing ${intent.type}`, { enemyName: enemy.name, intentType: intent.type, intentDescription: intent.description });

        // Handle Slime Boss Split regardless of intent type (can be set to 'unknown' when triggered by thorns)
        if (intent.description === 'Splitting...' && enemy.id.startsWith('boss_the_monolith')) {
            const currentBossHp = Math.max(1, enemy.hp);

            // Remove the main boss
            enemy.hp = 0;

            // Spawn the two medium slimes (Acid L / Spike L)
            const acidSlimeL = { ...GAME_DATA.enemies.legacy_module, id: `legacy_module_${Date.now()}_A`, hp: currentBossHp, maxHp: currentBossHp };
            const spikeSlimeL = { ...GAME_DATA.enemies.merge_conflict, id: `merge_conflict_${Date.now()}_B`, hp: currentBossHp, maxHp: currentBossHp };

            enemiesToSpawn.push(acidSlimeL, spikeSlimeL);
            newMessage += ` ${enemy.name} Split into two!`;
            getGlobalLogger().log('BOSS_MECHANIC', `The Goliath split into ${acidSlimeL.name} and ${spikeSlimeL.name}.`);
            return;
        }

        if (intent.type === 'attack' || isHybridAttack) {
            let attackValue = intent.value;
            if (enemy.id.startsWith('boss_burn_rate') && intent.description.includes('Divide Runway')) {
                const hits = 6;
                const dmgPerHit = Math.floor(newPlayerHp / 12) + 1;
                attackValue = dmgPerHit * hits;
                newMessage += ` Divide Runway dealt ${hits}x${dmgPerHit} damage!`;
                getGlobalLogger().log('ENEMY_ATTACK_SPECIAL', `Boss Burn Rate Divide Runway: ${hits} hits, ${dmgPerHit} per hit.`);
            }

            const damage = calculateDamage(attackValue, enemy.statuses, newPlayerStatuses);
            let unblockedDamage = damage;

            if (newPlayerStatuses.thorns > 0) {
                const thornsDamage = newPlayerStatuses.thorns;
                enemy.hp = Math.max(0, enemy.hp - thornsDamage);
                newMessage += ` Thorns dealt ${thornsDamage} to ${enemy.name}.`;
                getGlobalLogger().log('DAMAGE_DEALT', `Thorns dealt ${thornsDamage} to ${enemy.name}.`);

                // Check for Split Trigger (Thorns Damage)
                if (enemy.id.startsWith('boss_the_monolith') && enemy.hp <= enemy.maxHp / 2 && enemy.currentIntent.type !== 'unknown') {
                    enemy.currentIntent = {
                        type: 'unknown',
                        value: 0,
                        icon: 'unknown',
                        description: 'Splitting...'
                    };
                    newMessage += ` ${enemy.name} is preparing to split!`;
                    getGlobalLogger().log('BOSS_MECHANIC', `${enemy.name} triggered Split from Thorns!`);
                }
            }

            if (newMitigation > 0) {
                const blocked = Math.min(newMitigation, unblockedDamage);
                newMitigation -= blocked;
                unblockedDamage -= blocked;
                getGlobalLogger().log('DAMAGE_BLOCKED', `Blocked ${blocked} damage from ${enemy.name}.`);
            }
            newPlayerHp -= unblockedDamage;
            if (unblockedDamage > 0) {
                newMessage += ` ${enemy.name} caused ${unblockedDamage} Burn.`;
                getGlobalLogger().log('DAMAGE_TAKEN', `${enemy.name} hit player for ${unblockedDamage} unblocked Burn. Player HP: ${newPlayerHp}`);

                // Antifragile & Data-Driven relics: On HP loss effects
                const hpLossEffects = applyOnHpLossRelics(prev.relics, unblockedDamage);
                if (hpLossEffects.blockNextTurn > 0) {
                    // Store pending block in antifragile status (will be applied at turn start)
                    newPlayerStatuses.antifragile += hpLossEffects.blockNextTurn;
                    newMessage += ` ${hpLossEffects.messages.join(' ')}`;
                }
                if (hpLossEffects.drawCards > 0) {
                    // Data-Driven: queue extra draws for next player draw step.
                    // This avoids losing cards by drawing into an unseen zone during enemy turn.
                    bonusDrawFromHpLoss += hpLossEffects.drawCards;
                    newMessage += ` ${hpLossEffects.messages.join(' ')}`;
                }

                // Thick Skin-style relics: reflect damage to current attacker.
                const onDamagedEffects = applyOnDamagedRelics(prev.relics, unblockedDamage, enemy.id);
                if (onDamagedEffects.thornsDamage > 0) {
                    enemy.hp = Math.max(0, enemy.hp - onDamagedEffects.thornsDamage);
                    newMessage += ` ${enemy.name} took ${onDamagedEffects.thornsDamage} reflected damage.`;
                    if (onDamagedEffects.messages.length > 0) {
                        newMessage += ` ${onDamagedEffects.messages.join(' ')}`;
                    }
                }
            } else {
                newMessage += ` Blocked ${enemy.name}.`;
            }

            // Handle combo attacks that deal damage + apply status
            if (intent.description.includes('Nitpick') || intent.description.includes('Doubt')) {
                newPlayerStatuses.weak += 2;
                newMessage += ` Applied 2 Drained.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied 2 Drained.`);
            }
            if (intent.description.includes('Push Hard')) {
                newPlayerStatuses.vulnerable += 2;
                newMessage += ` Applied 2 Exposed.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied 2 Exposed.`);
            }
            if (intent.description.includes('Quick Clone')) {
                enemy.mitigation += 5;
                newMessage += ` ${enemy.name} cloned! (+5 Mitigation)`;
                getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} gained 5 Mitigation.`);
            }
            if (intent.description.includes('Derail')) {
                newPlayerStatuses.vulnerable += 2;
                newMessage += ` Applied 2 Exposed.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied 2 Exposed.`);
            }
            // Chaos (x4): 5*4 = 20 damage total
            if (intent.description.includes('Chaos')) {
                // Multi-hit already factored into damage value
                newMessage += ` (x4 hits)`;
                getGlobalLogger().log('ENEMY_ATTACK_SPECIAL', `Chaos: 4 hits.`);
            }
            // Cash Crisis (x6): 2*6 = 12 damage total
            if (intent.description.includes('Cash Crisis')) {
                newMessage += ` (x6 hits)`;
                getGlobalLogger().log('ENEMY_ATTACK_SPECIAL', `Cash Crisis: 6 hits.`);
            }
            // Commit: Exit defensive mode for The Pivot
            if (intent.description.includes('Commit') && enemy.id.startsWith('boss_the_pivot')) {
                enemy.statuses.asleep = 0; // Exit defensive mode
                enemy.statuses.thorns = 0; // Remove Sharp Hide
                newMessage += ` Committed to new direction!`;
                getGlobalLogger().log('BOSS_MECHANIC', `The Pivot committed and exited Defensive Mode.`);
            }

            // Cut Off: Applies both Vuln and Weak
            if (intent.description.includes('Cut Off')) {
                newPlayerStatuses.vulnerable += 2;
                newPlayerStatuses.weak += 2;
                newMessage += ` Applied 2 Exposed + 2 Drained.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied 2 Exposed and 2 Drained.`);
            }
        } else if (intent.type === 'buff') {
            if (intent.description.includes('Build Hype') || intent.description.includes('Feed') || intent.description.includes('Raise Concerns')) {
                enemy.statuses.strength += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Execution Power.`;
                getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} gained ${intent.value} Execution Power.`);
            } else if (intent.description.includes('Watch & Learn')) {
                // Copycat Watch & Learn: +3 Str, +6 Block
                enemy.statuses.strength += 3;
                enemy.mitigation += 6;
                newMessage += ` ${enemy.name} is learning! (+3 Pwr, +6 Mitigation)`;
                getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} watched and learned (+3 Power, +6 Mitigation).`);
            } else if (intent.description.includes('Evaluate')) {
                enemy.mitigation += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Mitigation.`;
                getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} gained ${intent.value} Mitigation.`);
            } else if (intent.description.includes('Exit with Hire')) {
                enemy.hp = 0;
                enemy.maxHp = 0;
                newMessage += ` ${enemy.name} left with your talent!`;
                getGlobalLogger().log('ENEMY_ACTION_SPECIAL', `${enemy.name} escaped with hire.`);
            } else if (intent.description.includes('Split') && enemy.id.startsWith('boss_the_monolith')) {
                const acidL = { ...GAME_DATA.enemies.legacy_module, id: `legacy_module_split_${Date.now()}_acid`, hp: 70, maxHp: 70 };
                const spikeL = { ...GAME_DATA.enemies.merge_conflict, id: `merge_conflict_split_${Date.now()}_spike`, hp: 70, maxHp: 70 };
                enemiesToSpawn.push(acidL, spikeL);
                enemy.hp = 0;
                newMessage += ` ${enemy.name} Split into two!`;
                getGlobalLogger().log('BOSS_MECHANIC', `${enemy.name} split into two new enemies.`);
            } else if (intent.description.includes('Escalate')) {
                // Scope Creep Escalate - Enrage is tracked, triggered when player plays skills
                newMessage += ` ${enemy.name} is escalating! (+2 Pwr per skill)`;
                getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} is escalating.`);
            }
        } else if (intent.type === 'debuff') {
            if (intent.description.includes('Distract')) {
                // Dreamer Distract - prevents playing attacks for 1 turn
                newMessage += ` ${enemy.name} distracted you! (Cannot play attacks this turn)`;
                getGlobalLogger().log('STATUS_APPLIED', `Player distracted.`);
            } else if (enemy.id.startsWith('legacy_') && intent.description.includes('Pile Work')) {
                const bugCard = GAME_DATA.cards.card_bug;
                nextDrawPile.push({ ...bugCard, id: `card_bug_${Date.now()}_1` }, { ...bugCard, id: `card_bug_${Date.now()}_2` });
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} piled work onto your roadmap!`;
                getGlobalLogger().log('CARD_EFFECT_ENEMY', `Enemy piled 2 Bugs into player's draw pile.`);
            } else if (intent.description.includes('Baggage')) {
                const slime = { ...GAME_DATA.cards.status_scope_creep, id: `status_scope_creep_${Date.now()}` };
                nextDrawPile.push(slime);
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} added baggage to your roadmap!`;
                getGlobalLogger().log('CARD_EFFECT_ENEMY', `Enemy added legacy baggage.`);
            } else if (intent.description.includes('Weak')) {
                newPlayerStatuses.weak += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Drained.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied ${intent.value} Drained.`);
            } else if (intent.description.includes('Vulnerable')) {
                newPlayerStatuses.vulnerable += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Exposed.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied ${intent.value} Exposed.`);
            } else if (intent.description.includes('Frail')) {
                newPlayerStatuses.frail += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Frail.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied ${intent.value} Frail.`);
            } else if (intent.description.includes('Stress Out')) {
                // Deadline Stress Out: -1 Strength (can go negative)
                newPlayerStatuses.strength -= 1;
                getGlobalLogger().log('STATUS_APPLIED', `Deadline stress reduced 1 Execution Power.`);
            } else {
                // Default fallback: Apply Weak if no specific debuff keyword matched
                // This handles intents like "Spread Rumors", "Add Complexity", "Delay", "Discourage", etc.
                newPlayerStatuses.weak += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Drained.`;
                getGlobalLogger().log('STATUS_APPLIED', `Enemy applied ${intent.value} Drained (fallback).`);
            }
        }

        // Decrement enemy statuses
        if (enemy.statuses.vulnerable > 0) {
            enemy.statuses.vulnerable--;
            if (enemy.statuses.vulnerable === 0) getGlobalLogger().log('STATUS_EXPIRED', `${enemy.name} Exposed expired.`);
        }
        if (enemy.statuses.weak > 0) {
            enemy.statuses.weak--;
            if (enemy.statuses.weak === 0) getGlobalLogger().log('STATUS_EXPIRED', `${enemy.name} Drained expired.`);
        }
        if (enemy.statuses.growth > 0) {
            enemy.statuses.strength += enemy.statuses.growth;
            getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} gained ${enemy.statuses.growth} Execution Power from Momentum.`);
        }

        // Reset block then apply Metallicize at end of enemy turn
        enemy.mitigation = 0;
        if (enemy.statuses.metallicize > 0) {
            enemy.mitigation += enemy.statuses.metallicize;
            newMessage += ` ${enemy.name} hardened (+${enemy.statuses.metallicize} Auto-Mitigation).`;
            getGlobalLogger().log('ENEMY_BUFF', `${enemy.name} gained ${enemy.statuses.metallicize} Mitigation from Auto-Mitigation.`);
        }
    });

    if (enemiesToSpawn.length > 0) newEnemies = [...newEnemies, ...enemiesToSpawn];

    let newStatus: GameState['status'] = 'PLAYING';
    if (newPlayerHp <= 0) {
        newStatus = 'GAME_OVER';
        newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
        getGlobalLogger().log('GAME_OVER', 'Player HP reached 0.');
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;
    let newRelics = prev.relics.map(relic => ({ ...relic }));

    if (newEnemies.every(e => e.hp <= 0) && newStatus !== 'GAME_OVER') {
        const isBossVictory = newEnemies.some(e => e.type === 'boss');
        const isEliteVictory = !isBossVictory && newEnemies.some(e => e.type === 'elite');

        newStatus = 'VICTORY';
        newMessage = "PROBLEM SOLVED.";
        getGlobalLogger().log('COMBAT_VICTORY', 'All enemies defeated.');
        newEnemies.forEach(enemyData => {
            if (enemyData.maxHp === 0) return;
            if (enemyData.rewards) {
                const { min, max } = enemyData.rewards.capital;
                const capitalGained = Math.floor(Math.random() * (max - min + 1)) + min;
                earnedCapital += capitalGained;
                getGlobalLogger().log('REWARD_CAPITAL', `Gained ${capitalGained} capital from ${enemyData.name}.`);
            } else {
                earnedCapital += 15;
                getGlobalLogger().log('REWARD_CAPITAL', `Gained 15 capital from ${enemyData.name} (default).`);
            }
        });

        if (isEliteVictory) {
            earnedRelic = getEliteRelic(prev.relics.map(r => r.id)) || undefined;
            if (earnedRelic) {
                newMessage += ` Found Relic: ${earnedRelic.name}!`;
                getGlobalLogger().log('REWARD_RELIC', `Found relic: ${earnedRelic.name}.`);
            }
        }

        newMessage += ` Earned $${earnedCapital}k Capital.`;
    }

    const nextTurn = prev.turn + 1;
    newEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
            enemy.currentIntent = getNextIntent(enemy, nextTurn, newPlayerHp);
            getGlobalLogger().log('ENEMY_INTENT_SET', `${enemy.name} intent set to ${enemy.currentIntent.type}.`);
        }
    });

    let nextBandwidth = getTurnStartBandwidth(prev.relics);
    if (newPlayerStatuses.berserk > 0) {
        nextBandwidth += newPlayerStatuses.berserk;
        newMessage += ` Hypergrowth: +${newPlayerStatuses.berserk} Bandwidth.`;
    }

    let bonusDraw = bonusDrawFromHpLoss;
    if (newPlayerStatuses.brutality > 0) {
        newPlayerHp = Math.max(0, newPlayerHp - newPlayerStatuses.brutality);
        bonusDraw += newPlayerStatuses.brutality;
        newMessage += ` Brutality: -${newPlayerStatuses.brutality} Runway, draw bonus ready.`;
        if (newPlayerHp <= 0) {
            newStatus = 'GAME_OVER';
            newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
        }
    }

    // Apply Antifragile pending block (Self-Forming Clay) from previous turn damage
    let pendingBlock = 0;
    if (newPlayerStatuses.antifragile > 0) {
        pendingBlock = newPlayerStatuses.antifragile;
        newPlayerStatuses.antifragile = 0; // Reset after applying
        newMessage += ` Antifragile: +${pendingBlock} Buffer!`;
        getGlobalLogger().log('RELIC_EFFECT', `Antifragile granted ${pendingBlock} Block at turn start.`);
    }

    const carryMitigation = newPlayerStatuses.barricade > 0 ? newMitigation : 0;

    let nextPlayerStats = {
        ...prev.playerStats,
        hp: Math.max(0, newPlayerHp),
        mitigation: carryMitigation + pendingBlock,
        bandwidth: nextBandwidth,
        statuses: { ...newPlayerStatuses, thorns: 0 }
    };

    // Market Dominance (Brimstone): +2 Strength at turn start, enemies +1
    const marketDominance = applyMarketDominanceRelics(prev.relics, nextPlayerStats, newEnemies);
    if (marketDominance.messages.length > 0) {
        nextPlayerStats = marketDominance.stats;
        newEnemies = marketDominance.enemies;
        newMessage += ` ${marketDominance.messages.join(' ')}`;
    }

    if (newStatus === 'VICTORY') {
        // Don't auto-apply gold - player will claim it from reward screen
        // nextPlayerStats.capital += earnedCapital;  // REMOVED - now handled in App.tsx
        const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextPlayerStats, newRelics);
        nextPlayerStats = afterRelicStats;
        if (relicMsg) newMessage += ` ${relicMsg}`;
    }

    // Generate card rewards for victory
    const isBossVictory = newStatus === 'VICTORY' && newEnemies.some(e => e.type === 'boss');
    const cardRewards = newStatus === 'VICTORY'
        ? getRandomRewardCards(3, rng, isBossVictory ? 'rare' : undefined)
        : [];

    // Check if any enemy gives card rewards
    const shouldGetCardReward = newStatus === 'VICTORY' && newEnemies.some(e => e.rewards?.card_reward !== false);

    // Check for potion drop on victory
    let pendingPotionReward: typeof prev.pendingPotionReward = undefined;
    let newPotionDropChance = prev.potionDropChance;

    if (newStatus === 'VICTORY') {
        const potionDropResult = checkPotionDrop(newPotionDropChance);
        newPotionDropChance = potionDropResult.newChance;

        if (potionDropResult.dropped && canAcquirePotion(prev.potions)) {
            pendingPotionReward = generateRandomPotion('cto');
            getGlobalLogger().log('POTION_DROP', `Combat dropped "${pendingPotionReward.name}"!`);
        } else if (potionDropResult.dropped) {
            getGlobalLogger().log('POTION_DROP', 'Potion dropped but slots full - skipped.');
        } else {
            getGlobalLogger().log('POTION_DROP', `No potion drop (chance now ${newPotionDropChance}%)`);
        }
    }

    let nextState = {
        ...prev,
        playerStats: nextPlayerStats,
        relics: newRelics,
        enemies: newEnemies,
        drawPile: nextDrawPile,
        discardPile: nextDiscardPile,
        turn: nextTurn,
        status: newStatus,
        message: newMessage,
        potionDropChance: newPotionDropChance,
        pendingPotionReward: pendingPotionReward,
        lastVictoryReward: newStatus === 'VICTORY' ? {
            capital: earnedCapital,
            cardRewards: shouldGetCardReward ? cardRewards : [],
            relic: earnedRelic,
            goldCollected: false,
            cardCollected: false,
            relicCollected: false
        } : undefined
    };

    if (newStatus === 'PLAYING') {
        const drawTotal = 5 + bonusDraw;
        const { drawn, newDraw, newDiscard } = drawCards(nextDrawPile, nextDiscardPile, drawTotal);

        const processed = processDrawnCards(drawn, prev.hand, newDiscard, newDraw, nextPlayerStats, newMessage);

        // Fire Breathing trigger on drawn status cards
        if (nextPlayerStats.statuses.fireBreathing > 0) {
            const statusDrawn = processed.drawnCards.filter(c => c.type === 'status');
            if (statusDrawn.length > 0) {
                const baseDmg = nextPlayerStats.statuses.fireBreathing;
                newEnemies.forEach(enemy => {
                    let dmg = baseDmg * statusDrawn.length;
                    if (enemy.statuses.vulnerable > 0) dmg = Math.floor(dmg * getVulnerableMultiplier(prev.relics));
                    if (enemy.mitigation > 0) {
                        const blocked = Math.min(enemy.mitigation, dmg);
                        enemy.mitigation -= blocked;
                        dmg -= blocked;
                    }
                    enemy.hp = Math.max(0, enemy.hp - dmg);
                });
            }
        }

        nextState.hand = processed.hand;
        nextState.drawPile = processed.drawPile;
        nextState.discardPile = processed.discard;
        nextState.message = processed.message;
        nextState.playerStats = processed.stats;
        nextState.enemies = newEnemies;
    }

    return nextState;
};

// Feature flag branch: new ActionQueue-based resolver vs legacy inline implementation
export const resolveCardEffect = (prev: GameState, card: CardData, target: 'enemy' | 'self', targetEnemyId?: string, rng?: SeededRandom): GameState => {
    const costPaid = card.cost === -1 ? prev.playerStats.bandwidth : card.cost;

    if (prev.playerStats.bandwidth < costPaid) {
        getGlobalLogger().warn('CARD_PLAY_FAILED', `Not enough Bandwidth to play ${card.name}. Required: ${costPaid}, Available: ${prev.playerStats.bandwidth}`);
        return { ...prev, message: "Not enough Bandwidth to deploy component." };
    }

    const unsupportedEffects = (card.effects || []).filter(effect => !isEffectTypeSupported(effect));
    const shouldUseNewEngine = USE_NEW_CARD_RESOLVER && unsupportedEffects.length === 0;

    const countAliveEnemies = (enemies: EnemyData[]): number => enemies.filter(e => e.hp > 0).length;

    const applyEnemyDeathRelicEffects = (state: GameState, defeatedEnemies: number): GameState => {
        if (defeatedEnemies <= 0) return state;

        let updatedStats = { ...state.playerStats, statuses: { ...state.playerStats.statuses } };
        let totalDraw = 0;
        const messages: string[] = [];

        for (let i = 0; i < defeatedEnemies; i++) {
            const trigger = applyOnEnemyDeathRelics(state.relics, updatedStats);
            updatedStats = { ...trigger.stats, statuses: { ...trigger.stats.statuses } };
            totalDraw += trigger.drawCards;
            messages.push(...trigger.messages);
        }

        let nextState: GameState = {
            ...state,
            playerStats: updatedStats,
        };
        let nextMessage = state.message;

        if (totalDraw > 0 && state.status === 'PLAYING') {
            if (updatedStats.statuses.noDraw > 0) {
                nextMessage += ` (Draw prevented)`;
            } else {
                const result = drawCards(state.drawPile, state.discardPile, totalDraw);
                const processed = processDrawnCards(
                    result.drawn,
                    state.hand,
                    result.newDiscard,
                    result.newDraw,
                    updatedStats,
                    nextMessage
                );
                nextState = {
                    ...nextState,
                    hand: processed.hand,
                    drawPile: processed.drawPile,
                    discardPile: processed.discard,
                    playerStats: processed.stats,
                };
                nextMessage = processed.message;
            }
        }

        if (messages.length > 0) {
            nextMessage += ` ${messages.join(' ')}`;
        }

        nextState.message = nextMessage.trim();
        return nextState;
    };

    const applyFirstAttackBonusToActions = (actions: any[], bonusDamage: number): { actions: any[], applied: boolean } => {
        if (bonusDamage <= 0) return { actions, applied: false };

        let applied = false;
        const boosted = actions.map(action => {
            if (applied) return action;
            if (!action || !action.payload) return action;

            if (action.type === 'DEAL_DAMAGE') {
                applied = true;
                return { ...action, payload: { ...action.payload, amount: (action.payload.amount || 0) + bonusDamage } };
            }
            if (action.type === 'DEAL_DAMAGE_PER_MATCHES') {
                applied = true;
                return { ...action, payload: { ...action.payload, base: (action.payload.base || 0) + bonusDamage } };
            }
            if (action.type === 'DEAL_DAMAGE_RAMPAGE') {
                applied = true;
                return { ...action, payload: { ...action.payload, base: (action.payload.base || 0) + bonusDamage } };
            }
            if (action.type === 'DEAL_DAMAGE_LIFESTEAL') {
                applied = true;
                return { ...action, payload: { ...action.payload, amount: (action.payload.amount || 0) + bonusDamage } };
            }
            if (action.type === 'DEAL_DAMAGE_FEED') {
                applied = true;
                return { ...action, payload: { ...action.payload, amount: (action.payload.amount || 0) + bonusDamage } };
            }

            return action;
        });

        return { actions: boosted, applied };
    };

    const applyPostPlayExhaust = (state: GameState, exhaustedCard: CardData): GameState => {
        let nextState: GameState = {
            ...state,
            hand: state.hand.filter(c => c !== exhaustedCard),
            exhaustPile: [...state.exhaustPile, exhaustedCard],
        };

        const statuses = nextState.playerStats.statuses;

        if (statuses.feelNoPain > 0) {
            let blockGain = statuses.feelNoPain;
            if (statuses.frail > 0) {
                blockGain = Math.floor(blockGain * 0.75);
            }
            if (blockGain > 0) {
                nextState = {
                    ...nextState,
                    playerStats: {
                        ...nextState.playerStats,
                        mitigation: nextState.playerStats.mitigation + blockGain,
                    },
                };
            }
        }

        const sentinelEffect = exhaustedCard.effects?.find(effect => effect.type === 'sentinel_effect');
        if (sentinelEffect?.value) {
            nextState = {
                ...nextState,
                playerStats: {
                    ...nextState.playerStats,
                    bandwidth: nextState.playerStats.bandwidth + sentinelEffect.value,
                },
            };
        }

        const phoenixDamage = getPhoenixProtocolDamage(nextState.relics);
        if (phoenixDamage > 0) {
            nextState = {
                ...nextState,
                enemies: nextState.enemies.map(enemy => enemy.hp > 0 ? {
                    ...enemy,
                    statuses: { ...enemy.statuses },
                    hp: Math.max(0, enemy.hp - phoenixDamage),
                } : enemy),
            };
        }

        if (statuses.darkEmbrace > 0) {
            const drawRes = drawCards(nextState.drawPile, nextState.discardPile, statuses.darkEmbrace);
            const processed = processDrawnCards(
                drawRes.drawn,
                nextState.hand,
                drawRes.newDiscard,
                drawRes.newDraw,
                nextState.playerStats,
                nextState.message
            );
            nextState = {
                ...nextState,
                hand: processed.hand,
                drawPile: processed.drawPile,
                discardPile: processed.discard,
                playerStats: processed.stats,
                message: processed.message,
            };

            if (processed.stats.statuses.fireBreathing > 0) {
                const statusDrawn = processed.drawnCards.filter(c => c.type === 'status');
                if (statusDrawn.length > 0) {
                    const baseDamage = processed.stats.statuses.fireBreathing;
                    nextState = {
                        ...nextState,
                        enemies: nextState.enemies.map(enemy => {
                            if (enemy.hp <= 0) return enemy;
                            let damage = baseDamage * statusDrawn.length;
                            if (enemy.statuses.vulnerable > 0) {
                                damage = Math.floor(damage * getVulnerableMultiplier(nextState.relics));
                            }
                            let mitigation = enemy.mitigation;
                            if (mitigation > 0) {
                                const blocked = Math.min(mitigation, damage);
                                mitigation -= blocked;
                                damage -= blocked;
                            }
                            return {
                                ...enemy,
                                statuses: { ...enemy.statuses },
                                mitigation,
                                hp: Math.max(0, enemy.hp - damage),
                            };
                        }),
                    };
                }
            }
        }

        if (nextState.enemies.every(e => e.hp <= 0)) {
            nextState = {
                ...nextState,
                status: 'VICTORY',
                message: nextState.message || 'PROBLEM SOLVED.',
            };
        }

        return nextState;
    };

    // === NEW ENGINE PATH ===
    if (shouldUseNewEngine) {
        getGlobalLogger().log('CARD_PLAY', `[NEW ENGINE] Playing ${card.name}`, { cardId: card.id, cost: costPaid });

        // Handle doubleTap - attacks play twice
        const playerStatuses = { ...prev.playerStats.statuses };
        const repeatCount = card.type === 'attack' && playerStatuses.doubleTap > 0 ? 2 : 1;
        if (repeatCount > 1) {
            playerStatuses.doubleTap = Math.max(0, playerStatuses.doubleTap - 1);
        }

        // Build initial state with status updates
        const workingRelics = prev.relics.map(relic => ({ ...relic }));
        let workingStats = {
            ...prev.playerStats,
            statuses: playerStatuses,
        };
        let attackRelicBonusDamage = 0;
        let attackRelicMessages: string[] = [];

        if (card.type === 'attack') {
            const attackRelicResult = applyOnAttackRelics(workingRelics, workingStats);
            workingStats = {
                ...attackRelicResult.stats,
                statuses: { ...attackRelicResult.stats.statuses }
            };
            attackRelicBonusDamage = attackRelicResult.bonusDamage;
            attackRelicMessages = attackRelicResult.messages;
        }

        let workingState: GameState = {
            ...prev,
            relics: workingRelics,
            hand: prev.hand.filter(c => c !== card),
            playerStats: {
                ...workingStats,
            },
        };
        let pendingAttackBonusDamage = attackRelicBonusDamage;
        const reducerRng = rng ? {
            nextInt: (min: number, max: number) => rng.nextInt(min, max),
            pick: <T,>(array: T[]) => rng.pick(array),
            shuffle: <T,>(array: T[]) => rng.shuffle(array),
        } : undefined;

        // Process card effects (potentially multiple times for doubleTap)
        for (let r = 0; r < repeatCount; r++) {
            const actionsRaw = cardToActions(card, target, targetEnemyId, r === 0 ? costPaid : 0);
            const actionsWithRage = card.type === 'attack' && workingState.playerStats.statuses.rage > 0
                ? [
                    {
                        type: 'GAIN_BLOCK',
                        payload: { amount: workingState.playerStats.statuses.rage },
                        source: card.id,
                    },
                    ...actionsRaw,
                ]
                : actionsRaw;
            const bonusResult = applyFirstAttackBonusToActions(actionsWithRage, pendingAttackBonusDamage);
            const actions = bonusResult.actions;
            if (bonusResult.applied) pendingAttackBonusDamage = 0;
            const queue = new ActionQueue();
            queue.enqueueMany(actions);

            const eventLog = new EventLog();
            const reducer = new ActionReducer(workingState, queue, eventLog, reducerRng);

            const { state, events } = reducer.processAll();
            workingState = {
                ...state,
                pendingEvents: [...(workingState.pendingEvents || []), ...events],
            };
        }

        // Attach final message
        let finalState: GameState = {
            ...workingState,
            message: `Deployed ${card.name}.${attackRelicMessages.length > 0 ? ` ${attackRelicMessages.join(' ')}` : ''}`,
        };

        // Handle card destination (exhaust or discard)
        // Remove card from hand first
        finalState.hand = finalState.hand.filter(c => c !== card);
        if (card.exhaust) {
            finalState = applyPostPlayExhaust(finalState, card);
        } else {
            finalState.discardPile = [...finalState.discardPile, card];
        }

        const enemiesDefeatedThisCard = Math.max(0, countAliveEnemies(prev.enemies) - countAliveEnemies(finalState.enemies));
        if (enemiesDefeatedThisCard > 0) {
            finalState = applyEnemyDeathRelicEffects(finalState, enemiesDefeatedThisCard);
        }

        // === NEW ENGINE: Calculate victory rewards (matching legacy behavior) ===
        if (finalState.status === 'VICTORY') {
            let earnedCapital = 0;
            let earnedRelic: RelicData | undefined;
            const isBossVictory = prev.enemies.some(e => e.type === 'boss');
            const isEliteVictory = !isBossVictory && prev.enemies.some(e => e.type === 'elite');

            // Calculate Capital rewards from enemies
            prev.enemies.forEach(e => {
                if (e.rewards && e.rewards.capital) {
                    const min = e.rewards.capital.min;
                    const max = e.rewards.capital.max;
                    earnedCapital += Math.floor(Math.random() * (max - min + 1)) + min;
                }
            });

            // Elite rewards grant a regular relic. Boss rewards defer to the boss relic screen.
            if (isEliteVictory) {
                earnedRelic = getEliteRelic(finalState.relics.map(r => r.id)) || undefined;
            }

            // Generate card rewards
            const cardRewards = getRandomRewardCards(3, rng, isBossVictory ? 'rare' : undefined);
            const shouldGetCardReward = prev.enemies.some(e => e.rewards?.card_reward !== false);

            // Check for potion drop
            let pendingPotionReward: typeof prev.pendingPotionReward = undefined;
            let newPotionDropChance = prev.potionDropChance;

            const potionDropResult = checkPotionDrop(newPotionDropChance);
            newPotionDropChance = potionDropResult.newChance;

            if (potionDropResult.dropped && canAcquirePotion(prev.potions)) {
                pendingPotionReward = generateRandomPotion('cto');
                getGlobalLogger().log('POTION_DROP', `Combat dropped "${pendingPotionReward.name}"!`);
            } else if (potionDropResult.dropped) {
                getGlobalLogger().log('POTION_DROP', 'Potion dropped but slots full - skipped.');
            } else {
                getGlobalLogger().log('POTION_DROP', `No potion drop (chance now ${newPotionDropChance}%)`);
            }

            // Apply combat end relics
            const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(finalState.playerStats, finalState.relics);

            finalState = {
                ...finalState,
                playerStats: afterRelicStats,
                potionDropChance: newPotionDropChance,
                pendingPotionReward: pendingPotionReward,
                lastVictoryReward: {
                    capital: earnedCapital,
                    cardRewards: shouldGetCardReward ? cardRewards : [],
                    relic: earnedRelic,
                    goldCollected: false,
                    cardCollected: false,
                    relicCollected: false
                },
                message: finalState.message + (earnedCapital > 0 ? ` Earned $${earnedCapital}k Capital.` : '') + (relicMsg ? ` ${relicMsg}` : '')
            };

            getGlobalLogger().log('COMBAT_VICTORY', 'All enemies defeated by card effect (new engine). Rewards calculated.');
        }
        // === END NEW ENGINE VICTORY REWARDS ===

        return finalState;
    }
    // === END NEW ENGINE PATH ===

    if (USE_NEW_CARD_RESOLVER && !shouldUseNewEngine) {
        getGlobalLogger().log('CARD_PLAY_FALLBACK', `[NEW ENGINE] Falling back to legacy resolver for ${card.name}`, {
            cardId: card.id,
            unsupportedEffects: unsupportedEffects.map(e => e.type),
        });
    }

    getGlobalLogger().log('CARD_PLAY', `Played ${card.name}`, {
        cardName: card.name,
        cardId: card.id,
        cardCost: costPaid,
        cardType: card.type,
        target: target === 'enemy' && targetEnemyId ? targetEnemyId : 'Self'
    });

    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    const targetId = targetEnemyId || prev.selectedEnemyId || (newEnemies.length > 0 ? newEnemies[0].id : undefined);
    const targetEnemyIndex = newEnemies.findIndex(e => e.id === targetId);
    let targetEnemy = targetEnemyIndex !== -1 ? newEnemies[targetEnemyIndex] : null;

    if (!targetEnemy && target === 'enemy') {
        console.log(`DEBUG: resolveCardEffect target missing/invalid. TargetID: ${targetId}, Enemies: ${newEnemies.map(e => e.id).join(', ')}`);
    } else if (target === 'enemy') {
        // console.log(`DEBUG: resolveCardEffect target found: ${targetEnemy?.id}`);
    }

    let newMessage = `Deployed ${card.name}.`;
    let newStatus = prev.status;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newHp = prev.playerStats.hp;
    let newMaxHp = prev.playerStats.maxHp;
    let newBandwidth = prev.playerStats.bandwidth - costPaid;
    let newPendingDiscard = 0;
    let newPendingSelection = prev.pendingSelection;
    let newRelics = [...prev.relics];

    let drawnCards: CardData[] = [];
    let newDrawPile = [...prev.drawPile];
    let newDiscardPile = [...prev.discardPile];
    let newExhaustPile = [...prev.exhaustPile];
    // Fix: Remove specific card instance by reference to avoid removing duplicates with same ID
    let currentHand = prev.hand.filter(c => c !== card);
    let pendingAttackBonusDamage = 0;

    if (card.type === 'attack') {
        const attackRelicResult = applyOnAttackRelics(
            newRelics,
            {
                ...prev.playerStats,
                hp: newHp,
                maxHp: newMaxHp,
                mitigation: newMitigation,
                bandwidth: newBandwidth,
                statuses: newPlayerStatuses
            }
        );
        newMitigation = attackRelicResult.stats.mitigation;
        newBandwidth = attackRelicResult.stats.bandwidth;
        newPlayerStatuses = { ...attackRelicResult.stats.statuses };
        pendingAttackBonusDamage = attackRelicResult.bonusDamage;
        if (attackRelicResult.messages.length > 0) {
            newMessage += ` ${attackRelicResult.messages.join(' ')}`;
        }
    }

    const consumeAttackBonusDamage = (): number => {
        if (pendingAttackBonusDamage <= 0) return 0;
        const bonus = pendingAttackBonusDamage;
        pendingAttackBonusDamage = 0;
        return bonus;
    };

    const applyJuggernaut = (blockGained: number) => {
        if (blockGained <= 0 || newPlayerStatuses.juggernaut <= 0) return;
        const liveTargets = newEnemies.filter(e => e.hp > 0);
        if (liveTargets.length === 0) return;
        const targetEnemyLocal = liveTargets[Math.floor(Math.random() * liveTargets.length)];
        let jugDamage = newPlayerStatuses.juggernaut;
        if (targetEnemyLocal.statuses.vulnerable > 0) {
            jugDamage = Math.floor(jugDamage * getVulnerableMultiplier(newRelics));
        }
        targetEnemyLocal.hp = Math.max(0, targetEnemyLocal.hp - jugDamage);
        newMessage += ` Juggernaut dealt ${jugDamage} to ${targetEnemyLocal.name}.`;
    };

    const applyBlockGain = (blockAmount: number) => {
        if (blockAmount <= 0) return;
        newMitigation += blockAmount;
        applyJuggernaut(blockAmount);
    };

    const triggerFireBreathing = (drawnList: CardData[]) => {
        if (newPlayerStatuses.fireBreathing <= 0 || drawnList.length === 0) return;
        const statusDrawn = drawnList.filter(c => c.type === 'status');
        if (statusDrawn.length === 0) return;
        const baseDamage = newPlayerStatuses.fireBreathing;

        newEnemies.forEach(enemy => {
            let damage = baseDamage * statusDrawn.length;
            if (enemy.statuses.vulnerable > 0) {
                damage = Math.floor(damage * getVulnerableMultiplier(newRelics));
            }
            if (enemy.mitigation > 0) {
                const blocked = Math.min(enemy.mitigation, damage);
                enemy.mitigation -= blocked;
                damage -= blocked;
            }
            enemy.hp = Math.max(0, enemy.hp - damage);
        });
        newMessage += ` Bug Bounty triggered on drawn status cards.`;
    };

    const handlePhoenixProtocol = () => {
        const phoenixDamage = getPhoenixProtocolDamage(newRelics);
        if (phoenixDamage > 0) {
            newEnemies.forEach(e => {
                e.hp = Math.max(0, e.hp - phoenixDamage);
            });
            newMessage += ` Phoenix Protocol: ${phoenixDamage} to all!`;
            getGlobalLogger().log('RELIC_EFFECT', `Phoenix Protocol dealt ${phoenixDamage} damage to all enemies.`);

            if (newEnemies.every(e => e.hp <= 0)) {
                newStatus = 'VICTORY';
                newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                getGlobalLogger().log('COMBAT_VICTORY', 'All enemies defeated by Phoenix Protocol.');
            }
        }
    };

    const handleDarkEmbraceDraw = () => {
        if (newPlayerStatuses.darkEmbrace <= 0) return;
        const drawRes = drawCards(newDrawPile, newDiscardPile, newPlayerStatuses.darkEmbrace);
        const currentStats = { ...prev.playerStats, hp: newHp, maxHp: newMaxHp, bandwidth: newBandwidth, statuses: newPlayerStatuses, mitigation: newMitigation };
        const processed = processDrawnCards(drawRes.drawn, currentHand, newDiscardPile, drawRes.newDraw, currentStats, newMessage);
        currentHand = processed.hand;
        newDiscardPile = processed.discard;
        newDrawPile = processed.drawPile;
        newMessage = processed.message;
        newBandwidth = processed.stats.bandwidth;
        newPlayerStatuses = processed.stats.statuses;
        newMitigation = processed.stats.mitigation;
        triggerFireBreathing(processed.drawnCards);
        drawnCards.push(...processed.drawnCards);
    };

    const exhaustCard = (cardToExhaust: CardData) => {
        newExhaustPile.push(cardToExhaust);
        const feelBlock = newPlayerStatuses.feelNoPain > 0 ? newPlayerStatuses.feelNoPain : 0;
        if (feelBlock > 0) {
            applyBlockGain(feelBlock);
        }

        const sentinelEffect = cardToExhaust.effects?.find(e => e.type === 'sentinel_effect');
        if (sentinelEffect?.value) {
            newBandwidth += sentinelEffect.value;
            newMessage += ` Fail-Safe triggered: +${sentinelEffect.value} Bandwidth.`;
        }

        handlePhoenixProtocol();
        handleDarkEmbraceDraw();
    };

    const executeEffect = (effect: CardEffect, loops: number = 1) => {
        for (let i = 0; i < loops; i++) {
            if (effect.type === 'damage') {
                let targets: EnemyData[] = [];
                if (effect.target === 'all_enemies') targets = newEnemies;
                else if (target === 'enemy' && targetEnemy) targets = [targetEnemy];

                targets.forEach(t => {
                    // Apply Crunch Mode (Red Skull) bonus strength when HP ≤50%
                    const crunchBonus = getCrunchModeStrength(newRelics, prev.playerStats.hp, prev.playerStats.maxHp);
                    // Use newPlayerStatuses to reflect buffs/debuffs gained during this turn
                    const effectiveStatuses = crunchBonus > 0
                        ? { ...newPlayerStatuses, strength: newPlayerStatuses.strength + crunchBonus }
                        : newPlayerStatuses;

                    const baseDamage = effect.value + consumeAttackBonusDamage();
                    let finalDamage = calculateDamage(baseDamage, effectiveStatuses, t.statuses, effect.strengthMultiplier || 1, newRelics);
                    if (t.statuses.vulnerable > 0) newMessage += " (Exposed!)";
                    if (newPlayerStatuses.weak > 0) newMessage += " (Drained...)";

                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                        newMessage += ` (${blocked} Blocked)`;
                        getGlobalLogger().log('DAMAGE_BLOCKED', `Blocked ${blocked} Burn to ${t.name}.`);
                    }

                    const hpBefore = t.hp;
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} Burn.`;
                    getGlobalLogger().log('DAMAGE_DEALT', `Dealt ${finalDamage} Burn to ${t.name}. HP: ${hpBefore} -> ${t.hp}`);

                    // Check for Split Trigger (Direct Damage)
                    if (t.id.startsWith('boss_the_monolith') && t.hp <= t.maxHp / 2 && t.currentIntent.type !== 'unknown') {
                        t.currentIntent = {
                            type: 'unknown',
                            value: 0,
                            icon: 'unknown',
                            description: 'Splitting...'
                        };
                        getGlobalLogger().log('BOSS_MECHANIC', `${t.name} triggered Split!`);
                    }

                    if (t.statuses.curlUp > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.curlUp;
                        t.statuses.curlUp = 0;
                        newMessage += ` ${t.name} Curled Up! (+${t.statuses.curlUp} Mit)`;
                        getGlobalLogger().log('ENEMY_STATUS_EFFECT', `${t.name} Curled Up, gained ${t.statuses.curlUp} Mitigation.`);
                    }
                    if (t.statuses.malleable > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.malleable;
                        t.statuses.malleable += 1;
                        newMessage += ` ${t.name} is Malleable! (+${t.statuses.malleable} Mit)`;
                        getGlobalLogger().log('ENEMY_STATUS_EFFECT', `${t.name} is Malleable, gained ${t.statuses.malleable} Mitigation.`);
                    }
                    if (t.statuses.asleep > 0 && finalDamage > 0) {
                        t.statuses.asleep = 0;
                        newMessage += ` ${t.name} Woke Up!`;
                        getGlobalLogger().log('ENEMY_STATUS_EFFECT', `${t.name} Woke Up.`);
                    }
                });

                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                    getGlobalLogger().log('COMBAT_VICTORY', 'All enemies defeated by card effect.');
                }
            } else if (effect.type === 'damage_scale_mitigation') {
                // Body Slam: Damage = Mitigation
                const dmg = newMitigation + consumeAttackBonusDamage();
                let targets: EnemyData[] = [];
                if (target === 'enemy' && targetEnemy) targets = [targetEnemy];

                targets.forEach(t => {
                    // Apply Crunch Mode (Red Skull) bonus strength when HP ≤50%
                    const crunchBonus = getCrunchModeStrength(newRelics, prev.playerStats.hp, prev.playerStats.maxHp);
                    // Use newPlayerStatuses to reflect buffs/debuffs gained during this turn
                    const effectiveStatuses = crunchBonus > 0
                        ? { ...newPlayerStatuses, strength: newPlayerStatuses.strength + crunchBonus }
                        : newPlayerStatuses;
                    let finalDamage = calculateDamage(dmg, effectiveStatuses, t.statuses, 1, newRelics);
                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                        getGlobalLogger().log('DAMAGE_BLOCKED', `Blocked ${blocked} damage to ${t.name}.`);
                    }
                    const hpBefore = t.hp;
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} (Mitigation-based).`;
                    getGlobalLogger().log('DAMAGE_DEALT', `Dealt ${finalDamage} damage to ${t.name} (mitigation-based). HP: ${hpBefore} -> ${t.hp}`);
                });
            } else if (effect.type === 'damage_scale_matches') {
                // Perfected Strike: Damage scales with matches in deck
                const matchString = effect.matchString || 'Commit';
                // Count in Hand, Draw, Discard, Exhaust (Combat Deck)
                const combatDeck = [...currentHand, ...newDrawPile, ...newDiscardPile, ...newExhaustPile, card];
                const matches = countCardsMatches(combatDeck, matchString);
                const bonus = matches * (effect.value === 6 ? 2 : 2); // Hardcoded +2 per match for now based on description
                const totalDmg = effect.value + bonus + consumeAttackBonusDamage();
                getGlobalLogger().log('CARD_EFFECT_SPECIAL', `Damage scaled by matches: ${matches} matches, total damage ${totalDmg}.`);

                let targets: EnemyData[] = [];
                if (target === 'enemy' && targetEnemy) targets = [targetEnemy];

                targets.forEach(t => {
                    // Apply Crunch Mode (Red Skull) bonus strength when HP ≤50%
                    const crunchBonus = getCrunchModeStrength(newRelics, prev.playerStats.hp, prev.playerStats.maxHp);
                    // Use newPlayerStatuses to reflect buffs/debuffs gained during this turn
                    const effectiveStatuses = crunchBonus > 0
                        ? { ...newPlayerStatuses, strength: newPlayerStatuses.strength + crunchBonus }
                        : newPlayerStatuses;
                    let finalDamage = calculateDamage(totalDmg, effectiveStatuses, t.statuses, 1, newRelics);
                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                        getGlobalLogger().log('DAMAGE_BLOCKED', `Blocked ${blocked} damage to ${t.name}.`);
                    }
                    const hpBefore = t.hp;
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} (${matches} matches).`;
                    getGlobalLogger().log('DAMAGE_DEALT', `Dealt ${finalDamage} damage to ${t.name} (scaled by matches). HP: ${hpBefore} -> ${t.hp}`);
                });
            } else if (effect.type === 'block') {
                let blockAmount = effect.value;
                if (newPlayerStatuses.frail > 0) blockAmount = Math.floor(blockAmount * 0.75);
                applyBlockGain(blockAmount);
                newMessage += ` gained ${blockAmount} Mitigation.`;
                getGlobalLogger().log('BLOCK_GAINED', `Gained ${blockAmount} Mitigation. Player total: ${newMitigation}`);
            } else if (effect.type === 'draw') {
                if (newPlayerStatuses.noDraw > 0) {
                    newMessage += ` (Draw prevented)`;
                    getGlobalLogger().log('CARD_EFFECT_BLOCKED', `Draw prevented by NoDraw status.`);
                } else {
                    const result = drawCards(newDrawPile, newDiscardPile, effect.value);

                    const currentStats = { ...prev.playerStats, bandwidth: newBandwidth, statuses: newPlayerStatuses, mitigation: newMitigation };
                    const processed = processDrawnCards(result.drawn, currentHand, newDiscardPile, result.newDraw, currentStats, newMessage);

                    currentHand = processed.hand;
                    newDiscardPile = processed.discard;
                    newDrawPile = processed.drawPile;
                    newMessage = processed.message;
                    newBandwidth = processed.stats.bandwidth;
                    newPlayerStatuses = processed.stats.statuses;
                    triggerFireBreathing(processed.drawnCards);

                    newMessage += ` Drew ${result.drawn.length} cards.`;
                }
            } else if (effect.type === 'apply_status') {
                const amount = effect.value;
                const statusType = effect.status || 'vulnerable';
                if (effect.target === 'self') {
                    if (statusType === 'strength' && effect.timing === 'end_of_turn') {
                        newPlayerStatuses.tempStrength += Math.abs(amount);
                        continue;
                    }
                    if (statusType === 'strength') newPlayerStatuses.strength += amount;
                    if (statusType === 'metallicize') newPlayerStatuses.metallicize += amount;
                    if (statusType === 'evolve') newPlayerStatuses.evolve += amount;
                    if (statusType === 'feelNoPain') newPlayerStatuses.feelNoPain += amount;
                    if (statusType === 'noDraw') newPlayerStatuses.noDraw += amount;
                    if (statusType === 'thorns') newPlayerStatuses.thorns += amount;
                    if (statusType === 'antifragile') newPlayerStatuses.antifragile += amount;
                    if (statusType === 'artifact') newPlayerStatuses.artifact += amount;
                    if (statusType === 'growth') newPlayerStatuses.growth += amount;
                    if (statusType === 'corruption') newPlayerStatuses.corruption += amount;
                    if (statusType === 'combust') newPlayerStatuses.combust += amount;
                    if (statusType === 'darkEmbrace') newPlayerStatuses.darkEmbrace += amount;
                    if (statusType === 'rage') newPlayerStatuses.rage += amount;
                    if (statusType === 'fireBreathing') newPlayerStatuses.fireBreathing += amount;
                    if (statusType === 'barricade') newPlayerStatuses.barricade += amount;
                    if (statusType === 'doubleTap') newPlayerStatuses.doubleTap += amount;
                    if (statusType === 'berserk') newPlayerStatuses.berserk += amount;
                    if (statusType === 'brutality') newPlayerStatuses.brutality += amount;
                    if (statusType === 'juggernaut') newPlayerStatuses.juggernaut += amount;
                } else if (effect.target === 'all_enemies') {
                    // Apply to ALL enemies - must check before targetEnemy to work correctly!
                    newEnemies.forEach(e => {
                        if (statusType === 'vulnerable') {
                            e.statuses.vulnerable += amount;
                            // Pressure Cooker (Champion Belt): Also apply Weak when applying Vulnerable
                            const pressureCookerWeak = getPressureCookerWeak(newRelics);
                            if (pressureCookerWeak > 0) {
                                e.statuses.weak += pressureCookerWeak;
                                getGlobalLogger().log('RELIC_EFFECT', `Pressure Cooker applied ${pressureCookerWeak} Weak alongside Vulnerable.`);
                            }
                        }
                        if (statusType === 'weak') e.statuses.weak += amount;
                        if (statusType === 'strength') e.statuses.strength += amount;
                    });
                    newMessage += ` Applied ${amount} ${statusType} to all enemies.`;
                } else if (targetEnemy) {
                    if (statusType === 'vulnerable') {
                        targetEnemy.statuses.vulnerable += amount;
                        // Pressure Cooker (Champion Belt): Also apply Weak when applying Vulnerable
                        const pressureCookerWeak = getPressureCookerWeak(newRelics);
                        if (pressureCookerWeak > 0) {
                            targetEnemy.statuses.weak += pressureCookerWeak;
                            newMessage += ` (Pressure Cooker: +${pressureCookerWeak} Drained!)`;
                            getGlobalLogger().log('RELIC_EFFECT', `Pressure Cooker applied ${pressureCookerWeak} Weak alongside Vulnerable.`);
                        }
                    }
                    if (statusType === 'weak') targetEnemy.statuses.weak += amount;
                    if (statusType === 'strength') targetEnemy.statuses.strength += amount; // Disarm (negative strength)
                }
            } else if (effect.type === 'add_copy') {
                const copy = { ...card, id: `${card.id}_copy_${Date.now()}` };
                newDiscardPile.push(copy);
                newMessage += ` Added copy of ${card.name} to discard.`;
            } else if (effect.type === 'add_card') {
                if (effect.cardId) {
                    const cardTemplate = Object.values(GAME_DATA.cards).find(c => c.id === effect.cardId);
                    if (cardTemplate) {
                        const newCard = { ...cardTemplate, id: `${effect.cardId}_${Date.now()}` };
                        // Default to discard for now, or check target?
                        // YOLO Deploy -> Draw Pile? Tech Shortcut -> Discard.
                        // Effect usually specifies target, but here we assume Discard unless specified?
                        // YOLO Deploy says "Shuffle into your draw pile".
                        // Tech Shortcut says "Shuffle into your discard".
                        // We need a 'destination' in CardEffect or infer from card logic.
                        // For MVP, let's hardcode based on card ID or add destination to effect type?
                        // Let's assume Discard for now, unless it's YOLO Deploy.
                        if (card.id === 'cto_yolo_deploy') {
                            newDrawPile.push(newCard);
                            newDrawPile = shuffle(newDrawPile);
                            newMessage += ` Shuffled ${newCard.name} into Draw Pile.`;
                        } else {
                            newDiscardPile.push(newCard);
                            newMessage += ` Added ${newCard.name} to Discard.`;
                        }
                    }
                }
            } else if (effect.type === 'upgrade_hand') {
                if (effect.value === 1) {
                    // Trigger selection
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'upgrade', count: 1 };
                    newMessage += ` Select a card to upgrade.`;
                } else {
                    // Upgrade all?
                    currentHand = currentHand.map(c => upgradeCard(c));
                    drawnCards = drawnCards.map(c => upgradeCard(c)); // Also upgrade cards drawn this turn?
                    newMessage += ` Upgraded hand.`;
                }
            } else if (effect.type === 'retrieve_discard') {
                const selectionCount = effect.value || 1;
                if (newDiscardPile.length > 0) {
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'discard_pile', action: 'move_to_draw_pile', count: selectionCount };
                    newMessage += ` Select ${selectionCount} card(s) from discard to place on top of your draw pile.`;
                } else {
                    newMessage += ` Discard is empty.`;
                }
            } else if (effect.type === 'conditional_strength') {
                // Spot Weakness: If ANY enemy intends to attack
                const anyEnemyAttacking = newEnemies.some(e => e.hp > 0 && e.currentIntent.type === 'attack');
                if (anyEnemyAttacking) {
                    newPlayerStatuses.strength += effect.value;
                    newMessage += ` Gained ${effect.value} Velocity.`;
                }
            } else if (effect.type === 'conditional_refund') {
                // Dropkick: If enemy is Vulnerable
                if (targetEnemy && targetEnemy.statuses.vulnerable > 0) {
                    newBandwidth += effect.value;
                    const result = drawCards(newDrawPile, newDiscardPile, 1);

                    const currentStats = { ...prev.playerStats, bandwidth: newBandwidth, statuses: newPlayerStatuses, mitigation: newMitigation };
                    const processed = processDrawnCards(result.drawn, currentHand, newDiscardPile, result.newDraw, currentStats, newMessage);

                    currentHand = processed.hand;
                    newDiscardPile = processed.discard;
                    newDrawPile = processed.drawPile;
                    newMessage = processed.message;
                    newBandwidth = processed.stats.bandwidth;
                    newPlayerStatuses = processed.stats.statuses;
                    triggerFireBreathing(processed.drawnCards);

                    newMessage += ` Refunded Energy & Draw.`;
                }
            } else if (effect.type === 'blood_cost') {
                const hpLost = prev.playerStats.maxHp - prev.playerStats.hp;
                const reduction = Math.min(card.cost, Math.max(0, hpLost));
                const refund = Math.min(costPaid, reduction);
                if (refund > 0) {
                    newBandwidth += refund;
                    newMessage += ` Bootstrapped refund: +${refund} Bandwidth.`;
                }
            } else if (effect.type === 'lose_hp') {
                newHp = Math.max(0, newHp - effect.value);
                if (newPlayerStatuses.antifragile > 0) {
                    newPlayerStatuses.strength += newPlayerStatuses.antifragile;
                    newMessage += ` (Antifragile: +${newPlayerStatuses.antifragile} Execution Power)`;
                }
                if (newHp <= 0) {
                    newStatus = 'GAME_OVER';
                    newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
                }
            } else if (effect.type === 'play_top_card') {
                if (newDrawPile.length === 0 && newDiscardPile.length > 0) {
                    newDrawPile = shuffle(newDiscardPile);
                    newDiscardPile = [];
                }
                const topCard = newDrawPile.pop();
                if (topCard) {
                    const playableCard = { ...topCard, cost: 0, exhaust: true };
                    const interimState: GameState = {
                        ...prev,
                        playerStats: { ...prev.playerStats, hp: newHp, maxHp: newMaxHp, mitigation: newMitigation, bandwidth: newBandwidth, statuses: newPlayerStatuses },
                        hand: [...currentHand, ...drawnCards, playableCard],
                        drawPile: newDrawPile,
                        discardPile: newDiscardPile,
                        exhaustPile: newExhaustPile,
                        enemies: newEnemies,
                        status: newStatus,
                        pendingDiscard: newPendingDiscard,
                        pendingSelection: newPendingSelection,
                        relics: newRelics,
                        message: newMessage
                    };
                    const resultState = resolveCardEffect(interimState, playableCard, playableCard.type === 'attack' ? 'enemy' : 'self', targetEnemy?.id, rng);
                    newEnemies = resultState.enemies;
                    newMitigation = resultState.playerStats.mitigation;
                    newBandwidth = resultState.playerStats.bandwidth;
                    newPlayerStatuses = resultState.playerStats.statuses;
                    newHp = resultState.playerStats.hp;
                    newMaxHp = resultState.playerStats.maxHp;
                    newDrawPile = resultState.drawPile;
                    newDiscardPile = resultState.discardPile;
                    newExhaustPile = resultState.exhaustPile;
                    newStatus = resultState.status;
                    newMessage = resultState.message;
                    newPendingDiscard = resultState.pendingDiscard;
                    newPendingSelection = resultState.pendingSelection;
                }
            } else if (effect.type === 'put_on_deck') {
                if (currentHand.length > 0) {
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'move_to_draw_pile', count: effect.value };
                    newMessage += ` Choose ${effect.value} card(s) to top-deck.`;
                }
            } else if (effect.type === 'exhaust_choice') {
                if (currentHand.length > 0) {
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'exhaust', count: effect.value };
                    newMessage += ` Select ${effect.value} card(s) to exhaust.`;
                }
            } else if (effect.type === 'exhaust_non_attacks') {
                const remaining: CardData[] = [];
                const toExhaust: CardData[] = [];
                currentHand.forEach(c => {
                    if (c.type === 'attack') remaining.push(c);
                    else toExhaust.push(c);
                });
                currentHand = remaining;
                toExhaust.forEach(c => exhaustCard(c));
                newMessage += ` Exhausted ${toExhaust.length} non-attack card(s).`;
            } else if (effect.type === 'second_wind') {
                const remaining: CardData[] = [];
                const toExhaust: CardData[] = [];
                currentHand.forEach(c => {
                    if (c.type === 'attack') remaining.push(c);
                    else toExhaust.push(c);
                });
                currentHand = remaining;
                toExhaust.forEach(c => exhaustCard(c));
                let blockGain = effect.value * toExhaust.length;
                if (newPlayerStatuses.frail > 0) blockGain = Math.floor(blockGain * 0.75);
                applyBlockGain(blockGain);
                newMessage += ` Gained ${blockGain} Buffer from restructuring.`;
            } else if (effect.type === 'double_block') {
                const gained = newMitigation;
                applyBlockGain(gained);
                newMessage += ` Doubled Buffer.`;
            } else if (effect.type === 'add_card_to_hand') {
                if (effect.cardId) {
                    const template = Object.values(GAME_DATA.cards).find(c => c.id === effect.cardId);
                    if (template) {
                        for (let copy = 0; copy < effect.value; copy++) {
                            const newCard = { ...template, id: `${effect.cardId}_${Date.now()}_${copy}` };
                            if (currentHand.length < MAX_HAND_SIZE) {
                                currentHand.push(newCard);
                                newMessage += ` Added ${newCard.name} to hand.`;
                            } else {
                                newDiscardPile.push(newCard);
                                newMessage += ` Hand full, ${newCard.name} to discard.`;
                            }
                        }
                    }
                }
            } else if (effect.type === 'dual_wield') {
                const candidate = currentHand.find(c => c.type === 'attack' || c.type === 'skill');
                if (candidate) {
                    const copy = { ...candidate, id: `${candidate.id}_dupe_${Date.now()}` };
                    currentHand.push(copy);
                    newMessage += ` Copied ${candidate.name}.`;
                } else {
                    newMessage += ` No Attack/Strategy to copy.`;
                }
            } else if (effect.type === 'add_random_attack_zero_cost') {
                const attacks = Object.values(GAME_DATA.cards).filter(c => c.type === 'attack' && c.rarity !== 'starter' && c.rarity !== 'special');
                if (attacks.length > 0) {
                    const randomAttack = rng ? rng.pick(attacks) : attacks[Math.floor(Math.random() * attacks.length)];
                    const newCard = { ...randomAttack, id: `random_zero_${Date.now()}`, cost: 0 };
                    if (currentHand.length < MAX_HAND_SIZE) {
                        currentHand.push(newCard);
                    } else {
                        newDiscardPile.push(newCard);
                        newMessage += ` Hand full, ${newCard.name} to discard.`;
                    }
                }
            } else if (effect.type === 'damage_rampage') {
                let targets: EnemyData[] = [];
                if (target === 'enemy' && targetEnemy) targets = [targetEnemy];
                const bonus = (card as any).rampageBonus || 0;
                const totalDamage = effect.value + bonus + consumeAttackBonusDamage();
                targets.forEach(t => {
                    const crunchBonus = getCrunchModeStrength(newRelics, prev.playerStats.hp, prev.playerStats.maxHp);
                    const effectiveStatuses = crunchBonus > 0
                        ? { ...newPlayerStatuses, strength: newPlayerStatuses.strength + crunchBonus }
                        : newPlayerStatuses;
                    let finalDamage = calculateDamage(totalDamage, effectiveStatuses, t.statuses, 1, newRelics);
                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                    }
                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} Viral damage.`;
                });
                (card as any).rampageBonus = bonus + 5;
            } else if (effect.type === 'double_strength') {
                newPlayerStatuses.strength *= 2;
                newMessage += ` Velocity doubled!`;
            } else if (effect.type === 'damage_feed') {
                if (targetEnemy) {
                    const damage = calculateDamage(effect.value + consumeAttackBonusDamage(), newPlayerStatuses, targetEnemy.statuses, 1, newRelics);
                    const blocked = Math.min(targetEnemy.mitigation, damage);
                    targetEnemy.mitigation -= blocked;
                    const finalDamage = damage - blocked;
                    const prevHp = targetEnemy.hp;
                    targetEnemy.hp = Math.max(0, targetEnemy.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} Burn.`;
                    if (prevHp > 0 && targetEnemy.hp === 0) {
                        const gain = 3;
                        newMaxHp += gain;
                        newHp = Math.min(newMaxHp, newHp + gain);
                        newMessage += ` Acqui-Hire: +${gain} max Runway.`;
                    }
                }
                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                }
            } else if (effect.type === 'damage_lifesteal') {
                let totalHeal = 0;
                const lifestealBaseDamage = effect.value + consumeAttackBonusDamage();
                newEnemies.forEach(t => {
                    const damage = calculateDamage(lifestealBaseDamage, newPlayerStatuses, t.statuses, 1, newRelics);
                    const blocked = Math.min(t.mitigation, damage);
                    t.mitigation -= blocked;
                    const finalDamage = damage - blocked;
                    t.hp = Math.max(0, t.hp - finalDamage);
                    totalHeal += finalDamage;
                });
                if (totalHeal > 0) {
                    const heal = Math.min(totalHeal, newMaxHp - newHp);
                    newHp += heal;
                    newMessage += ` Recovered ${heal} Runway from takeover.`;
                }
                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                }
            } else if (effect.type === 'fiend_fire') {
                const exhaustedCount = currentHand.length;
                currentHand.slice().forEach(c => exhaustCard(c));
                currentHand = [];
                let totalDamage = (effect.value * exhaustedCount) + consumeAttackBonusDamage();
                if (targetEnemy) {
                    const damage = calculateDamage(totalDamage, newPlayerStatuses, targetEnemy.statuses, 1, newRelics);
                    const blocked = Math.min(targetEnemy.mitigation, damage);
                    targetEnemy.mitigation -= blocked;
                    const finalDamage = damage - blocked;
                    targetEnemy.hp = Math.max(0, targetEnemy.hp - finalDamage);
                    newMessage += ` All-In Pivot dealt ${finalDamage}.`;
                }
                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                }
            } else if (effect.type === 'exhume') {
                if (newExhaustPile.length > 0) {
                    const retrieved = newExhaustPile.pop()!;
                    if (currentHand.length < MAX_HAND_SIZE) {
                        currentHand.push(retrieved);
                        newMessage += ` Returned ${retrieved.name} from Archive.`;
                    } else {
                        newDiscardPile.push(retrieved);
                        newMessage += ` Hand full, ${retrieved.name} to discard.`;
                    }
                }
            } else if (effect.type === 'exhaust_random') {
                // Refactor: Exhaust random card
                if (currentHand.length > 0) {
                    const idx = Math.floor(Math.random() * currentHand.length);
                    const exhausted = currentHand.splice(idx, 1)[0];
                    newMessage += ` Exhausted ${exhausted.name}.`;
                    exhaustCard(exhausted);
                }
            } else if (effect.type === 'exhaust_targeted') {
                if (currentHand.length > 0) {
                    newStatus = 'CARD_SELECTION';
                    newPendingSelection = { context: 'hand', action: 'exhaust', count: effect.value };
                    newMessage += ` Select ${effect.value} card(s) to exhaust.`;
                } else {
                    newMessage += ` Hand is empty.`;
                }
            } else if (effect.type === 'discard') {
                if (currentHand.length > 0) {
                    newStatus = 'DISCARD_SELECTION';
                    newPendingDiscard = effect.value;
                    newMessage += ` Select ${effect.value} card(s) to discard.`;
                } else {
                    newMessage += ` Hand is empty.`;
                }
            } else if (effect.type === 'gain_bandwidth') {
                newBandwidth += effect.value;
                newMessage += ` Gained ${effect.value} Bandwidth.`;
            }
        }
    };

    const repeatCount = card.type === 'attack' && newPlayerStatuses.doubleTap > 0 ? 2 : 1;
    if (repeatCount > 1) {
        newPlayerStatuses.doubleTap = Math.max(0, newPlayerStatuses.doubleTap - 1);
    }

    for (let r = 0; r < repeatCount; r++) {
        if (card.type === 'attack' && newPlayerStatuses.rage > 0) {
            let rageBlock = newPlayerStatuses.rage;
            if (newPlayerStatuses.frail > 0) rageBlock = Math.floor(rageBlock * 0.75);
            applyBlockGain(rageBlock);
            newMessage += ` Founder Mode: +${rageBlock} Buffer.`;
        }

        card.effects.forEach(effect => {
            let loops = 1;
            if (card.cost === -1) loops = costPaid;
            executeEffect(effect, loops);
        });
    }



    if (card.exhaust) {
        exhaustCard(card);
    } else {
        newDiscardPile.push(card);
    }

    const enemiesDefeatedThisCard = Math.max(0, countAliveEnemies(prev.enemies) - countAliveEnemies(newEnemies));
    if (enemiesDefeatedThisCard > 0) {
        let deathTriggerStats = {
            ...prev.playerStats,
            hp: newHp,
            maxHp: newMaxHp,
            mitigation: newMitigation,
            bandwidth: newBandwidth,
            statuses: newPlayerStatuses
        };
        let totalDeathDraw = 0;
        const deathMessages: string[] = [];

        for (let i = 0; i < enemiesDefeatedThisCard; i++) {
            const deathRelicTrigger = applyOnEnemyDeathRelics(newRelics, deathTriggerStats);
            deathTriggerStats = {
                ...deathRelicTrigger.stats,
                statuses: { ...deathRelicTrigger.stats.statuses }
            };
            totalDeathDraw += deathRelicTrigger.drawCards;
            deathMessages.push(...deathRelicTrigger.messages);
        }

        newMitigation = deathTriggerStats.mitigation;
        newBandwidth = deathTriggerStats.bandwidth;
        newPlayerStatuses = { ...deathTriggerStats.statuses };

        if (totalDeathDraw > 0 && newStatus === 'PLAYING') {
            if (newPlayerStatuses.noDraw > 0) {
                newMessage += ` (Draw prevented)`;
            } else {
                const drawRes = drawCards(newDrawPile, newDiscardPile, totalDeathDraw);
                const currentStats = {
                    ...prev.playerStats,
                    hp: newHp,
                    maxHp: newMaxHp,
                    mitigation: newMitigation,
                    bandwidth: newBandwidth,
                    statuses: newPlayerStatuses
                };
                const processed = processDrawnCards(drawRes.drawn, currentHand, drawRes.newDiscard, drawRes.newDraw, currentStats, newMessage);
                currentHand = processed.hand;
                newDrawPile = processed.drawPile;
                newDiscardPile = processed.discard;
                newMitigation = processed.stats.mitigation;
                newBandwidth = processed.stats.bandwidth;
                newPlayerStatuses = { ...processed.stats.statuses };
                newMessage = processed.message;
                triggerFireBreathing(processed.drawnCards);
                drawnCards.push(...processed.drawnCards);
            }
        }

        if (deathMessages.length > 0) {
            newMessage += ` ${deathMessages.join(' ')}`;
        }
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;

    if (newStatus === 'VICTORY') {
        const isBossVictory = prev.enemies.some(e => e.type === 'boss');
        const isEliteVictory = !isBossVictory && prev.enemies.some(e => e.type === 'elite');

        // Calculate Capital
        prev.enemies.forEach(e => {
            if (e.rewards && e.rewards.capital) {
                const min = e.rewards.capital.min;
                const max = e.rewards.capital.max;
                earnedCapital += Math.floor(Math.random() * (max - min + 1)) + min;
            }
        });

        // Elite rewards grant a regular relic. Boss rewards defer to the boss relic screen.
        if (isEliteVictory) {
            earnedRelic = getEliteRelic(newRelics.map(r => r.id)) || undefined;
        }
    }

    // Scope Creep (Gremlin Nob) ENRAGE: Gains +2 Strength each time player plays a Skill
    if (card.type === 'skill') {
        newEnemies.forEach(e => {
            if (e.id.startsWith('scope_creep') && e.hp > 0) {
                e.statuses.strength += 2;
                newMessage += ` Scope Creep Enraged! (+2 Velocity)`;
            }
        });
    }

    // Over-Engineer (Lagavulin): Wake up if damaged
    newEnemies.forEach(e => {
        if (e.id.startsWith('over_engineer') && e.statuses.asleep > 0 && e.hp < e.maxHp) {
            e.statuses.asleep = 0;
            newMessage += ` ${e.name} woke up!`;
        }
    });

    // Generate card rewards for victory
    const cardRewards = newStatus === 'VICTORY'
        ? getRandomRewardCards(3, rng, prev.enemies.some(e => e.type === 'boss') ? 'rare' : undefined)
        : [];
    const shouldGetCardReward = newStatus === 'VICTORY' && prev.enemies.some(e => e.rewards?.card_reward !== false);

    // Check for potion drop on victory
    let pendingPotionReward: typeof prev.pendingPotionReward = undefined;
    let newPotionDropChance = prev.potionDropChance;

    if (newStatus === 'VICTORY') {
        const potionDropResult = checkPotionDrop(newPotionDropChance);
        newPotionDropChance = potionDropResult.newChance;

        if (potionDropResult.dropped && canAcquirePotion(prev.potions)) {
            pendingPotionReward = generateRandomPotion('cto');
            getGlobalLogger().log('POTION_DROP', `Combat dropped "${pendingPotionReward.name}"!`);
        } else if (potionDropResult.dropped) {
            getGlobalLogger().log('POTION_DROP', 'Potion dropped but slots full - skipped.');
        } else {
            getGlobalLogger().log('POTION_DROP', `No potion drop (chance now ${newPotionDropChance}%)`);
        }
    }

    return {
        ...prev,
        playerStats: {
            ...prev.playerStats,
            hp: newHp,
            maxHp: newMaxHp,
            mitigation: newMitigation,
            bandwidth: newBandwidth,
            statuses: newPlayerStatuses,
            // Don't auto-apply capital - player will claim from reward screen
            capital: prev.playerStats.capital
        },
        hand: currentHand,
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        exhaustPile: newExhaustPile,
        enemies: newEnemies,
        status: newStatus,
        message: newMessage,
        pendingDiscard: newPendingDiscard,
        pendingSelection: newPendingSelection,
        relics: newRelics,
        potionDropChance: newPotionDropChance,
        pendingPotionReward: pendingPotionReward,
        lastVictoryReward: newStatus === 'VICTORY' ? {
            capital: earnedCapital,
            cardRewards: shouldGetCardReward ? cardRewards : [],
            relic: earnedRelic,
            goldCollected: false,
            cardCollected: false,
            relicCollected: false
        } : undefined
    };
};
