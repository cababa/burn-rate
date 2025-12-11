/**
 * SimulationRunner - Runs automated game simulations with logging
 */

import { GameState, CardData, EnemyData, MapNode, RelicData, PotionData, NeowBlessing } from './types.ts';
import { GAME_DATA, ACT1_EVENTS, generateBlessingOptions } from './constants.ts';
import {
    generateStarterDeck,
    generateMap,
    shuffle,
    drawCards,
    resolveEndTurn,
    resolveEnemyTurn,
    resolveCardEffect,
    getTurnStartBandwidth,
    applyCombatStartRelics,
    applyCombatEndRelics,
    getRandomRewardCards,
    getEncounterForFloor,
    getEliteEncounter,
    getBossEncounter,
    processDrawnCards,
    getRandomRelic,
    getTreasureRelic,
    getEliteRelic,
    getBossRelicChoices,
    getBossRelicSkipGold,
    // Potion functions
    checkPotionDrop,
    generateRandomPotion,
    addPotionToSlot,
    canAcquirePotion,
    resolvePotionEffect,
    upgradeCard
} from './gameLogic.ts';
import { GameLogger, LogCategory } from './logger.ts';
import { AIPlayer, createAI, getAllStrategies } from './aiPlayer.ts';

export interface SimulationConfig {
    runs: number;
    aiStrategy: 'aggressive' | 'defensive' | 'balanced' | 'smart' | 'random';
    verboseLogging: boolean;
    maxTurnsPerCombat: number;
    maxFloors: number;
}

export interface SimulationResult {
    simId: number;
    win: boolean;
    floor: number;
    turns: number;
    reason: string;
    finalHp: number;
    deckSize: number;
    relicsCollected: number;
    capitalEarned: number;
    logger: GameLogger;
}

export interface SummaryStats {
    totalRuns: number;
    wins: number;
    winRate: number;
    avgFloor: number;
    maxFloor: number;
    avgTurns: number;
    avgFinalHp: number;
    avgDeckSize: number;
    deathReasons: Record<string, number>;
}

/**
 * Apply Neow blessing effects to game state
 */
function applyBlessingEffect(state: GameState, blessing: NeowBlessing, logger: GameLogger): GameState {
    let gameState = { ...state, playerStats: { ...state.playerStats } };

    for (const effect of blessing.effects) {
        switch (effect.type) {
            case 'gold':
                gameState.playerStats.capital = (gameState.playerStats.capital || 0) + (effect.value || 0);
                logger.log('REWARD_CAPITAL', `Blessing: Gained $${effect.value}k`, { capital: effect.value });
                break;
            case 'max_hp':
                gameState.playerStats.maxHp += effect.value || 0;
                gameState.playerStats.hp += effect.value || 0;
                logger.log('HEAL', `Blessing: Gained ${effect.value} max HP`, { maxHp: gameState.playerStats.maxHp });
                break;
            case 'upgrade_card':
                // Upgrade a random card
                const upgradable = gameState.deck.filter(c => !c.upgraded && c.type !== 'status');
                if (upgradable.length > 0) {
                    const cardToUpgrade = upgradable[Math.floor(Math.random() * upgradable.length)];
                    const upgraded = upgradeCard(cardToUpgrade);
                    gameState.deck = gameState.deck.map(c => c.id === cardToUpgrade.id ? upgraded : c);
                    logger.log('CARD_PLAY', `Blessing: Upgraded ${cardToUpgrade.name}`, { cardName: cardToUpgrade.name });
                }
                break;
            case 'random_relic':
                const newRelic = getRandomRelic('uncommon', gameState.relics.map(r => r.id));
                if (newRelic) {
                    gameState.relics = [...gameState.relics, newRelic];
                    logger.log('RELIC_ACQUIRED', `Blessing: Gained ${newRelic.name}`, { relicName: newRelic.name });
                }
                break;
        }
    }

    // Apply downside if present
    if (blessing.downside) {
        if (blessing.downside.type === 'max_hp' && blessing.downside.percent) {
            const hpLoss = Math.floor(gameState.playerStats.maxHp * Math.abs(blessing.downside.percent) / 100);
            gameState.playerStats.maxHp -= hpLoss;
            gameState.playerStats.hp = Math.min(gameState.playerStats.hp, gameState.playerStats.maxHp);
            logger.log('DAMAGE_TAKEN', `Blessing downside: Lost ${hpLoss} max HP`, { damage: hpLoss });
        }
    }

    logger.log('RELIC', `Neow Blessing: ${blessing.description}`, { blessingId: blessing.id });
    return gameState;
}

/**
 * Apply event choice effects to game state
 */
