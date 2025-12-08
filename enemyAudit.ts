
import { GameState, CardData, EnemyData, MapNode, CharacterStats, RelicData } from './types.ts';
import { GAME_DATA } from './constants.ts';
import {
    generateStarterDeck,
    shuffle,
    resolveEndTurn,
    resolveEnemyTurn,
    resolveCardEffect,
    getTurnStartBandwidth,
    applyCombatStartRelics,
    applyCombatEndRelics,
    processDrawnCards
} from './gameLogic.ts';
import { createAI, AIPlayer } from './aiPlayer.ts';

// Helper to get enemies by ID regardless of type (normal, elite, boss)
const getEnemyById = (id: string): EnemyData => {
    // Normal enemies
    if (GAME_DATA.enemies[id]) return { ...GAME_DATA.enemies[id] };

    // Elites (flat in GAME_DATA.enemies too based on review, but checking all keys)
    // Actually all enemies are in GAME_DATA.enemies object in constants.ts
    // Let's verify if 'scope_creep' is a key in GAME_DATA.enemies.
    // Based on previous file reads, they are all in one large object.

    const enemy = GAME_DATA.enemies[id];
    if (enemy) return { ...enemy, id: `${enemy.id}_${Math.random().toString(36).substr(2, 9)}` };

    throw new Error(`Enemy with ID ${id} not found in GAME_DATA`);
};

interface AuditStats {
    wins: number;
    losses: number;
    totalHpLost: number;
    totalTurns: number;
    minHpLost: number;
    maxHpLost: number;
    deaths: number;
}

class EnemyAuditor {
    async auditEnemy(enemyId: string, count: number = 100) {
        console.log(`\n🔍 AUDITING ENEMY: ${enemyId}`);
        console.log(`Running ${count} simulations...`);

        const stats: AuditStats = {
            wins: 0,
            losses: 0,
            totalHpLost: 0,
            totalTurns: 0,
            minHpLost: 999,
            maxHpLost: 0,
            deaths: 0
        };

        const ai = createAI('balanced'); // Use Balanced AI for accurate difficulty assessment

        for (let i = 0; i < count; i++) {
            this.runSingleCombat(enemyId, ai, stats);
        }

        this.printResults(enemyId, count, stats);
    }

    private draftRandomCards(count: number): CardData[] {
        const validCards = Object.values(GAME_DATA.cards).filter(c =>
            (c.rarity === 'common' || c.rarity === 'uncommon') &&
            (c.type === 'attack' || c.type === 'skill' || c.type === 'power') &&
            c.id !== 'strike' && c.id !== 'defend'
        );

        const drafted: CardData[] = [];
        for (let i = 0; i < count; i++) {
            const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
            drafted.push({ ...randomCard, id: `${randomCard.id}_drafted_${i}` });
        }
        return drafted;
    }

