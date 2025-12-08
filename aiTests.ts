import { GameState, EnemyData, EnemyIntent, MapLayer } from './types.ts';
import { GAME_DATA } from './constants.ts';
import { resolveEnemyTurn, generateMap } from './gameLogic.ts';

const createMockState = (enemyId: string): GameState => {
    const enemyTemplate = Object.values(GAME_DATA.enemies).find(e => e.id === enemyId);
    if (!enemyTemplate) throw new Error(`Enemy ${enemyId} not found`);

    return {
        playerStats: { ...GAME_DATA.character.stats, hp: 50, maxHp: 50 },
        enemies: [{ ...enemyTemplate, id: enemyId, hp: enemyTemplate.maxHp, maxHp: enemyTemplate.maxHp, statuses: { ...enemyTemplate.statuses }, currentIntent: { ...enemyTemplate.currentIntent } }],
        hand: [],
        drawPile: [],
        deck: [],
        discardPile: [],
        exhaustPile: [],
        relics: [],
        turn: 0, // Will become 1 in next turn
        floor: 1,
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
};

const runAiTests = () => {
    console.log("Running AI Logic Tests...");
    let passed = 0;
    let failed = 0;

    const assertIntent = (enemy: EnemyData, expectedType: string, turn: number) => {
        if (enemy.currentIntent.type === expectedType) {
            console.log(`✅ ${enemy.name} Turn ${turn}: ${enemy.currentIntent.description} (${enemy.currentIntent.type})`);
            passed++;
        } else {
            console.error(`❌ ${enemy.name} Turn ${turn}: Expected ${expectedType}, got ${enemy.currentIntent.type} (${enemy.currentIntent.description})`);
            failed++;
        }
    };

    // Test 1: Fanboy (Cultist)
    // Turn 1: Buff (Ritual)
    // Turn 2: Attack
    {
        let state = createMockState('fanboy');
        // Initial state (Turn 0) -> resolveEnemyTurn -> Turn 1 Intent
        // Wait, resolveEnemyTurn processes CURRENT intent and sets NEXT intent.
        // Initial intent in constants is Ritual.
        // So Turn 1 execution does Ritual. Next intent (Turn 2) should be Attack.

        // Let's simulate Turn 1 execution.
        state.turn = 1;
        state = resolveEnemyTurn(state); // Executes Turn 1, sets Turn 2 Intent
        assertIntent(state.enemies[0], 'attack', 2);

        state = resolveEnemyTurn(state); // Executes Turn 2, sets Turn 3 Intent
        assertIntent(state.enemies[0], 'attack', 3);
    }

    // Test 2: Scope Creep (Gremlin Nob)
    // Turn 1: Buff (Enrage)
    // Turn 2: Debuff (Vuln)
    // Turn 3: Attack (Rush)
    {
        let state = createMockState('scope_creep'); // Initial intent in constants is Buff
        state.turn = 1;
        state = resolveEnemyTurn(state); // Sets Turn 2 Intent
        assertIntent(state.enemies[0], 'debuff', 2);

        state = resolveEnemyTurn(state); // Sets Turn 3 Intent
        assertIntent(state.enemies[0], 'attack', 3);
    }

    // Test 3: The Pivot (Guardian)
    // Cycle: Buff -> Attack -> Debuff -> Attack
    {
        let state = createMockState('boss_the_pivot'); // Initial intent Buff
        state.turn = 1;
        state = resolveEnemyTurn(state); // Sets Turn 2 Intent
        assertIntent(state.enemies[0], 'attack', 2); // Fierce Bash

        state = resolveEnemyTurn(state); // Sets Turn 3 Intent
        assertIntent(state.enemies[0], 'debuff', 3); // Vent Steam

        state = resolveEnemyTurn(state); // Sets Turn 4 Intent
        assertIntent(state.enemies[0], 'attack', 4); // Whirlwind

        state = resolveEnemyTurn(state); // Sets Turn 5 (Cycle 1) Intent
        assertIntent(state.enemies[0], 'buff', 5); // Charging Up
    }

    // Test 4: The Burn Rate (Hexaghost)
    // Turn 1: Divider (Attack)
    // Turn 2: Burn (Debuff)
    {
        let state = createMockState('boss_burn_rate'); // Initial intent Divider
        state.turn = 1;
        state = resolveEnemyTurn(state); // Sets Turn 2 Intent
        // Cycle (Turn - 1) % 5.
        // Turn 2 -> (1) % 5 = 1 -> Burn (Debuff)
        // Wait, my logic:
        // if (turn === 1) Divider
        // Cycle = (turn - 1) % 5.
        // Next turn is 2. Cycle = 1.
        // if (cycle === 0) Sear
        // if (cycle === 1) Burn
        assertIntent(state.enemies[0], 'debuff', 2);
    }

    console.log(`AI Tests Complete: ${passed} Passed, ${failed} Failed.`);
};

const runMapTests = () => {
    console.log("\n=== Running Map Generation Tests ===\n");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, msg: string) => {
        if (condition) {
            console.log(`✅ ${msg}`);
            passed++;
        } else {
            console.error(`❌ ${msg}`);
            failed++;
        }
    };

    // Generate 5 maps to test
    for (let mapNum = 0; mapNum < 5; mapNum++) {
        console.log(`\n--- Map ${mapNum + 1} ---`);
        const map = generateMap();

        // Test 1: Should have 16 floors (15 + boss)
        assert(map.length === 16, `Has 16 floors (got ${map.length})`);

        // Test 2: Floor 1 should have only 'problem' types
        const floor1Types = map[0].map(n => n.type);
        const floor1AllProblems = floor1Types.every(t => t === 'problem');
        assert(floor1AllProblems, `Floor 1 all problems: ${floor1Types.join(', ')}`);

        // Test 3: Floor 9 should have only 'treasure' types
        const floor9Types = map[8].map(n => n.type);
        const floor9AllTreasure = floor9Types.every(t => t === 'treasure');
        assert(floor9AllTreasure, `Floor 9 all treasure: ${floor9Types.join(', ')}`);

        // Test 4: Floor 15 should have only 'retrospective' types
        const floor15Types = map[14].map(n => n.type);
        const floor15AllRetro = floor15Types.every(t => t === 'retrospective');
        assert(floor15AllRetro, `Floor 15 all retrospective: ${floor15Types.join(', ')}`);

        // Test 5: Floor 16 should be boss
        assert(map[15].length === 1 && map[15][0].type === 'boss', `Floor 16 is boss`);

        // Test 6: No elites or rests before floor 6
        let earlyEliteRest = false;
        for (let f = 0; f < 5; f++) {
            map[f].forEach(n => {
                if (n.type === 'elite' || n.type === 'retrospective') {
                    earlyEliteRest = true;
                }
            });
        }
        assert(!earlyEliteRest, `No elites/rests before floor 6`);

        // Test 7: All nodes have valid connections (except boss)
        let connectionsValid = true;
        for (let f = 0; f < 15; f++) {
            map[f].forEach(n => {
                if (n.connections.length === 0) {
                    connectionsValid = false;
                    console.log(`  Node ${n.id} has no connections`);
                }
            });
        }
        assert(connectionsValid, `All nodes have forward connections`);

        // Count room types
        const typeCounts: Record<string, number> = {};
        let totalNodes = 0;
        map.forEach((floor, idx) => {
            if (idx === 15) return; // Skip boss
            floor.forEach(n => {
                typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
                totalNodes++;
            });
        });
        console.log(`  Room distribution: ${JSON.stringify(typeCounts)}`);
        console.log(`  Total nodes: ${totalNodes}`);
    }

    console.log(`\n=== Map Tests Complete: ${passed} Passed, ${failed} Failed ===`);
};

runAiTests();
runMapTests();