function applyEventEffects(state: GameState, effects: any[], logger: GameLogger): GameState {
    let gameState = { ...state, playerStats: { ...state.playerStats } };

    for (const effect of effects) {
        switch (effect.type) {
            case 'gain_gold':
                gameState.playerStats.capital = (gameState.playerStats.capital || 0) + (effect.value || 0);
                logger.log('REWARD_CAPITAL', `Event: Gained $${effect.value}k`, { capital: effect.value });
                break;
            case 'lose_gold':
                gameState.playerStats.capital = Math.max(0, (gameState.playerStats.capital || 0) - (effect.value || 0));
                logger.log('MAP_NODE', `Event: Lost $${effect.value}k`, { capital: effect.value });
                break;
            case 'gain_hp':
                const healAmount = effect.value || 0;
                gameState.playerStats.hp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + healAmount);
                logger.log('HEAL', `Event: Healed ${healAmount} HP`, { amount: healAmount });
                break;
            case 'lose_hp':
                const damageAmount = effect.value || 0;
                gameState.playerStats.hp = Math.max(1, gameState.playerStats.hp - damageAmount);
                logger.log('DAMAGE_TAKEN', `Event: Lost ${damageAmount} HP`, { damage: damageAmount });
                break;
            case 'gain_max_hp':
                gameState.playerStats.maxHp += effect.value || 0;
                gameState.playerStats.hp += effect.value || 0;
                logger.log('HEAL', `Event: Gained ${effect.value} max HP`, { maxHp: gameState.playerStats.maxHp });
                break;
            case 'lose_max_hp':
                const maxHpLoss = effect.value || 0;
                gameState.playerStats.maxHp = Math.max(1, gameState.playerStats.maxHp - maxHpLoss);
                gameState.playerStats.hp = Math.min(gameState.playerStats.hp, gameState.playerStats.maxHp);
                logger.log('DAMAGE_TAKEN', `Event: Lost ${maxHpLoss} max HP`, { damage: maxHpLoss });
                break;
            case 'gain_relic':
                const relic = getRandomRelic('uncommon', gameState.relics.map(r => r.id));
                if (relic) {
                    gameState.relics = [...gameState.relics, relic];
                    logger.log('RELIC_ACQUIRED', `Event: Gained ${relic.name}`, { relicName: relic.name });
                }
                break;
            case 'upgrade_card':
                const upgradable = gameState.deck.filter(c => !c.upgraded && c.type !== 'status');
                for (let i = 0; i < (effect.value || 1) && i < upgradable.length; i++) {
                    const card = upgradable[i];
                    const upgraded = upgradeCard(card);
                    gameState.deck = gameState.deck.map(c => c.id === card.id ? upgraded : c);
                    logger.log('CARD_PLAY', `Event: Upgraded ${card.name}`, { cardName: card.name });
                }
                break;
            case 'nothing':
                // Do nothing
                break;
        }
    }

    return gameState;
}

/**
 * Run a single simulation with comprehensive logging
 */
