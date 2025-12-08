/**
 * Seed System Tests
 * 
 * Tests to verify that the seeded RNG system produces deterministic results.
 * Run with: npx tsx seedTests.ts
 */

import { SeededRandom, createGameRNG, seedToNumber, generateRandomSeed } from './rng';
import { generateMap, getRandomRewardCards, shuffle, getEncounterForFloor, getEliteEncounter, getBossEncounter } from './gameLogic';
import { CardData } from './types';

// Test utilities
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
    testsRun++;
    if (condition) {
        testsPassed++;
        console.log(`✅ ${message}`);
    } else {
        testsFailed++;
        console.log(`❌ ${message}`);
    }
}

function runTest(name: string, fn: () => void): void {
    console.log(`\n--- ${name} ---`);
    try {
        fn();
    } catch (e) {
        testsFailed++;
        testsRun++;
        console.log(`❌ ${name} threw error: ${e}`);
    }
}

// ========== TESTS ==========

runTest('SeededRandom produces identical sequences', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    let allMatch = true;
    for (let i = 0; i < 1000; i++) {
        if (rng1.next() !== rng2.next()) {
            allMatch = false;
            break;
        }
    }
    assert(allMatch, 'Same seed produces identical sequence over 1000 iterations');
});

runTest('Different seeds produce different sequences', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    let matches = 0;
    for (let i = 0; i < 100; i++) {
        if (rng1.next() === rng2.next()) matches++;
    }
    assert(matches < 5, `Different seeds rarely produce same values (${matches}/100 matches)`);
});

runTest('Shuffle determinism', () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng1 = new SeededRandom(99999);
    const rng2 = new SeededRandom(99999);

    const shuffle1 = rng1.shuffle([...deck]);
    const shuffle2 = rng2.shuffle([...deck]);

    assert(JSON.stringify(shuffle1) === JSON.stringify(shuffle2), 'Same seed produces identical shuffle');
});

runTest('Shuffle produces different order than original', () => {
    const deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const rng = new SeededRandom(42);
    const shuffled = rng.shuffle([...deck]);

    assert(JSON.stringify(shuffled) !== JSON.stringify(deck), 'Shuffle changes order');
});

runTest('seedToNumber produces consistent results', () => {
    const seeds = ['ABC123', 'test', 'BURNRATE2024', 'hello', ''];
    let allConsistent = true;

    for (const seed of seeds) {
        const num1 = seedToNumber(seed);
        const num2 = seedToNumber(seed);
        if (num1 !== num2) {
            allConsistent = false;
            break;
        }
    }
    assert(allConsistent, 'seedToNumber is consistent for all test seeds');
});

runTest('seedToNumber produces different numbers for different seeds', () => {
    const num1 = seedToNumber('ABC');
    const num2 = seedToNumber('DEF');
    const num3 = seedToNumber('GHI');

    assert(num1 !== num2 && num2 !== num3 && num1 !== num3, 'Different seed strings produce different numbers');
});

runTest('generateRandomSeed produces valid seeds', () => {
    const seed1 = generateRandomSeed();
    const seed2 = generateRandomSeed();

    assert(seed1.length === 8, `Seed has correct length (${seed1.length})`);
    assert(seed1 !== seed2, 'Two random seeds are different');
    assert(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/.test(seed1), 'Seed uses valid characters');
});

runTest('GameRNG streams are independent', () => {
    const rng = createGameRNG('TESTRUN');

    // Advance map RNG
    for (let i = 0; i < 100; i++) rng.map.next();

    // Cards RNG should still produce same sequence as fresh
    const freshRng = createGameRNG('TESTRUN');

    const cardValue1 = rng.cards.next();
    const cardValue2 = freshRng.cards.next();

    assert(cardValue1 === cardValue2, 'Card RNG unaffected by map RNG usage');
});

