import { GameState, CardData, EnemyData, MapNode } from './types.ts';
import { GAME_DATA } from './constants.ts';
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
    getRandomRewardCards
} from './gameLogic.ts';

const SIMULATION_COUNT = 100;

const runSimulation = (simId: number): { win: boolean, floor: number, reason: string } => {
    // 1. Initialize
    const initialDeck = shuffle(generateStarterDeck());
    let gameState: GameState = {
        playerStats: { ...GAME_DATA.character.stats },
        enemies: [],
        hand: [],
        drawPile: initialDeck,
        deck: initialDeck,
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
        pendingDiscard: 0
    };

    // Loop through floors
    while (gameState.status !== 'GAME_OVER' && gameState.status !== 'VICTORY_ALL') {
        // Map Logic
        if (gameState.status === 'MAP') {
            const nextFloor = gameState.floor;
            if (nextFloor > 5) {
                return { win: true, floor: nextFloor, reason: 'Beat Boss' };
            }

            // Pick a node (always lane 0 for simplicity)
            const floorNodes = gameState.map[nextFloor - 1];
            const node = floorNodes[0]; // Always pick first lane

            gameState.currentMapPosition = { floor: nextFloor, nodeId: node.id };

            // Handle Node Type
            if (node.type === 'problem' || node.type === 'boss' || node.type === 'elite') {
                // Start Combat
                let enemies: EnemyData[] = [];
                if (node.type === 'boss') {
                    enemies = [{ ...GAME_DATA.enemies.boss_the_pivot, id: 'boss_the_pivot', hp: GAME_DATA.enemies.boss_the_pivot.hp, maxHp: GAME_DATA.enemies.boss_the_pivot.maxHp, statuses: { ...GAME_DATA.enemies.boss_the_pivot.statuses }, currentIntent: { ...GAME_DATA.enemies.boss_the_pivot.currentIntent } }];
                } else if (node.type === 'elite') {
                    enemies = [{ ...GAME_DATA.enemies.scope_creep, id: 'scope_creep', hp: GAME_DATA.enemies.scope_creep.hp, maxHp: GAME_DATA.enemies.scope_creep.maxHp, statuses: { ...GAME_DATA.enemies.scope_creep.statuses }, currentIntent: { ...GAME_DATA.enemies.scope_creep.currentIntent } }];
                } else {
                    // Random Common
                    enemies = [{ ...GAME_DATA.enemies.fanboy, id: 'fanboy', hp: GAME_DATA.enemies.fanboy.hp, maxHp: GAME_DATA.enemies.fanboy.maxHp, statuses: { ...GAME_DATA.enemies.fanboy.statuses }, currentIntent: { ...GAME_DATA.enemies.fanboy.currentIntent } }];
                }

                // Apply Combat Start Relics
                const { stats, enemies: modifiedEnemies, message } = applyCombatStartRelics(gameState.playerStats, gameState.relics, enemies);

                gameState = {
                    ...gameState,
                    status: 'PLAYING',
                    enemies: modifiedEnemies,
                    playerStats: { ...stats, bandwidth: getTurnStartBandwidth(gameState.relics) },
                    turn: 1,
                    drawPile: shuffle([...gameState.deck]), // Reset Deck
                    hand: [],
                    discardPile: [],
                    exhaustPile: []
                };

                // Initial Draw
                const { drawn, newDraw, newDiscard } = drawCards(gameState.drawPile, gameState.discardPile, 5);
                gameState.hand = drawn;
                gameState.drawPile = newDraw;
                gameState.discardPile = newDiscard;

            } else if (node.type === 'vendor') {
                // Skip vendor logic, just heal a bit?
                gameState.floor++;
                gameState.status = 'MAP';
            } else if (node.type === 'retrospective') {
                // Heal
                gameState.playerStats.hp = Math.min(gameState.playerStats.maxHp, gameState.playerStats.hp + 20);
                gameState.floor++;
                gameState.status = 'MAP';
            }
        }

        // Combat Logic
        if (gameState.status === 'PLAYING') {
            // Player Turn
            // Sort hand: Prioritize Block if incoming damage, else Damage
            const incomingDamage = gameState.enemies.reduce((acc, e) => {
                if (e.currentIntent.type === 'attack') return acc + e.currentIntent.value;
                return acc;
            }, 0);

            const playableCards = gameState.hand.filter(c =>
                (c.cost === -1 ? gameState.playerStats.bandwidth > 0 : gameState.playerStats.bandwidth >= c.cost) &&
                !c.unplayable
            );

            playableCards.sort((a, b) => {
                // Heuristic:
                // 1. If incoming damage > mitigation, prioritize Block cards.
                // 2. Else prioritize Attack cards.
                // 3. Higher cost first.

                const aIsBlock = a.effects.some(e => e.type === 'block');
                const bIsBlock = b.effects.some(e => e.type === 'block');

                if (incomingDamage > gameState.playerStats.mitigation) {
                    if (aIsBlock && !bIsBlock) return -1;
                    if (!aIsBlock && bIsBlock) return 1;
                } else {
                    if (!aIsBlock && bIsBlock) return -1;
                    if (aIsBlock && !bIsBlock) return 1;
                }

                return b.cost - a.cost;
            });

            if (playableCards.length > 0) {
                const cardToPlay = playableCards[0];
                // Resolve Target
                let target: 'enemy' | 'self' = 'enemy';
                if (cardToPlay.effects.some(e => e.target === 'self')) target = 'self';

                gameState = resolveCardEffect(gameState, cardToPlay, target);
            } else {
                // End Turn
                gameState = resolveEndTurn(gameState);
            }
        } else if (gameState.status === 'ENEMY_TURN') {
            gameState = resolveEnemyTurn(gameState);
            // resolveEnemyTurn sets status back to PLAYING (or VICTORY/GAME_OVER)
        } else if (gameState.status === 'VICTORY') {
            // End Combat
            gameState.floor++;
            gameState.status = 'MAP';
            // Add Reward (Random Card)
            const rewards = getRandomRewardCards(1);
            gameState.deck.push(rewards[0]);
        } else if (gameState.status === 'CARD_SELECTION') {
            // Handle Selection (e.g. Exhaust)
            // Just pick first available
            if (gameState.pendingSelection?.context === 'hand') {
                // Logic to resolve selection (not fully implemented in gameLogic yet, need a helper)
                // For simulation, just cancel or pick random.
                gameState.status = 'PLAYING';
                gameState.pendingSelection = undefined;
            }
        }
    }

    return { win: false, floor: gameState.floor, reason: 'Died' };
};

// Run Simulations
console.log(`Running ${SIMULATION_COUNT} simulations...`);
let wins = 0;
let maxFloor = 0;

for (let i = 0; i < SIMULATION_COUNT; i++) {
    const result = runSimulation(i);
    if (result.win) wins++;
    if (result.floor > maxFloor) maxFloor = result.floor;
}

console.log(`Results: ${wins}/${SIMULATION_COUNT} Wins.`);
console.log(`Max Floor Reached: ${maxFloor}`);