export function runSimulation(
    simId: number,
    ai: AIPlayer,
    config: SimulationConfig
): SimulationResult {
    const logger = new GameLogger(config.verboseLogging);

    // Initialize game state
    const initialDeck = shuffle(generateStarterDeck());
    let gameState: GameState = {
        playerStats: { ...GAME_DATA.character.stats },
        enemies: [],
        hand: [],
        drawPile: initialDeck,
        deck: [...initialDeck],
        discardPile: [],
        exhaustPile: [],
        relics: [GAME_DATA.relics.git_repository],
        turn: 0,
        floor: 1,
        status: 'MAP',
        rewardOptions: [],
        message: '',
        map: generateMap(),
        currentMapPosition: null,
        vendorStock: [],
        pendingDiscard: 0,
        // Potion system
        potions: [null, null, null],
        potionSlotCount: 3,
        potionDropChance: 40,
        duplicateNextCard: false,
        seed: 'TEST'
    };

    let totalTurns = 0;
    let totalCapital = 0;

    // Neow Blessing selection at game start
    if (ai.selectBlessing) {
        const blessingOptions = generateBlessingOptions();
        const selectedBlessing = ai.selectBlessing(blessingOptions);
        gameState = applyBlessingEffect(gameState, selectedBlessing, logger);
    }

    logger.log('COMBAT_START', `Simulation ${simId} started with ${ai.name} AI`, {
        deckSize: gameState.deck.length,
        startingHp: gameState.playerStats.hp
    });

    // Main game loop
    while (gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY_ALL') {
        if (gameState.floor > config.maxFloors) {
            logger.log('VICTORY', 'Completed all floors!', { floor: gameState.floor });
            return createResult(simId, true, gameState, totalTurns, 'Completed run', logger, totalCapital);
        }

        // Map navigation
        if (gameState.status === 'MAP') {
            logger.setFloor(gameState.floor);

            const floorNodes = gameState.map[gameState.floor - 1];
            if (!floorNodes || floorNodes.length === 0) {
                return createResult(simId, true, gameState, totalTurns, 'No more floors', logger, totalCapital);
            }

            // Get accessible nodes
            let accessibleNodes: MapNode[];
            if (gameState.currentMapPosition === null) {
                accessibleNodes = floorNodes;
            } else {
                const currentNode = gameState.map[gameState.currentMapPosition.floor - 1]
                    ?.find(n => n.id === gameState.currentMapPosition!.nodeId);
                if (currentNode) {
                    accessibleNodes = floorNodes.filter(n => currentNode.connections.includes(n.id));
                } else {
                    accessibleNodes = floorNodes;
                }
            }

            if (accessibleNodes.length === 0) {
                accessibleNodes = floorNodes;
            }

            const selectedNode = ai.selectMapNode(gameState, accessibleNodes);
            gameState.currentMapPosition = { floor: gameState.floor, nodeId: selectedNode.id };

            logger.log('MAP_NODE', `Entered ${selectedNode.type} node`, {
                floor: gameState.floor,
                nodeType: selectedNode.type,
                nodeId: selectedNode.id
            });

            // Handle node type
            gameState = handleMapNode(gameState, selectedNode, ai, logger, config);
        }

        // Combat logic
        if (gameState.status === 'PLAYING') {
            let combatTurns = 0;

            while (gameState.status === 'PLAYING' && combatTurns < config.maxTurnsPerCombat) {
                logger.setTurn(gameState.turn);

                // AI considers using potions at start of combat turn
                if (ai.selectPotion) {
                    let potionUsed = true;
                    while (potionUsed && gameState.status === 'PLAYING') {
                        const potionDecision = ai.selectPotion(gameState);
                        if (potionDecision) {
                            const { potion, slotIndex, targetEnemyId } = potionDecision;
                            logger.log('POTION_USE', `Used "${potion.name}"`, {
                                potionName: potion.name,
                                slotIndex,
                                targetEnemyId,
                                potionRarity: potion.rarity
                            });

                            gameState = resolvePotionEffect(gameState, potion, slotIndex, targetEnemyId);
                        } else {
                            potionUsed = false;
                        }
                    }
                }

                // Player turn - play cards until AI says stop
                let cardsPlayed = 0;
                while (gameState.status === 'PLAYING') {
                    const decision = ai.selectCard(gameState);
                    if (!decision) {
                        logger.log('TURN_END', 'Player ended turn', {
                            cardsPlayed,
                            handSize: gameState.hand.length,
                            energy: gameState.playerStats.bandwidth
                        });
                        break;
                    }

                    const { card, targetEnemyId } = decision;
                    const prevHp = gameState.enemies.map(e => ({ id: e.id, hp: e.hp, statuses: { ...e.statuses } }));
                    const prevPlayerMitigation = gameState.playerStats.mitigation;
                    const prevPlayerStatuses = { ...gameState.playerStats.statuses };
                    const prevHandSize = gameState.hand.length;

                    logger.log('CARD_PLAY', `Played "${card.name}"`, {
                        cardName: card.name,
                        cardId: card.id,
                        cardCost: card.cost === -1 ? gameState.playerStats.bandwidth : card.cost,
                        cardType: card.type,
                        target: targetEnemyId ? gameState.enemies.find(e => e.id === targetEnemyId)?.name : undefined,
                        playerEnergy: gameState.playerStats.bandwidth
                    });

                    gameState = resolveCardEffect(gameState, card, 'enemy', targetEnemyId);
                    cardsPlayed++;

                    // Log block gained
                    if (gameState.playerStats.mitigation > prevPlayerMitigation) {
                        const blockGained = gameState.playerStats.mitigation - prevPlayerMitigation;
                        logger.log('BLOCK_GAINED', `Gained ${blockGained} Mitigation`, {
                            amount: blockGained,
                            playerBlock: gameState.playerStats.mitigation
                        });
                    }

                    // Log cards drawn (from effects like Flow State)
                    const newCards = gameState.hand.length - prevHandSize + 1; // +1 because we removed the played card
                    if (newCards > 0) {
                        logger.log('CARD_DRAW', `Drew ${newCards} card(s)`, {
                            amount: newCards
                        });
                    }

                    // Log player status changes
                    const statusChanges: string[] = [];
                    if (gameState.playerStats.statuses.strength !== prevPlayerStatuses.strength) {
                        const diff = gameState.playerStats.statuses.strength - prevPlayerStatuses.strength;
                        statusChanges.push(`Strength ${diff > 0 ? '+' : ''}${diff}`);
                    }
                    if (gameState.playerStats.statuses.metallicize !== prevPlayerStatuses.metallicize) {
                        statusChanges.push(`Metallicize +${gameState.playerStats.statuses.metallicize - prevPlayerStatuses.metallicize}`);
                    }
                    if (gameState.playerStats.statuses.thorns !== prevPlayerStatuses.thorns) {
                        statusChanges.push(`Thorns +${gameState.playerStats.statuses.thorns - prevPlayerStatuses.thorns}`);
                    }
                    if (gameState.playerStats.statuses.noDraw !== prevPlayerStatuses.noDraw && gameState.playerStats.statuses.noDraw > 0) {
                        statusChanges.push(`No Draw applied`);
                    }
                    if (statusChanges.length > 0) {
                        logger.log('STATUS_APPLIED', `Player: ${statusChanges.join(', ')}`, {
                            details: statusChanges.join(', ')
                        });
                    }

                    // Log damage dealt and status effects on enemies
                    for (const enemy of gameState.enemies) {
                        const prev = prevHp.find(p => p.id === enemy.id);
                        if (prev && prev.hp > enemy.hp) {
                            logger.log('DAMAGE_DEALT', `Dealt ${prev.hp - enemy.hp} damage to ${enemy.name}`, {
                                target: enemy.name,
                                amount: prev.hp - enemy.hp,
                                targetHpBefore: prev.hp,
                                targetHpAfter: enemy.hp
                            });
                        }
                        if (enemy.hp <= 0 && prev && prev.hp > 0) {
                            logger.log('ENEMY_DEATH', `${enemy.name} defeated!`, {
                                enemyName: enemy.name,
                                enemyId: enemy.id
                            });
                        }
                        // Log status effects applied to enemies
                        if (prev) {
                            const enemyStatusChanges: string[] = [];
                            if (enemy.statuses.vulnerable !== prev.statuses.vulnerable) {
                                const diff = enemy.statuses.vulnerable - prev.statuses.vulnerable;
                                if (diff > 0) enemyStatusChanges.push(`Vulnerable +${diff}`);
                            }
                            if (enemy.statuses.weak !== prev.statuses.weak) {
                                const diff = enemy.statuses.weak - prev.statuses.weak;
                                if (diff > 0) enemyStatusChanges.push(`Weak +${diff}`);
                            }
                            if (enemy.statuses.strength !== prev.statuses.strength) {
                                const diff = enemy.statuses.strength - prev.statuses.strength;
                                enemyStatusChanges.push(`Strength ${diff > 0 ? '+' : ''}${diff}`);
                            }
                            if (enemyStatusChanges.length > 0) {
                                logger.log('STATUS_APPLIED', `${enemy.name}: ${enemyStatusChanges.join(', ')}`, {
                                    target: enemy.name,
                                    details: enemyStatusChanges.join(', ')
                                });
                            }
                        }
                    }

                    // Handle selections
                    if (gameState.status === 'CARD_SELECTION' || gameState.status === 'DISCARD_SELECTION') {
                        gameState = handleSelection(gameState, ai, logger);
                    }

                    if (gameState.status === 'VICTORY') break;
                }

                if (gameState.status !== 'PLAYING') break;

                // End turn
                const prevPlayerHp = gameState.playerStats.hp;
                gameState = resolveEndTurn(gameState);

                if (gameState.status === 'ENEMY_TURN') {
                    // Log enemy intents before execution (fix duplication)
                    for (const enemy of gameState.enemies) {
                        if (enemy.hp > 0) {
                            logger.log('ENEMY_INTENT', `${enemy.name}: ${enemy.currentIntent.description}`, {
                                enemyName: enemy.name,
                                intentType: enemy.currentIntent.type,
                                intentValue: enemy.currentIntent.value,
                                intentDescription: enemy.currentIntent.description
                            });
                        }
                    }

                    const prevMitigation = gameState.playerStats.mitigation;
                    gameState = resolveEnemyTurn(gameState);

                    // Log damage taken with block info
                    if (gameState.playerStats.hp < prevPlayerHp) {
                        const damageTaken = prevPlayerHp - gameState.playerStats.hp;
                        const blockedDamage = Math.max(0, prevMitigation - gameState.playerStats.mitigation);
                        logger.log('DAMAGE_TAKEN', `Player took ${damageTaken} damage`, {
                            amount: damageTaken,
                            blocked: blockedDamage,
                            unblocked: damageTaken,
                            playerHp: gameState.playerStats.hp,
                            playerMaxHp: gameState.playerStats.maxHp
                        });
                    } else if (prevMitigation > gameState.playerStats.mitigation) {
                        // Blocked all damage
                        const blockedDamage = prevMitigation - gameState.playerStats.mitigation;
                        logger.log('BLOCK_USED', `Blocked ${blockedDamage} damage`, {
                            blocked: blockedDamage,
                            remainingBlock: gameState.playerStats.mitigation
                        });
                    }

                    if (gameState.status === 'GAME_OVER') {
                        logger.log('DEFEAT', 'Player died!', {
                            floor: gameState.floor,
                            turn: gameState.turn
                        });
                        return createResult(simId, false, gameState, totalTurns + combatTurns, 'Died in combat', logger, totalCapital);
                    }
                }

                combatTurns++;
                totalTurns++;
            }

            if (combatTurns >= config.maxTurnsPerCombat) {
                logger.log('DEFEAT', 'Combat timeout', { turns: combatTurns });
                return createResult(simId, false, gameState, totalTurns, 'Combat timeout', logger, totalCapital);
            }
        }

        // Victory - handle rewards
        if (gameState.status === 'VICTORY') {
            // Apply combat end relic effects (e.g., Git Repository heal)
            const prevHp = gameState.playerStats.hp;
            const { stats: afterRelicStats, message: relicMsg } = applyCombatEndRelics(
                gameState.playerStats,
                gameState.relics
            );
            gameState.playerStats = afterRelicStats;

            if (relicMsg) {
                const healAmount = gameState.playerStats.hp - prevHp;
                logger.log('RELIC', relicMsg, {
                    amount: healAmount,
                    playerHp: gameState.playerStats.hp
                });
            }

            const reward = gameState.lastVictoryReward;
            if (reward) {
                totalCapital += reward.capital || 0;
                gameState.playerStats.capital = (gameState.playerStats.capital || 0) + (reward.capital || 0);
                logger.log('REWARD', 'Combat rewards', {
                    capital: reward.capital,
                    relicName: reward.relic?.name
                });
            } else {
                // Generate gold reward based on enemy type (StS-style ranges)
                const enemyType = gameState.enemies[0]?.type || 'normal';
                let goldReward = 0;
                if (enemyType === 'boss') {
                    goldReward = 95 + Math.floor(Math.random() * 10); // 95-105 gold
                } else if (enemyType === 'elite') {
                    goldReward = 25 + Math.floor(Math.random() * 30); // 25-55 gold
                } else {
                    goldReward = 10 + Math.floor(Math.random() * 15); // 10-25 gold
                }
                totalCapital += goldReward;
                gameState.playerStats.capital = (gameState.playerStats.capital || 0) + goldReward;
                logger.log('REWARD', `Earned $${goldReward}k capital`, {
                    capital: goldReward,
                    totalCapital: gameState.playerStats.capital
                });
            }

            // Card reward
            const cardRewards = getRandomRewardCards(3);
            const selectedCard = ai.selectReward(gameState, cardRewards);
            if (selectedCard) {
                gameState.deck.push(selectedCard);
                logger.log('REWARD', `Added "${selectedCard.name}" to deck`, {
                    cardName: selectedCard.name,
                    cardRarity: selectedCard.rarity,
                    deckSize: gameState.deck.length
                });
            }

            // Potion reward (check drop based on potionDropChance)
            const potionDropResult = checkPotionDrop(gameState.potionDropChance);
            gameState.potionDropChance = potionDropResult.newChance;

            if (potionDropResult.dropped && canAcquirePotion(gameState.potions)) {
                const newPotion = generateRandomPotion('cto', false);
                if (newPotion) {
                    gameState.potions = addPotionToSlot(gameState.potions, newPotion);
                    logger.log('POTION_DROP', `Combat dropped "${newPotion.name}"!`, {
                        potionName: newPotion.name,
                        potionRarity: newPotion.rarity,
                        newDropChance: gameState.potionDropChance
                    });
                }
            } else if (!potionDropResult.dropped) {
                logger.log('POTION_DROP', `No potion drop (chance now ${gameState.potionDropChance}%)`, {
                    newDropChance: gameState.potionDropChance
                });
            }


            // Relic reward for elite/boss victories
            if (gameState.currentMapPosition) {
                const nodeFloor = gameState.currentMapPosition.floor - 1;
                const nodeFloorNodes = gameState.map[nodeFloor] || [];
                const currentNode = nodeFloorNodes.find(n => n.id === gameState.currentMapPosition?.nodeId);
                if (currentNode?.type === 'elite') {
                    // Elite: StS-weighted relic drop (75% uncommon, 25% common)
                    const existingRelicIds = gameState.relics.map(r => r.id);
                    const newRelic = getEliteRelic(existingRelicIds);

                    if (newRelic) {
                        gameState.relics.push(newRelic);
                        logger.log('RELIC_ACQUIRED', `Elite dropped "${newRelic.name}"!`, {
                            relicName: newRelic.name,
                            relicRarity: newRelic.rarity,
                            totalRelics: gameState.relics.length,
                            source: 'elite'
                        });
                    }
                } else if (currentNode?.type === 'boss') {
                    // Boss: 3-choice selection like StS
                    const existingRelicIds = gameState.relics.map(r => r.id);
                    const bossRelicChoices = getBossRelicChoices(existingRelicIds);

                    if (bossRelicChoices.length > 0) {
                        // AI selects from the 3 choices (or can skip for gold)
                        const selectedRelic = ai.selectRelic(gameState, bossRelicChoices);

                        if (selectedRelic) {
                            gameState.relics.push(selectedRelic);
                            logger.log('RELIC_ACQUIRED', `Boss: Selected "${selectedRelic.name}" from ${bossRelicChoices.length} choices!`, {
                                relicName: selectedRelic.name,
                                relicRarity: selectedRelic.rarity,
                                totalRelics: gameState.relics.length,
                                source: 'boss',
                                choices: bossRelicChoices.map(r => r.name)
                            });
                        } else {
                            // AI skipped - give gold instead
                            const skipGold = getBossRelicSkipGold();
                            gameState.playerStats.capital += skipGold;
                            logger.log('REWARD', `Skipped boss relic, received $${skipGold}k gold`, {
                                capital: skipGold,
                                choices: bossRelicChoices.map(r => r.name)
                            });
                        }
                    }
                }
            }

            // Move to next floor
            gameState.floor++;
            gameState.status = 'MAP';
        }
    }

    const won = gameState.status !== 'GAME_OVER';
    return createResult(simId, won, gameState, totalTurns, won ? 'Run completed' : 'Died', logger, totalCapital);
}

