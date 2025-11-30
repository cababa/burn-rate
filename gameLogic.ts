import { CardData, GameState, EnemyIntent, MapLayer, MapNode, CharacterStats, RelicData, EntityStatus, EnemyData, CardEffect, PlayerStatuses, EnemyStatuses } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE } from './constants.ts';

// --- Math Helpers ---

export const calculateDamage = (baseDamage: number, attackerStatus: EntityStatus, defenderStatus: EntityStatus, strengthMultiplier: number = 1): number => {
    let damage = baseDamage + (attackerStatus.strength * strengthMultiplier);
    if (attackerStatus.weak > 0) damage = damage * 0.75;
    if (defenderStatus.vulnerable > 0) damage = damage * 1.5;
    return Math.floor(damage);
};

export const countCardsMatches = (cards: CardData[], matchString: string): number => {
    return cards.filter(c => c.name.includes(matchString)).length;
};

// --- Deck Helpers ---

export const generateStarterDeck = (): CardData[] => {
    const deck: CardData[] = [];
    for (let i = 0; i < 5; i++) deck.push({ ...GAME_DATA.cards.cto_commit, id: `commit_${i}_${Math.random().toString(36).substr(2, 9)}` });
    for (let i = 0; i < 4; i++) deck.push({ ...GAME_DATA.cards.cto_rollback, id: `rollback_${i}_${Math.random().toString(36).substr(2, 9)}` });
    deck.push({ ...GAME_DATA.cards.cto_hotfix, id: `hotfix_${Math.random().toString(36).substr(2, 9)}` });
    return deck;
};

export const getRandomRewardCards = (count: number): CardData[] => {
    const getRarity = (): 'common' | 'uncommon' | 'rare' => {
        const roll = Math.random() * 100;
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
        const randomCard = finalPool[Math.floor(Math.random() * finalPool.length)];
        rewards.push({ ...randomCard, id: `reward_${Date.now()}_${i}` });
    }
    return rewards;
};

