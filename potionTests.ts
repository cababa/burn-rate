/**
 * Comprehensive Potion Test Suite
 * Tests ALL potions for correct 1:1 Slay the Spire mapping
 * Verifies: effect application, Sacred Bark doubling, drop mechanics
 */

import { GameState, CardData, EnemyData, PotionData, RelicData } from './types.ts';
import { GAME_DATA } from './constants.ts';
import {
    generateStarterDeck,
    shuffle,
    resolvePotionEffect,
    getSacredBarkMultiplier,
    generateRandomPotion,
    checkPotionDrop,
    canAcquirePotion,
    addPotionToSlot,
    removePotionFromSlot,
    checkFairyPotion,
    canUseExitStrategy,
    getAvailablePotions,
    getPotionsByRarity,
    initializePotionSlots
} from './gameLogic.ts';

// Test result tracking
let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, condition: boolean, details?: string) {
    if (condition) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}${details ? ` - ${details}` : ''}`);
        failed++;
        failures.push(name + (details ? ` (${details})` : ''));
    }
}

function section(title: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${title}`);
    console.log('='.repeat(60));
}

// Create a fresh test game state
function createTestState(): GameState {
    const deck = shuffle(generateStarterDeck());
    return {
        playerStats: {
            ...GAME_DATA.character.stats,
            hp: GAME_DATA.character.stats.hp,
            maxHp: GAME_DATA.character.stats.maxHp,
            bandwidth: 3,
            mitigation: 0,
            statuses: { ...GAME_DATA.character.stats.statuses }
        },
        enemies: [],
        hand: [],
        drawPile: deck,
        deck: [...deck],
        discardPile: [],
        exhaustPile: [],
        relics: [],
        turn: 1,
        floor: 1,
        status: 'PLAYING',
        rewardOptions: [],
        message: '',
        map: [],
        currentMapPosition: null,
        vendorStock: [],
        pendingDiscard: 0,
        potions: [null, null, null],
        potionSlotCount: 3,
        potionDropChance: 40,
        duplicateNextCard: false
    };
}

// Create a test enemy
function createTestEnemy(hp: number = 50, name: string = 'Test Enemy', type: 'normal' | 'elite' | 'boss' = 'normal'): EnemyData {
    return {
        id: `test_${Math.random()}`,
        name,
        act: 1,
        type,
        hp,
        maxHp: hp,
        mitigation: 0,
        emoji: '👾',
        description: 'Test enemy',
        statuses: {
            vulnerable: 0,
            strength: 0,
            growth: 0,
            weak: 0,
            metallicize: 0,
            evolve: 0,
            feelNoPain: 0,
            noDraw: 0,
            thorns: 0,
            antifragile: 0,
            artifact: 0,
            curlUp: 0,
            malleable: 0,
            asleep: 0,
            frail: 0
        },
        currentIntent: { type: 'attack', value: 10, icon: 'attack', description: 'Attack' },
        rewards: { capital: { min: 10, max: 20 }, card_reward: true }
    };
}

// Create mock Sacred Bark relic
function createMockSacredBark(): RelicData {
    return {
        id: 'investors_choice',
        name: "Investor's Choice",
        character: 'cto',
        rarity: 'boss',
        description: 'Potions are twice as effective',
        icon: '🎯',
        trigger: 'passive',
        effect: { type: 'potion_double' }
    };
}

// ========== POTION SLOT TESTS ==========

function testPotionSlots() {
    section('POTION SLOT MANAGEMENT');

    // Test initialization
    {
        const slots = initializePotionSlots(3);
        test('Initialize 3 potion slots', slots.length === 3,
            `Expected 3, got ${slots.length}`);
        test('Slots start empty', slots.every(s => s === null),
            `Slots: ${slots.map(s => s?.name || 'null').join(', ')}`);
    }

    // Test can acquire when empty
    {
        const slots: (PotionData | null)[] = [null, null, null];
        test('Can acquire potion with empty slots', canAcquirePotion(slots));
    }

    // Test can acquire when partially full
    {
        const potion = GAME_DATA.potions.talent_surge;
        const slots: (PotionData | null)[] = [potion, null, null];
        test('Can acquire potion with 1/3 slots full', canAcquirePotion(slots));
    }

    // Test cannot acquire when full
    {
        const potion = GAME_DATA.potions.talent_surge;
        const slots: (PotionData | null)[] = [potion, potion, potion];
        test('Cannot acquire potion with full slots', !canAcquirePotion(slots));
    }

    // Test adding potion to first available slot
    {
        const potion = GAME_DATA.potions.talent_surge;
        const slots: (PotionData | null)[] = [null, null, null];
        const newSlots = addPotionToSlot(slots, potion);
        test('Add potion to first slot', newSlots[0]?.id === potion.id,
            `Slot 0: ${newSlots[0]?.name || 'null'}`);
        test('Other slots remain empty', newSlots[1] === null && newSlots[2] === null);
    }

    // Test removing potion from slot
    {
        const potion = GAME_DATA.potions.talent_surge;
        const slots: (PotionData | null)[] = [potion, null, null];
        const newSlots = removePotionFromSlot(slots, 0);
        test('Remove potion from slot 0', newSlots[0] === null);
    }
}