/**
 * Handle entering a map node
 */
function handleMapNode(
    state: GameState,
    node: MapNode,
    ai: AIPlayer,
    logger: GameLogger,
    config: SimulationConfig
): GameState {
    let gameState = { ...state };

    if (node.type === 'problem' || node.type === 'elite' || node.type === 'boss') {
        // Get enemies
        let enemies: EnemyData[];
        if (node.type === 'boss') {
            enemies = getBossEncounter();
        } else if (node.type === 'elite') {
            enemies = getEliteEncounter();
        } else {
            enemies = getEncounterForFloor(gameState.floor);
        }

        // Log enemy spawn
        for (const enemy of enemies) {
            logger.log('ENEMY_SPAWN', `${enemy.name} appeared!`, {
                enemyName: enemy.name,
                enemyId: enemy.id,
                enemyHp: enemy.hp,
                enemyMaxHp: enemy.maxHp
            });
        }

        // Apply combat start relics (with reset statuses - StS behavior)
        const resetStatuses = {
            vulnerable: 0, weak: 0, strength: 0, dexterity: 0,
            metallicize: 0, evolve: 0, feelNoPain: 0, noDraw: 0,
            thorns: 0, antifragile: 0, artifact: 0, frail: 0,
            growth: 0, corruption: 0, combust: 0, darkEmbrace: 0,
            rage: 0, fireBreathing: 0, barricade: 0, doubleTap: 0,
            berserk: 0, brutality: 0, juggernaut: 0, tempStrength: 0
        };
        const resetStats = { ...gameState.playerStats, statuses: resetStatuses, mitigation: 0 };

        const { stats, enemies: modifiedEnemies, message } = applyCombatStartRelics(resetStats, gameState.relics, enemies);
        if (message) {
            logger.log('RELIC', message, {});
        }

        // Initialize combat
        gameState = {
            ...gameState,
            status: 'PLAYING',
            enemies: modifiedEnemies,
            playerStats: { ...stats, bandwidth: getTurnStartBandwidth(gameState.relics) },
            turn: 1,
            drawPile: shuffle([...gameState.deck]),
            hand: [],
            discardPile: [],
            exhaustPile: []
        };

        // Initial draw
        const { drawn, newDraw, newDiscard } = drawCards(gameState.drawPile, gameState.discardPile, 5);
        const processed = processDrawnCards(drawn, [], [], newDraw, gameState.playerStats, '');

        gameState.hand = processed.hand;
        gameState.drawPile = processed.drawPile;
        gameState.discardPile = processed.discard;
        gameState.playerStats = processed.stats;

        logger.log('COMBAT_START', `Combat started on floor ${gameState.floor}`, {
            floor: gameState.floor,
            enemyCount: enemies.length,
            handSize: gameState.hand.length
        });

        logger.log('CARD_DRAW', `Drew ${drawn.length} cards`, {
            amount: drawn.length,
            details: drawn.map(c => c.name).join(', ')
        });

        // Log initial intents
        for (const enemy of gameState.enemies) {
            logger.log('ENEMY_INTENT', `${enemy.name} intends: ${enemy.currentIntent.description}`, {
                enemyName: enemy.name,
                intentType: enemy.currentIntent.type,
                intentValue: enemy.currentIntent.value,
                intentDescription: enemy.currentIntent.description
            });
        }

    } else if (node.type === 'retrospective') {
        // Rest site - AI chooses heal or upgrade
        const action = ai.selectRestAction ? ai.selectRestAction(gameState) : 'heal';

        if (action === 'upgrade' && ai.selectCardToUpgrade) {
            const cardToUpgrade = ai.selectCardToUpgrade(gameState.deck);
            if (cardToUpgrade) {
                const upgradedCard = upgradeCard(cardToUpgrade);
                gameState.deck = gameState.deck.map(c =>
                    c.id === cardToUpgrade.id ? upgradedCard : c
                );
                logger.log('CARD_PLAY', `Upgraded ${cardToUpgrade.name} at rest site`, {
                    cardName: cardToUpgrade.name
                });
            } else {
                // Fall back to heal if no card to upgrade
                const healAmount = Math.floor(gameState.playerStats.maxHp * 0.3);
                gameState.playerStats.hp = Math.min(
                    gameState.playerStats.maxHp,
                    gameState.playerStats.hp + healAmount
                );
                logger.log('HEAL', `Rested and healed ${healAmount} HP`, {
                    amount: healAmount,
                    playerHp: gameState.playerStats.hp
                });
            }
        } else {
            // Heal
            const healAmount = Math.floor(gameState.playerStats.maxHp * 0.3);
            gameState.playerStats.hp = Math.min(
                gameState.playerStats.maxHp,
                gameState.playerStats.hp + healAmount
            );
            logger.log('HEAL', `Rested and healed ${healAmount} HP`, {
                amount: healAmount,
                playerHp: gameState.playerStats.hp
            });
        }
        gameState.floor++;
        gameState.status = 'MAP';

    } else if (node.type === 'vendor') {
        // Vendor shop with AI decision-making
        const CARD_REMOVE_COST = 75;

        if (ai.selectVendorAction) {
            let action = ai.selectVendorAction(gameState);

            while (action && action.type !== 'skip') {
                if (action.type === 'remove_card' && gameState.playerStats.capital >= CARD_REMOVE_COST) {
                    // Remove the card from deck
                    const cardToRemove = action.card;
                    gameState.deck = gameState.deck.filter(c => c.id !== cardToRemove.id);
                    gameState.playerStats.capital -= CARD_REMOVE_COST;
                    logger.log('MAP_NODE', `Vendor: Removed "${cardToRemove.name}" for $${CARD_REMOVE_COST}k`, {
                        cardName: cardToRemove.name,
                        goldSpent: CARD_REMOVE_COST,
                        remainingGold: gameState.playerStats.capital,
                        deckSize: gameState.deck.length
                    });
                } else {
                    break;
                }

                // Check if AI wants to do more
                action = ai.selectVendorAction(gameState);
            }

            logger.log('MAP_NODE', `Left vendor with $${gameState.playerStats.capital}k, deck size: ${gameState.deck.length}`, {
                capital: gameState.playerStats.capital,
                deckSize: gameState.deck.length
            });
        } else {
            logger.log('MAP_NODE', 'Visited vendor (skipped)', {});
        }
        gameState.floor++;
        gameState.status = 'MAP';

    } else if (node.type === 'treasure') {
        // Treasure room - award a relic with StS rarity rates!
        const existingRelicIds = gameState.relics.map(r => r.id);
        const newRelic = getTreasureRelic(existingRelicIds);

        if (newRelic) {
            gameState.relics.push(newRelic);
            logger.log('RELIC_ACQUIRED', `Found "${newRelic.name}" in treasure!`, {
                relicName: newRelic.name,
                relicRarity: newRelic.rarity,
                totalRelics: gameState.relics.length
            });
        }
        logger.log('REWARD', 'Found treasure!', { relicName: newRelic?.name });
        gameState.floor++;
        gameState.status = 'MAP';

    } else if (node.type === 'opportunity') {
        // Event handling with AI decision
        if (ACT1_EVENTS.length > 0 && ai.selectEventChoice) {
            const eventIndex = Math.floor(Math.random() * ACT1_EVENTS.length);
            const event = ACT1_EVENTS[eventIndex];
            const choice = ai.selectEventChoice(gameState, event);

            logger.log('MAP_NODE', `Event: ${event.name} - chose "${choice.label}"`, {
                eventId: event.id,
                choiceId: choice.id
            });

            gameState = applyEventEffects(gameState, choice.effects, logger);
        } else {
            logger.log('MAP_NODE', 'Event occurred (skipped)', {});
        }
        gameState.floor++;
        gameState.status = 'MAP';
    }

    return gameState;
}