runTest('Map generation determinism', () => {
    const rng1 = createGameRNG('BURNRATE');
    const rng2 = createGameRNG('BURNRATE');

    const map1 = generateMap(rng1.map);
    const map2 = generateMap(rng2.map);

    // Compare floor count
    assert(map1.length === map2.length, `Map floor count matches (${map1.length})`);

    // Compare each node
    let allNodesMatch = true;
    for (let f = 0; f < map1.length && allNodesMatch; f++) {
        if (map1[f].length !== map2[f].length) {
            allNodesMatch = false;
            break;
        }
        for (let n = 0; n < map1[f].length; n++) {
            if (map1[f][n].id !== map2[f][n].id || map1[f][n].type !== map2[f][n].type) {
                allNodesMatch = false;
                break;
            }
        }
    }
    assert(allNodesMatch, 'All map nodes match between runs with same seed');
});

runTest('Card reward determinism', () => {
    const rng1 = createGameRNG('CARDS123');
    const rng2 = createGameRNG('CARDS123');

    let allMatch = true;
    for (let i = 0; i < 10 && allMatch; i++) {
        const rewards1 = getRandomRewardCards(3, rng1.cards);
        const rewards2 = getRandomRewardCards(3, rng2.cards);

        const names1 = rewards1.map((c: CardData) => c.name).join(',');
        const names2 = rewards2.map((c: CardData) => c.name).join(',');

        if (names1 !== names2) allMatch = false;
    }
    assert(allMatch, 'Card rewards match across 10 iterations with same seed');
});

runTest('Encounter spawning determinism', () => {
    const rng1 = createGameRNG('ENCOUNTERS');
    const rng2 = createGameRNG('ENCOUNTERS');

    const enc1 = getEncounterForFloor(1, rng1.encounters);
    const enc2 = getEncounterForFloor(1, rng2.encounters);

    const ids1 = enc1.map(e => e.id.split('_')[0]).join(',');
    const ids2 = enc2.map(e => e.id.split('_')[0]).join(',');

    assert(ids1 === ids2, 'Floor 1 encounters match with same seed');
});

runTest('Elite encounter determinism', () => {
    const rng1 = createGameRNG('ELITES');
    const rng2 = createGameRNG('ELITES');

    const elite1 = getEliteEncounter(rng1.encounters);
    const elite2 = getEliteEncounter(rng2.encounters);

    const id1 = elite1[0].id.split('_')[0];
    const id2 = elite2[0].id.split('_')[0];

    assert(id1 === id2, 'Elite encounter matches with same seed');
});

runTest('Boss encounter determinism', () => {
    const rng1 = createGameRNG('BOSSES');
    const rng2 = createGameRNG('BOSSES');

    const boss1 = getBossEncounter(rng1.encounters);
    const boss2 = getBossEncounter(rng2.encounters);

    const id1 = boss1[0].id.split('_')[0];
    const id2 = boss2[0].id.split('_')[0];

    assert(id1 === id2, 'Boss encounter matches with same seed');
});

runTest('Different seeds produce different maps', () => {
    const rng1 = createGameRNG('SEED_A');
    const rng2 = createGameRNG('SEED_B');

    const map1 = generateMap(rng1.map);
    const map2 = generateMap(rng2.map);

    // Check if at least some nodes differ
    let hasDifference = false;
    for (let f = 0; f < Math.min(map1.length, map2.length) && !hasDifference; f++) {
        for (let n = 0; n < Math.min(map1[f].length, map2[f].length); n++) {
            if (map1[f][n].type !== map2[f][n].type || map1[f][n].id !== map2[f][n].id) {
                hasDifference = true;
                break;
            }
        }
    }
    assert(hasDifference, 'Different seeds produce different maps');
});

// ========== SUMMARY ==========

console.log('\n========================================');
console.log(`SEED TESTS COMPLETE`);
console.log(`Passed: ${testsPassed}/${testsRun}`);
console.log(`Failed: ${testsFailed}`);
console.log('========================================');

if (testsFailed > 0) {
    process.exit(1);
}