// ========== POTION DROP TESTS ==========

function testPotionDrops() {
    section('POTION DROP MECHANICS');

    // Test drop chance changes on result
    {
        const result = checkPotionDrop(40);
        if (!result.dropped) {
            test('Drop chance increases by 10 on no drop', result.newChance === 50,
                `Expected 50, got ${result.newChance}`);
        } else {
            test('Drop chance decreases by 10 on drop', result.newChance === 30,
                `Expected 30, got ${result.newChance}`);
        }
    }

    // Test drop chance caps at 100
    {
        const result = checkPotionDrop(100);
        test('100% drop chance guarantees drop', result.dropped);
    }

    // Test rarity weights
    {
        const counts = { common: 0, uncommon: 0, rare: 0 };
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
            const potion = generateRandomPotion('cto', false);
            if (potion) {
                counts[potion.rarity]++;
            }
        }

        const commonRate = counts.common / iterations;
        const uncommonRate = counts.uncommon / iterations;
        const rareRate = counts.rare / iterations;

        test('Common rate ~65%', commonRate > 0.50 && commonRate < 0.80,
            `Got ${(commonRate * 100).toFixed(1)}%`);
        test('Uncommon rate ~25%', uncommonRate > 0.10 && uncommonRate < 0.40,
            `Got ${(uncommonRate * 100).toFixed(1)}%`);
        test('Rare rate ~10%', rareRate > 0.01 && rareRate < 0.20,
            `Got ${(rareRate * 100).toFixed(1)}%`);
    }

    // Test available potions for CTO
    {
        const potions = getAvailablePotions('cto');
        const hasShared = potions.some(p => p.character === 'shared');
        const hasCto = potions.some(p => p.character === 'cto');
        test('Available potions include shared', hasShared);
        test('Available potions include CTO-specific', hasCto);
    }
}

// ========== POTION EFFECT TESTS ==========

function testPotionEffects() {
    section('POTION EFFECTS');

    // Test Talent Surge (Strength Potion) - +2 Velocity (Strength)
    {
        const potion = GAME_DATA.potions.talent_surge;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];
        const prevStrength = state.playerStats.statuses.strength;

        state = resolvePotionEffect(state, potion, 0);

        test('Talent Surge grants +2 Velocity',
            state.playerStats.statuses.strength === prevStrength + 2,
            `Expected ${prevStrength + 2}, got ${state.playerStats.statuses.strength}`);
        test('Potion removed from slot', state.potions[0] === null);
    }

    // Test Process Upgrade (Dexterity Potion) - +2 Dexterity
    {
        const potion = GAME_DATA.potions.process_upgrade;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];
        const prevDex = state.playerStats.statuses.dexterity;

        state = resolvePotionEffect(state, potion, 0);

        test('Process Upgrade grants +2 Dexterity',
            state.playerStats.statuses.dexterity === prevDex + 2,
            `Expected ${prevDex + 2}, got ${state.playerStats.statuses.dexterity}`);
    }

    // Test Emergency Fund (Block Potion) - +12 Block
    {
        const potion = GAME_DATA.potions.emergency_fund;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0);

        test('Emergency Fund grants 12 block',
            state.playerStats.mitigation === 12,
            `Expected 12, got ${state.playerStats.mitigation}`);
    }

    // Test PR Blast (Explosive Potion) - Deal 10 damage to ALL enemies
    {
        const potion = GAME_DATA.potions.pr_blast;
        let state = createTestState();
        state.enemies = [createTestEnemy(50), createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0);

        test('PR Blast damages ALL enemies',
            state.enemies.every(e => e.hp === 40),
            `Enemy HPs: ${state.enemies.map(e => e.hp).join(', ')}`);
    }

    // Test FUD Campaign (Fear Potion) - Apply 3 Vulnerable
    {
        const potion = GAME_DATA.potions.fud_campaign;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);

        test('FUD Campaign applies 3 Exposed',
            state.enemies[0].statuses.vulnerable === 3,
            `Expected 3, got ${state.enemies[0].statuses.vulnerable}`);
    }

    // Test Bad Press (Weak Potion) - Apply 3 Weak
    {
        const potion = GAME_DATA.potions.bad_press;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);

        test('Bad Press applies 3 Drained',
            state.enemies[0].statuses.weak === 3,
            `Expected 3, got ${state.enemies[0].statuses.weak}`);
    }

    // Test Espresso Shot (Energy Potion) - +2 Energy
    {
        const potion = GAME_DATA.potions.espresso_shot;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];
        const prevEnergy = state.playerStats.bandwidth;

        state = resolvePotionEffect(state, potion, 0);

        test('Espresso Shot grants +2 bandwidth',
            state.playerStats.bandwidth === prevEnergy + 2,
            `Expected ${prevEnergy + 2}, got ${state.playerStats.bandwidth}`);
    }

    // Test Angel Check (Fire Potion) - Damage single target
    {
        const potion = GAME_DATA.potions.angel_check;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0, state.enemies[0].id);

        test('Angel Check deals 20 damage',
            state.enemies[0].hp === 30,
            `Expected 30, got ${state.enemies[0].hp}`);
    }

    // Test Sprint Boost (Swift Potion) - Draw 3 cards
    {
        const potion = GAME_DATA.potions.sprint_boost;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];
        const prevHandSize = state.hand.length;

        state = resolvePotionEffect(state, potion, 0);

        test('Sprint Boost draws 3 cards',
            state.hand.length >= prevHandSize + 3 || state.drawPile.length < 3,
            `Hand size went from ${prevHandSize} to ${state.hand.length}`);
    }
}