/**
 * Handle card/discard selection screens
 */
function handleSelection(state: GameState, ai: AIPlayer, logger: GameLogger): GameState {
    let gameState = { ...state };
    const pending = gameState.pendingSelection;

    if (!pending) {
        gameState.status = 'PLAYING';
        return gameState;
    }

    const cards = pending.context === 'hand' ? gameState.hand : gameState.discardPile;
    const selected = ai.selectCards(gameState, cards, pending.count, pending.action);

    if (pending.action === 'exhaust') {
        for (const card of selected) {
            gameState.hand = gameState.hand.filter(c => c.id !== card.id);
            gameState.exhaustPile.push(card);
            logger.log('CARD_EXHAUST', `Exhausted "${card.name}"`, {
                cardName: card.name
            });
        }
    }

    gameState.pendingSelection = undefined;
    gameState.status = 'PLAYING';
    return gameState;
}

/**
 * Create a simulation result object
 */
function createResult(
    simId: number,
    win: boolean,
    state: GameState,
    turns: number,
    reason: string,
    logger: GameLogger,
    capital: number
): SimulationResult {
    return {
        simId,
        win,
        floor: state.floor,
        turns,
        reason,
        finalHp: state.playerStats.hp,
        deckSize: state.deck.length,
        relicsCollected: state.relics.length,
        capitalEarned: capital,
        logger
    };
}