export const shuffle = (cards: CardData[]) => {
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

export const upgradeCard = (card: CardData): CardData => {
    if (card.upgraded) return card;
    if (card.id === 'cto_refactor') {
        const upgradedEffects = [{ type: 'block', value: 9, target: 'self' }, { type: 'exhaust_targeted', value: 1, target: 'self' }] as CardEffect[];
        return { ...card, name: card.name + "+", upgraded: { name: card.name + "+", effects: upgradedEffects }, effects: upgradedEffects, description: "Gain 9 Mitigation. Exhaust a card." };
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
    return { ...card, name: card.name + "+", upgraded: { name: card.name + "+", effects: newEffects }, effects: newEffects, description: newDesc };
};

// --- Relic Helpers ---

export const applyCombatStartRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';
    relics.forEach(relic => {
        if (relic.trigger === 'combat_start' && relic.effect.type === 'block') {
            newStats.mitigation += relic.effect.value;
            message = `Relic Active: ${relic.name} (+${relic.effect.value} Mitigation)`;
        }
    });
    return { stats: newStats, message };
};

export const applyCombatEndRelics = (currentStats: CharacterStats, relics: RelicData[]): { stats: CharacterStats, message: string } => {
    let newStats = { ...currentStats };
    let message = '';
    relics.forEach(relic => {
        if (relic.trigger === 'combat_end' && relic.effect.type === 'heal') {
            const healAmount = relic.effect.value;
            const oldHp = newStats.hp;
            newStats.hp = Math.min(newStats.maxHp, newStats.hp + healAmount);
            const actualHeal = newStats.hp - oldHp;
            if (actualHeal > 0) message = `${relic.name}: Recovered ${actualHeal} Runway.`;
        }
    });
    return { stats: newStats, message };
};

export const getTurnStartBandwidth = (relics: RelicData[]): number => {
    let bandwidth = 3;
    relics.forEach(relic => {
        if (relic.trigger === 'turn_start' && relic.effect.type === 'gain_bandwidth') bandwidth += relic.effect.value;
    });
    return bandwidth;
}

// --- Map Generation ---

export const generateMap = (): MapLayer[] => {
    const floor1: MapNode[] = [
        { id: 'f1_l', type: 'problem', floor: 1, lane: 0, locked: false, completed: false },
        { id: 'f1_r', type: 'problem', floor: 1, lane: 1, locked: false, completed: false }
    ];
    const floor2: MapNode[] = [
        { id: 'f2_l', type: 'problem', floor: 2, lane: 0, locked: false, completed: false },
        { id: 'f2_r', type: 'retrospective', floor: 2, lane: 1, locked: false, completed: false }
    ];
    const floor3: MapNode[] = [
        { id: 'f3_vendor', type: 'vendor', floor: 3, lane: 0, locked: false, completed: false },
        { id: 'f3_elite', type: 'milestone', floor: 3, lane: 1, locked: false, completed: false }
    ];
    const floor4: MapNode[] = [
        { id: 'f4_l', type: 'problem', floor: 4, lane: 0, locked: false, completed: false },
        { id: 'f4_r', type: 'problem', floor: 4, lane: 1, locked: false, completed: false }
    ];
    const floor5: MapNode[] = [
        { id: 'f5_boss', type: 'boss', floor: 5, lane: 0, locked: false, completed: false }
    ];

    return [floor1, floor2, floor3, floor4, floor5];
};

// --- Game Logic ---

export const resolveEndTurn = (prev: GameState): GameState => {
    let nextPlayerStatuses = { ...prev.playerStats.statuses };
    let nextMitigation = prev.playerStats.mitigation;
    let endTurnMessage = 'Enemy is executing intent...';

    if (nextPlayerStatuses.vulnerable > 0) nextPlayerStatuses.vulnerable--;
    if (nextPlayerStatuses.weak > 0) nextPlayerStatuses.weak--;
    if (nextPlayerStatuses.noDraw > 0) nextPlayerStatuses.noDraw = 0;

    if (nextPlayerStatuses.metallicize > 0) nextMitigation += nextPlayerStatuses.metallicize;

    const cardsToDiscard: CardData[] = [];
    const cardsToExhaust: CardData[] = [];
    const cardsToRetain: CardData[] = [];

    prev.hand.forEach(card => {
        if (card.ethereal) cardsToExhaust.push(card);
        else if (card.retain) cardsToRetain.push(card);
        else cardsToDiscard.push(card);
    });

    if (cardsToExhaust.length > 0) {
        endTurnMessage += ` ${cardsToExhaust.length} card(s) faded away.`;
        if (nextPlayerStatuses.feelNoPain > 0) nextMitigation += (nextPlayerStatuses.feelNoPain * cardsToExhaust.length);
    }
    if (cardsToRetain.length > 0) endTurnMessage += ` Retained ${cardsToRetain.length} card(s).`;

    return {
        ...prev,
        playerStats: { ...prev.playerStats, statuses: nextPlayerStatuses, mitigation: nextMitigation },
        discardPile: [...prev.discardPile, ...cardsToDiscard],
        exhaustPile: [...prev.exhaustPile, ...cardsToExhaust],
        hand: cardsToRetain,
        status: 'ENEMY_TURN',
        message: endTurnMessage
    };
};

export const resolveEnemyTurn = (prev: GameState): GameState => {
    let newPlayerHp = prev.playerStats.hp;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newMessage = '';
    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    let enemiesToSpawn: EnemyData[] = [];
    let nextDrawPile = [...prev.drawPile];

    newEnemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const intent = enemy.currentIntent;

        if (intent.type === 'attack') {
            let attackValue = intent.value;
            if (enemy.id === 'boss_burn_rate' && intent.description.includes('Divider')) {
                const hits = 6;
                const dmgPerHit = Math.floor(newPlayerHp / 12) + 1;
                attackValue = dmgPerHit * hits;
                newMessage += ` Divider dealt ${hits}x${dmgPerHit} damage!`;
            }

            const damage = calculateDamage(attackValue, enemy.statuses, newPlayerStatuses);
            let unblockedDamage = damage;

            if (newPlayerStatuses.thorns > 0) {
                enemy.hp -= newPlayerStatuses.thorns;
                newMessage += ` Thorns dealt ${newPlayerStatuses.thorns} to ${enemy.name}.`;
            }

            if (newMitigation > 0) {
                const blocked = Math.min(newMitigation, unblockedDamage);
                newMitigation -= blocked;
                unblockedDamage -= blocked;
            }
            newPlayerHp -= unblockedDamage;
            if (unblockedDamage > 0) newMessage += ` ${enemy.name} caused ${unblockedDamage} Burn.`;
            else newMessage += ` Blocked ${enemy.name}.`;
        } else if (intent.type === 'buff') {
            if (intent.description.includes('Growth') || intent.description.includes('Ritual')) {
                enemy.statuses.strength += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Strength.`;
            } else if (intent.description.includes('Block') || intent.description.includes('Barricade')) {
                enemy.mitigation += intent.value;
                newMessage += ` ${enemy.name} gained ${intent.value} Block.`;
            } else if (intent.description.includes('Escape')) {
                enemy.hp = 0;
                enemy.maxHp = 0;
                newMessage += ` ${enemy.name} Escaped with your capital!`;
            } else if (intent.description.includes('Split') && enemy.id === 'boss_the_monolith') {
                const acidL = { ...GAME_DATA.enemies.legacy_module, id: `legacy_module_split_${Date.now()}_acid`, hp: 70, maxHp: 70 };
                const spikeL = { ...GAME_DATA.enemies.merge_conflict, id: `merge_conflict_split_${Date.now()}_spike`, hp: 70, maxHp: 70 };
                enemiesToSpawn.push(acidL, spikeL);
                enemy.hp = 0;
                newMessage += ` ${enemy.name} Split into two!`;
            }
        } else if (intent.type === 'debuff') {
            if (enemy.id.startsWith('legacy_') && intent.description.includes('Shuffle Bugs')) {
                const bugCard = GAME_DATA.cards.card_bug;
                nextDrawPile.push({ ...bugCard, id: `card_bug_${Date.now()}_1` }, { ...bugCard, id: `card_bug_${Date.now()}_2` });
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} shuffled 2 Bugs into your roadmap!`;
            } else if (intent.description.includes('Slimed')) {
                const slime = { ...GAME_DATA.cards.status_scope_creep, id: `status_scope_creep_${Date.now()}` };
                nextDrawPile.push(slime);
                nextDrawPile = shuffle(nextDrawPile);
                newMessage += ` ${enemy.name} Slimed you!`;
            } else if (intent.description.includes('Weak')) {
                newPlayerStatuses.weak += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Weak.`;
            } else if (intent.description.includes('Vulnerable')) {
                newPlayerStatuses.vulnerable += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Vulnerable.`;
            } else if (intent.description.includes('Frail')) {
                newPlayerStatuses.frail += intent.value;
                newMessage += ` ${enemy.name} applied ${intent.value} Frail.`;
            }
        }

        if (enemy.statuses.vulnerable > 0) enemy.statuses.vulnerable--;
        if (enemy.statuses.weak > 0) enemy.statuses.weak--;
        if (enemy.statuses.growth > 0) enemy.statuses.strength += enemy.statuses.growth;
        if (enemy.statuses.metallicize > 0) {
            enemy.mitigation += enemy.statuses.metallicize;
            newMessage += ` ${enemy.name} hardened (+${enemy.statuses.metallicize} Blk).`;
        }
        enemy.mitigation = 0; // Clear block at start of enemy turn action
        if (enemy.statuses.metallicize > 0) enemy.mitigation += enemy.statuses.metallicize;
    });

    if (enemiesToSpawn.length > 0) newEnemies = [...newEnemies, ...enemiesToSpawn];

    let newStatus: GameState['status'] = 'PLAYING';
    if (newPlayerHp <= 0) {
        newStatus = 'GAME_OVER';
        newMessage = "RUNWAY DEPLETED. STARTUP FAILED.";
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;
    let newRelics = [...prev.relics];

    if (newEnemies.every(e => e.hp <= 0) && newStatus !== 'GAME_OVER') {
        newStatus = 'VICTORY';
        newMessage = "PROBLEM SOLVED.";
        newEnemies.forEach(enemyData => {
            if (enemyData.maxHp === 0) return;
            if (enemyData.rewards) {
                const { min, max } = enemyData.rewards.capital;
                earnedCapital += Math.floor(Math.random() * (max - min + 1)) + min;
                if (enemyData.type === 'elite') {
                    const hasCoffee = prev.relics.some(r => r.id === 'relic_coffee_drip');
                    if (!hasCoffee && !earnedRelic) {
                        earnedRelic = GAME_DATA.relics.coffee_drip;
                        newRelics.push(earnedRelic);
                        newMessage += ` Found Relic: ${earnedRelic.name}.`;
                    }
                }
            } else {
                earnedCapital += 15;
            }
        });
        newMessage += ` Earned $${earnedCapital}k Capital.`;
    }

    const nextTurn = prev.turn + 1;
    newEnemies.forEach(enemy => {
        if (enemy.hp > 0) {
             let nextIntent: EnemyIntent = enemy.currentIntent;
             const cycle = nextTurn; // Simplified cycle based on turn number

             if (enemy.id === 'fanboy') {
                 if (cycle === 1) nextIntent = { type: 'buff', value: 3, icon: 'buff', description: "Ritual (Hype)" };
                 else {
                     const dmg = 6 + enemy.statuses.strength;
                     nextIntent = { type: 'attack', value: dmg, icon: 'attack', description: `${dmg} Dark Strike` };
                 }
             } else if (enemy.id === 'scope_creep') {
                 if (cycle === 1) nextIntent = { type: 'buff', value: 0, icon: 'buff', description: "Bellow (Enrage)" };
                 else if (cycle === 2) nextIntent = { type: 'debuff', value: 2, icon: 'debuff', description: "Skull Bash (Vuln)" };
                 else nextIntent = { type: 'attack', value: 14, icon: 'attack', description: "Rush" };
             } else if (enemy.id === 'boss_the_pivot') {
                 const bossCycle = cycle % 4;
                 if (bossCycle === 1) nextIntent = { type: 'buff', value: 9, icon: 'buff', description: "Charging Up (Block)" };
                 else if (bossCycle === 2) nextIntent = { type: 'attack', value: 32, icon: 'attack', description: "Fierce Bash" };
                 else if (bossCycle === 3) nextIntent = { type: 'debuff', value: 2, icon: 'debuff', description: "Vent Steam (Vuln)" };
                 else nextIntent = { type: 'attack', value: 5, icon: 'attack', description: "Whirlwind (x4)" };
             }

             enemy.currentIntent = nextIntent;
        }
    });

    const nextBandwidth = getTurnStartBandwidth(prev.relics);
    let nextPlayerStats = {
        ...prev.playerStats,
        hp: Math.max(0, newPlayerHp),
        mitigation: 0,
        bandwidth: nextBandwidth,
        statuses: { ...newPlayerStatuses, thorns: 0 }
    };

    if (newStatus === 'VICTORY') {
        nextPlayerStats.capital += earnedCapital;
        const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(nextPlayerStats, newRelics);
        nextPlayerStats = afterRelicStats;
        if (relicMsg) newMessage += ` ${relicMsg}`;
    }

    let nextState = {
        ...prev,
        playerStats: nextPlayerStats,
        relics: newRelics,
        enemies: newEnemies,
        turn: nextTurn,
        status: newStatus,
        message: newMessage,
        lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
    };

    if (newStatus === 'PLAYING') {
        const { drawn, newDraw, newDiscard } = drawCards(nextDrawPile, prev.discardPile, 5);
        
        let nextHand = [...prev.hand];
        let nextDiscard = newDiscard;
        
        drawn.forEach(card => {
            if (nextHand.length < MAX_HAND_SIZE) {
                nextHand.push(card);
            } else {
                nextDiscard.push(card);
                newMessage += ` (Hand full! Burned ${card.name})`;
            }
        });

        nextState.hand = nextHand;
        nextState.drawPile = newDraw;
        nextState.discardPile = nextDiscard;
        nextState.message = newMessage;
    }

    return nextState;
};