// ========== SACRED BARK (INVESTOR'S CHOICE) TESTS ==========

function testSacredBark() {
    section('SACRED BARK / INVESTOR\'S CHOICE');

    // Test without Sacred Bark
    {
        const relics: RelicData[] = [];
        const multiplier = getSacredBarkMultiplier(relics);
        test('No Sacred Bark = 1x multiplier', multiplier === 1,
            `Got ${multiplier}`);
    }

    // Test with Sacred Bark
    {
        const mockSacredBark = createMockSacredBark();
        const relics: RelicData[] = [mockSacredBark];
        const multiplier = getSacredBarkMultiplier(relics);
        test('With Sacred Bark = 2x multiplier', multiplier === 2,
            `Got ${multiplier}`);
    }

    // Test doubled potion effect
    {
        const mockSacredBark = createMockSacredBark();
        const potion = GAME_DATA.potions.talent_surge;

        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];
        state.relics = [mockSacredBark];
        const prevStrength = state.playerStats.statuses.strength;

        state = resolvePotionEffect(state, potion, 0);

        test('Talent Surge grants +4 Velocity with Sacred Bark',
            state.playerStats.statuses.strength === prevStrength + 4,
            `Expected ${prevStrength + 4}, got ${state.playerStats.statuses.strength}`);
    }
}

// ========== SPECIAL POTION TESTS ==========

function testSpecialPotions() {
    section('SPECIAL POTIONS');

    // Test Exit Strategy (Smoke Bomb) - can't use on boss
    {
        const normalEnemies = [createTestEnemy(50, 'Normal', 'normal')];
        const bossEnemies = [createTestEnemy(500, 'Boss', 'boss')];

        test('Can use Exit Strategy on normal enemies', canUseExitStrategy(normalEnemies));
        test('Cannot use Exit Strategy on boss', !canUseExitStrategy(bossEnemies));
    }

    // Test Fairy Potion (backup_plan)
    {
        const potion = GAME_DATA.potions.backup_plan;
        const potions: (PotionData | null)[] = [potion, null, null];
        const result = checkFairyPotion(potions, 75, []);

        test('Backup Plan found in potions', result !== null);
        if (result) {
            const expectedHeal = Math.floor(75 * 0.30);
            test(`Backup Plan heals ~30% of max HP`,
                Math.abs(result.healAmount - expectedHeal) <= 1,
                `Expected ~${expectedHeal}, got ${result.healAmount}`);
        }
    }

    // Test duplicate potion (clone_script)
    {
        const potion = GAME_DATA.potions.clone_script;
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.potions = [potion, null, null];

        state = resolvePotionEffect(state, potion, 0);

        test('Clone Script sets duplicateNextCard flag',
            state.duplicateNextCard === true);
    }
}

// ========== RUN ALL TESTS ==========

console.log('\n🧪 POTION SYSTEM TEST SUITE\n');

testPotionSlots();
testPotionDrops();
testPotionEffects();
testSacredBark();
testSpecialPotions();

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failures.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    for (const f of failures) {
        console.log(`  - ${f}`);
    }
}

console.log('');