/**
 * Run multiple simulations and collect statistics
 */
export function runSimulations(config: SimulationConfig): {
    results: SimulationResult[];
    summary: SummaryStats;
} {
    const ai = createAI(config.aiStrategy);
    const results: SimulationResult[] = [];

    console.log(`Running ${config.runs} simulations with ${ai.name} AI...`);

    for (let i = 0; i < config.runs; i++) {
        const result = runSimulation(i, ai, config);
        results.push(result);

        if (config.verboseLogging && i < 3) {
            console.log(`\nSim ${i}: ${result.win ? 'WIN' : 'LOSS'} - Floor ${result.floor}, ${result.reason}`);
        }
    }

    const summary = calculateSummary(results);

    console.log(`\n=== ${ai.name} AI Summary ===`);
    console.log(`Win Rate: ${(summary.winRate * 100).toFixed(1)}% (${summary.wins}/${summary.totalRuns})`);
    console.log(`Avg Floor: ${summary.avgFloor.toFixed(1)}, Max Floor: ${summary.maxFloor}`);
    console.log(`Avg Turns: ${summary.avgTurns.toFixed(1)}`);
    console.log(`Death Reasons:`, summary.deathReasons);

    return { results, summary };
}

/**
 * Calculate summary statistics from results
 */
function calculateSummary(results: SimulationResult[]): SummaryStats {
    const wins = results.filter(r => r.win).length;
    const deathReasons: Record<string, number> = {};

    for (const r of results) {
        if (!r.win) {
            deathReasons[r.reason] = (deathReasons[r.reason] || 0) + 1;
        }
    }

    return {
        totalRuns: results.length,
        wins,
        winRate: wins / results.length,
        avgFloor: results.reduce((s, r) => s + r.floor, 0) / results.length,
        maxFloor: Math.max(...results.map(r => r.floor)),
        avgTurns: results.reduce((s, r) => s + r.turns, 0) / results.length,
        avgFinalHp: results.reduce((s, r) => s + r.finalHp, 0) / results.length,
        avgDeckSize: results.reduce((s, r) => s + r.deckSize, 0) / results.length,
        deathReasons
    };
}