export const resolveCardEffect = (prev: GameState, card: CardData, target: 'enemy' | 'self', targetEnemyId?: string): GameState => {
    const costPaid = card.cost === -1 ? prev.playerStats.bandwidth : card.cost;

    if (prev.playerStats.bandwidth < costPaid) {
        return { ...prev, message: "Not enough Bandwidth to deploy component." };
    }

    let newEnemies = prev.enemies.map(e => ({ ...e, statuses: { ...e.statuses } }));
    const targetId = targetEnemyId || prev.selectedEnemyId || (newEnemies.length > 0 ? newEnemies[0].id : undefined);
    const targetEnemyIndex = newEnemies.findIndex(e => e.id === targetId);
    let targetEnemy = targetEnemyIndex !== -1 ? newEnemies[targetEnemyIndex] : null;

    let newMessage = `Deployed ${card.name}.`;
    let newStatus = prev.status;
    let newMitigation = prev.playerStats.mitigation;
    let newPlayerStatuses = { ...prev.playerStats.statuses };
    let newBandwidth = prev.playerStats.bandwidth - costPaid;
    let newPendingDiscard = 0;
    let newPendingSelection = prev.pendingSelection;
    let newRelics = [...prev.relics];

    let drawnCards: CardData[] = [];
    let newDrawPile = [...prev.drawPile];
    let newDiscardPile = [...prev.discardPile];
    let newExhaustPile = [...prev.exhaustPile];
    let currentHand = [...prev.hand.filter(c => c.id !== card.id)];

    const executeEffect = (effect: CardEffect, loops: number = 1) => {
        for (let i = 0; i < loops; i++) {
            if (effect.type === 'damage') {
                let targets: EnemyData[] = [];
                if (effect.target === 'all_enemies') targets = newEnemies;
                else if (target === 'enemy' && targetEnemy) targets = [targetEnemy];

                targets.forEach(t => {
                    let finalDamage = calculateDamage(effect.value, prev.playerStats.statuses, t.statuses, effect.strengthMultiplier || 1);
                    if (t.statuses.vulnerable > 0) newMessage += " (Vuln!)";
                    if (prev.playerStats.statuses.weak > 0) newMessage += " (Weak...)";

                    if (t.mitigation > 0) {
                        const blocked = Math.min(t.mitigation, finalDamage);
                        t.mitigation -= blocked;
                        finalDamage -= blocked;
                        newMessage += ` (${blocked} Blocked)`;
                    }

                    t.hp = Math.max(0, t.hp - finalDamage);
                    newMessage += ` Dealt ${finalDamage} execution.`;

                    if (t.statuses.curlUp > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.curlUp;
                        t.statuses.curlUp = 0;
                        newMessage += ` ${t.name} Curled Up! (+${t.statuses.curlUp} Blk)`;
                    }
                    if (t.statuses.malleable > 0 && finalDamage > 0) {
                        t.mitigation += t.statuses.malleable;
                        t.statuses.malleable += 1;
                        newMessage += ` ${t.name} is Malleable! (+${t.statuses.malleable} Blk)`;
                    }
                    if (t.statuses.asleep > 0 && finalDamage > 0) {
                        t.statuses.asleep = 0;
                        newMessage += ` ${t.name} Woke Up!`;
                    }
                });

                if (newEnemies.every(e => e.hp <= 0)) {
                    newStatus = 'VICTORY';
                    newMessage = "PROBLEM SOLVED. FEATURE DEPLOYED.";
                }
            } else if (effect.type === 'block') {
                let blockAmount = effect.value;
                if (newPlayerStatuses.frail > 0) blockAmount = Math.floor(blockAmount * 0.75);
                newMitigation += blockAmount;
                newMessage += ` gained ${blockAmount} Mitigation.`;
            } else if (effect.type === 'draw') {
                if (newPlayerStatuses.noDraw > 0) newMessage += ` (Draw prevented)`;
                else {
                    const result = drawCards(newDrawPile, newDiscardPile, effect.value);
                    newDrawPile = result.newDraw;
                    newDiscardPile = result.newDiscard;
                    
                    result.drawn.forEach(c => {
                        if (currentHand.length + drawnCards.length < MAX_HAND_SIZE) {
                            drawnCards.push(c);
                        } else {
                            newDiscardPile.push(c);
                            newMessage += ` (Hand full! Burned ${c.name})`;
                        }
                    });
                    
                    newMessage += ` Drew ${result.drawn.length} cards.`;
                }
            } else if (effect.type === 'apply_status') {
                const amount = effect.value;
                const statusType = effect.status || 'vulnerable';
                if (effect.target === 'self') {
                    if (statusType === 'strength') newPlayerStatuses.strength += amount;
                } else if (targetEnemy) {
                    if (statusType === 'vulnerable') targetEnemy.statuses.vulnerable += amount;
                    if (statusType === 'weak') targetEnemy.statuses.weak += amount;
                }
            }
        }
    };

    card.effects.forEach(effect => {
        let loops = 1;
        if (card.cost === -1) loops = costPaid;
        executeEffect(effect, loops);
    });

    if (card.exhaust) {
        newExhaustPile.push(card);
        if (newPlayerStatuses.feelNoPain > 0) newMitigation += newPlayerStatuses.feelNoPain;
    } else {
        newDiscardPile.push(card);
    }

    let earnedCapital = 0;
    let earnedRelic: RelicData | undefined;

    return {
        ...prev,
        playerStats: { ...prev.playerStats, mitigation: newMitigation, bandwidth: newBandwidth, statuses: newPlayerStatuses },
        hand: [...currentHand, ...drawnCards],
        drawPile: newDrawPile,
        discardPile: newDiscardPile,
        exhaustPile: newExhaustPile,
        enemies: newEnemies,
        status: newStatus,
        message: newMessage,
        pendingDiscard: newPendingDiscard,
        pendingSelection: newPendingSelection,
        lastVictoryReward: newStatus === 'VICTORY' ? { capital: earnedCapital, relic: earnedRelic } : undefined
    };
};