    private runSingleCombat(enemyId: string, ai: AIPlayer, stats: AuditStats) {
        const starterDeck = generateStarterDeck();
        const draftedCards = this.draftRandomCards(3); // Draft 3 cards
        const initialDeck = shuffle([...starterDeck, ...draftedCards]);

        // Debug first run deck
        if (stats.wins + stats.losses === 0) {
            console.log(`Drafted: ${draftedCards.map(c => c.name).join(', ')}`);
        }

        let gameState: GameState = {
            playerStats: { ...GAME_DATA.character.stats },
            enemies: [], // Will populate
            hand: [],
            drawPile: initialDeck,
            deck: [...initialDeck],
            discardPile: [],
            exhaustPile: [],
            relics: [GAME_DATA.relics.git_repository],
            turn: 0,
            floor: 1, // Floor 1 scaling
            status: 'PLAYING',
            rewardOptions: [],
            message: '',
            map: [],
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

        // Spawn Enemy
        // Handle "2x Interns" special case if needed, but for now just single enemy ID
        // If ID is '2_interns', spawn two.
        // If ID is '2_minor_bugs', spawn two.
        if (enemyId === '2_minor_bugs') {
            gameState.enemies = [getEnemyById('minor_bug'), getEnemyById('minor_bug')];
        } else if (enemyId === '3_minor_bugs') {
            gameState.enemies = [getEnemyById('minor_bug'), getEnemyById('minor_bug'), getEnemyById('minor_bug')];
        } else if (enemyId === '3_sentries') {
            gameState.enemies = [getEnemyById('legacy_monolith'), getEnemyById('legacy_hack'), getEnemyById('legacy_patch')];
        } else {
            gameState.enemies = [getEnemyById(enemyId)];
        }


        // Apply Combat Start Relics
        const relicResult = applyCombatStartRelics(gameState.playerStats, gameState.relics, gameState.enemies);
        gameState.playerStats = relicResult.stats;
        gameState.enemies = relicResult.enemies;

        // Combat Loop
        let combatOver = false;
        let turns = 0;
        const startHp = gameState.playerStats.hp;

        while (!combatOver && turns < 50) {
            turns++;
            gameState.turn = turns;
            gameState.playerStats.bandwidth = getTurnStartBandwidth(gameState.relics);
            gameState.playerStats.mitigation = 0; // Reset block

            // Debug Loop stats
            // if (i === 0 && turns <= 5) console.log(`Turn ${turns}: Bandwidth ${gameState.playerStats.bandwidth}`);

            // Draw cards
            // Simple draw 5 logic (mocking drawCards to avoid UI state deps if any)
            // drawCards in gameLogic might rely on state. 
            // Let's implement simple draw here to be safe or use state.
            // Using logic from balanceAnalyzer which uses gameLogic helpers

            // Draw 5
            let newlyDrawn: CardData[] = [];
            for (let j = 0; j < 5; j++) {
                if (gameState.drawPile.length === 0 && gameState.discardPile.length > 0) {
                    gameState.drawPile = shuffle(gameState.discardPile);
                    gameState.discardPile = [];
                }
                if (gameState.drawPile.length > 0) {
                    newlyDrawn.push(gameState.drawPile.pop()!);
                }
            }
            const drawnResult = processDrawnCards(newlyDrawn, gameState.hand, gameState.discardPile, gameState.drawPile, gameState.playerStats, gameState.message);
            gameState.hand = drawnResult.hand;
            gameState.discardPile = drawnResult.discard;
            gameState.drawPile = drawnResult.drawPile;
            gameState.playerStats = drawnResult.stats;
            gameState.message = drawnResult.message;


            // Player Turn (AI)
            let action = ai.selectCard(gameState);
            while (action) {
                const { card } = action;

                // MANUAL CHECK
                if (gameState.playerStats.bandwidth < card.cost) {
                    console.log(`CRITICAL: AI selected unplayable card! ${card.name} Cost: ${card.cost} BW: ${gameState.playerStats.bandwidth}`);
                    break; // Force break to prevent infinite loop of invalid plays
                }

                // Remove from hand (logic specific to this script loop representation)
                // gameState.hand = gameState.hand.filter(c => c.id !== card.id);
                // gameState.discardPile.push(card);
                // gameState.playerStats.bandwidth -= (card.cost === -1 ? gameState.playerStats.bandwidth : card.cost);

                // Resolve effects
                const hpBefore = gameState.enemies[0]?.hp;
                // console.log(`DEBUG: Playing ${card.name}. BW: ${gameState.playerStats.bandwidth}`);
                gameState = resolveCardEffect(gameState, card, 'enemy', action.targetEnemyId);
                const hpAfter = gameState.enemies[0]?.hp;
                if (hpBefore !== hpAfter) console.log(`DEBUG: Damage Dealt! ${hpBefore} -> ${hpAfter} by ${card.name}`);
                else if (card.type === 'attack') {
                    console.log(`DEBUG: Attack Whiffed! ${card.name}. Msg: "${gameState.message}". BW: ${gameState.playerStats.bandwidth}`);
                }

                // Clean up dead enemies
                gameState.enemies = gameState.enemies.filter(e => e.hp > 0);

                if (gameState.enemies.length === 0) {
                    combatOver = true;
                    break;
                }

                action = ai.selectCard(gameState);
            }

            if (combatOver) break;

            // Enemy Turn
            gameState = resolveEndTurn(gameState); // Discard hand
            gameState = resolveEnemyTurn(gameState);

            if (gameState.playerStats.hp <= 0) {
                combatOver = true;
                stats.deaths++;
            }
        }

        // Debug first run
        if (stats.wins + stats.losses === 0) {
            console.log(`Debug Run 1: Turns ${turns}, PlayerHP ${gameState.playerStats.hp}, EnemyHP ${gameState.enemies[0]?.hp}`);
        }

        const hpLost = startHp - gameState.playerStats.hp;

        stats.totalTurns += turns;
        stats.totalHpLost += hpLost;
        stats.minHpLost = Math.min(stats.minHpLost, hpLost);
        stats.maxHpLost = Math.max(stats.maxHpLost, hpLost);

        if (gameState.playerStats.hp > 0) {
            stats.wins++;
        } else {
            stats.losses++;
        }
    }

    private printResults(enemyId: string, count: number, stats: AuditStats) {
        console.log(`\n📊 RESULTS FOR ${enemyId.toUpperCase()}`);
        console.log('-'.repeat(40));
        console.log(`Win Rate:       ${(stats.wins / count * 100).toFixed(1)}%`);
        console.log(`Avg HP Lost:    ${(stats.totalHpLost / count).toFixed(1)}`);
        console.log(`HP Lost Range:  ${stats.minHpLost} - ${stats.maxHpLost}`);
        console.log(`Avg Turns:      ${(stats.totalTurns / count).toFixed(1)}`);
        console.log(`Deaths:         ${stats.deaths}`);
        console.log('-'.repeat(40));
    }
}

// CLI
if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);
    const enemyId = args[0];
    const count = parseInt(args[1]) || 100;

    if (!enemyId) {
        console.log('Usage: npx tsx enemyAudit.ts <enemyId> [count]');
        console.log('Example: npx tsx enemyAudit.ts fanboy 500');
        console.log('\nAvailable Act 1 Enemies:');
        console.log('- fanboy (Cultist)');
        console.log('- minor_bug (Louse)');
        console.log('- spaghetti_code (Jaw Worm)');
        console.log('- scope_creep (Nob)');
        console.log('- over_engineer (Lagavulin)');
        console.log('- 2_minor_bugs (Double Louse)');
    } else {
        new EnemyAuditor().auditEnemy(enemyId, count);
    }
}