/**
 * Run simulations with all AI strategies
 */
export function runAllStrategies(runsPerStrategy: number, verbose: boolean = false): void {
    const strategies: ('aggressive' | 'defensive' | 'balanced' | 'smart' | 'random')[] = [
        'aggressive', 'defensive', 'balanced', 'smart', 'random'
    ];

    const config: SimulationConfig = {
        runs: runsPerStrategy,
        aiStrategy: 'balanced',
        verboseLogging: verbose,
        maxTurnsPerCombat: 100,
        maxFloors: 16
    };

    console.log(`\n${'='.repeat(50)}`);
    console.log('SIMULATION COMPARISON - ALL STRATEGIES');
    console.log(`${'='.repeat(50)}\n`);

    const allResults: { strategy: string; summary: SummaryStats }[] = [];

    for (const strategy of strategies) {
        config.aiStrategy = strategy;
        const { summary } = runSimulations(config);
        allResults.push({ strategy, summary });
        console.log('');
    }

    // Print comparison table
    console.log('\n=== COMPARISON TABLE ===');
    console.log('Strategy    | Win Rate | Avg Floor | Max Floor | Avg Turns');
    console.log('-'.repeat(60));
    for (const { strategy, summary } of allResults) {
        console.log(
            `${strategy.padEnd(11)} | ${(summary.winRate * 100).toFixed(1).padStart(6)}%  | ${summary.avgFloor.toFixed(1).padStart(9)} | ${String(summary.maxFloor).padStart(9)} | ${summary.avgTurns.toFixed(1).padStart(9)}`
        );
    }
}

/**
 * Export a single simulation's log
 */
export function exportSimulationLog(result: SimulationResult, format: 'json' | 'narrative' = 'narrative'): string {
    const header = `
=== SIMULATION ${result.simId} ===
Result: ${result.win ? 'VICTORY' : 'DEFEAT'}
Floor: ${result.floor}
Turns: ${result.turns}
Reason: ${result.reason}
Final HP: ${result.finalHp}
Deck Size: ${result.deckSize}
Relics: ${result.relicsCollected}
Capital: $${result.capitalEarned}k
${'='.repeat(30)}

`;

    if (format === 'json') {
        return JSON.stringify({
            summary: {
                simId: result.simId,
                win: result.win,
                floor: result.floor,
                turns: result.turns,
                reason: result.reason,
                finalHp: result.finalHp,
                deckSize: result.deckSize,
                relicsCollected: result.relicsCollected,
                capitalEarned: result.capitalEarned
            },
            log: result.logger.getEntries()
        }, null, 2);
    }

    return header + result.logger.toNarrativeText();
}

// CLI Entry Point
if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        console.log(`
Simulation Runner - Test game logic with AI players

Usage: npx tsx simulationRunner.ts [options]

Options:
  --runs N          Number of simulations (default: 10)
  --strategy NAME   AI strategy: aggressive, defensive, balanced, random (default: balanced)
  --all-strategies  Run with all strategies
  --verbose         Enable verbose logging
  --help            Show this help message

Examples:
  npx tsx simulationRunner.ts --runs 100 --strategy aggressive
  npx tsx simulationRunner.ts --all-strategies --runs 50
`);
    } else if (args.includes('--all-strategies')) {
        const runs = parseInt(args[args.indexOf('--runs') + 1]) || 10;
        const verbose = args.includes('--verbose');
        runAllStrategies(runs, verbose);
    } else {
        const runs = parseInt(args[args.indexOf('--runs') + 1]) || 10;
        const strategyArg = args[args.indexOf('--strategy') + 1] || 'balanced';
        const strategy = strategyArg as 'aggressive' | 'defensive' | 'balanced' | 'random';
        const verbose = args.includes('--verbose');

        const config: SimulationConfig = {
            runs,
            aiStrategy: strategy,
            verboseLogging: verbose,
            maxTurnsPerCombat: 100,
            maxFloors: 16
        };

        const { results } = runSimulations(config);

        // Print first simulation log if verbose
        if (verbose && results.length > 0) {
            console.log('\n--- First Simulation Log ---');
            console.log(exportSimulationLog(results[0], 'narrative'));
        }
    }
}
