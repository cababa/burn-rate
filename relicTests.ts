/**
 * Comprehensive Relic Test Suite
 * Tests ALL relics for correct 1:1 Slay the Spire mapping
 * 
 * Categories:
 * - Starter (1): git_repository
 * - Common (9): sticky_note, opening_move, safety_net, fresh_eyes, fresh_start, 
 *               fallback_position, thick_skin, smart_money, crunch_mode
 * - Uncommon (8): momentum, quick_learner, second_wind, force_multiplier, 
 *                 focus_mode, secret_weapon, growth_mindset, antifragile, market_dominance
 * - Rare (3): coffee_drip, pressure_cooker, phoenix_protocol, wellness_program
 * - Boss (8): pivoting_power, memory_bank, rate_limiter, cutting_corners, 
 *             no_rest_for_the_bold, aggressive_growth, unicorn_status, data_driven
 */

import { GameState, CardData, EnemyData, CharacterStats, RelicData } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE } from './constants.ts';
import {
    generateStarterDeck,
    shuffle,
    drawCards,
    resolveEndTurn,
    resolveEnemyTurn,
    resolveCardEffect,
    getTurnStartBandwidth,
    applyCombatStartRelics,
    applyCombatEndRelics,
    applyTurnEndRelics,
    applyOnAttackRelics,
    applyOnEnemyDeathRelics,
    applyOnDamagedRelics,
    applyOnHpLossRelics,
    applyOnCardReward,
    getSecretWeaponCard,
    getRelicWoundsToAdd,
    getCrunchModeStrength,
    getVulnerableMultiplier,
    getPressureCookerWeak,
    getPhoenixProtocolDamage,
    getHealingMultiplier,
    applyMarketDominanceRelics,
    hasRelic,
    canRestAtSite,
    getCardLimit,
    getDrawBonus,
    hasSneckoEffect,
    hasRetainHand,
    processDrawnCards,
    calculateDamage
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
    console.log(`📋 ${title}`);
    console.log('='.repeat(60));
}

// Create a fresh test game state with proper deep copy
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
        pendingDiscard: 0
    };
}

// Create a test enemy
function createTestEnemy(hp: number = 50, name: string = 'Test Enemy'): EnemyData {
    return {
        id: `test_${Math.random()}`,
        name,
        act: 1,
        type: 'normal',
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

// ========== STARTER RELIC TESTS ==========

function testStarterRelics() {
    section('STARTER RELICS');

    // Test Git Repository (heal 6 at combat end) - Burning Blood equivalent
    {
        let state = createTestState();
        state.playerStats.hp = 50;
        state.playerStats.maxHp = 75;
        state.relics = [GAME_DATA.relics.git_repository];

        const { stats, message } = applyCombatEndRelics(state.playerStats, state.relics);

        test('Git Repository heals 6 HP at combat end', stats.hp === 56,
            `Expected 56, got ${stats.hp}`);
        test('Git Repository shows heal message', message.includes('6'),
            `Message: "${message}"`);
    }

    // Test Git Repository doesn't overheal
    {
        let state = createTestState();
        state.playerStats.hp = 73;
        state.playerStats.maxHp = 75;
        state.relics = [GAME_DATA.relics.git_repository];

        const { stats } = applyCombatEndRelics(state.playerStats, state.relics);

        test('Git Repository respects max HP cap', stats.hp === 75,
            `Expected 75 (capped), got ${stats.hp}`);
    }
}

// ========== COMMON RELIC TESTS ==========

function testCommonRelics() {
    section('COMMON RELICS');

    // Test Sticky Note (apply vulnerable to all enemies at combat start) - Bag of Preparation variant
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50), createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.sticky_note];

        const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Sticky Note applies 1 Exposed to ALL enemies',
            enemies.every(e => e.statuses.vulnerable >= 1),
            `Enemy vulnerable: ${enemies.map(e => e.statuses.vulnerable).join(', ')}`);
    }

    // Test Opening Move (+8 damage on first attack) - Strike Dummy variant
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [{ ...GAME_DATA.relics.opening_move }];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        // First attack should get bonus
        const { bonusDamage: bonus1, stats: stats1 } = applyOnAttackRelics(state.relics, state.playerStats);
        test('Opening Move grants +8 bonus on first attack', bonus1 === 8,
            `Expected 8, got ${bonus1}`);

        // Second attack should NOT get bonus (once per combat)
        const { bonusDamage: bonus2 } = applyOnAttackRelics(state.relics, stats1);
        test('Opening Move does NOT grant bonus on second attack', bonus2 === 0,
            `Expected 0, got ${bonus2}`);
    }

    // Test Safety Net (10 block at combat start) - Anchor equivalent
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.safety_net];

        const { stats } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Safety Net grants 10 Mitigation at combat start', stats.mitigation === 10,
            `Expected 10, got ${stats.mitigation}`);
    }

    // Test Fresh Eyes (passive +1 strength) - Vajra equivalent
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.fresh_eyes];
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const { stats } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Fresh Eyes grants +1 Strength', stats.statuses.strength === 1,
            `Expected 1, got ${stats.statuses.strength}`);
    }

    // Test Fresh Start (+1 bandwidth first turn only) - Lantern equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.fresh_start];

        const bw1 = getTurnStartBandwidth(state.relics, 1);
        const bw2 = getTurnStartBandwidth(state.relics, 2);

        test('Fresh Start grants +1 bandwidth on turn 1', bw1 === 4,
            `Expected 4, got ${bw1}`);
        test('Fresh Start does NOT grant on turn 2', bw2 === 3,
            `Expected 3, got ${bw2}`);
    }

    // Test Fallback Position (gain 6 block if 0 block at turn end) - Orichalcum equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.fallback_position];
        state.playerStats.mitigation = 0;

        const { stats } = applyTurnEndRelics(state.playerStats, state.relics);

        test('Fallback Position grants 6 Mitigation if at 0 block', stats.mitigation === 6,
            `Expected 6, got ${stats.mitigation}`);
    }

    // Test Fallback Position does not trigger if already have block
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.fallback_position];
        state.playerStats.mitigation = 5;

        const { stats } = applyTurnEndRelics(state.playerStats, state.relics);

        test('Fallback Position does NOT trigger with existing block', stats.mitigation === 5,
            `Expected 5, got ${stats.mitigation}`);
    }

    // Test Thick Skin (thorns - deal 3 damage back when hit) - Bronze Scales equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.thick_skin];

        const { thornsDamage } = applyOnDamagedRelics(state.relics, 10, 'enemy_1');

        test('Thick Skin deals 3 thorns damage when hit', thornsDamage === 3,
            `Expected 3, got ${thornsDamage}`);
    }

    // Test Thick Skin does not trigger on 0 damage
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.thick_skin];

        const { thornsDamage } = applyOnDamagedRelics(state.relics, 0, 'enemy_1');

        test('Thick Skin does NOT trigger on 0 damage', thornsDamage === 0,
            `Expected 0, got ${thornsDamage}`);
    }

    // Test Smart Money (+8 gold on card reward) - Golden Idol variant
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.smart_money];
        state.playerStats.capital = 100;

        const { stats } = applyOnCardReward(state.relics, state.playerStats);

        test('Smart Money grants +8 capital on card reward', stats.capital === 108,
            `Expected 108, got ${stats.capital}`);
    }

    // Test Crunch Mode (+3 Strength when HP ≤50%) - Red Skull equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.crunch_mode];
        state.playerStats.hp = 30;
        state.playerStats.maxHp = 75;

        const bonusStrength = getCrunchModeStrength(state.relics, state.playerStats.hp, state.playerStats.maxHp);

        test('Crunch Mode grants +3 Strength when HP ≤50%', bonusStrength === 3,
            `Expected 3, got ${bonusStrength}`);
    }

    // Test Crunch Mode does NOT activate above 50%
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.crunch_mode];
        state.playerStats.hp = 50;
        state.playerStats.maxHp = 75;

        const bonusStrength = getCrunchModeStrength(state.relics, state.playerStats.hp, state.playerStats.maxHp);

        test('Crunch Mode does NOT grant Strength when HP >50%', bonusStrength === 0,
            `Expected 0, got ${bonusStrength}`);
    }
}

// ========== UNCOMMON RELIC TESTS ==========

function testUncommonRelics() {
    section('UNCOMMON RELICS');

    // Test Momentum (+1 Strength every 3 attacks) - Shuriken equivalent
    {
        let state = createTestState();
        state.relics = [{ ...GAME_DATA.relics.momentum }];
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        // First 2 attacks - no bonus yet
        let result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        test('Momentum: 1st attack - no Strength yet', state.playerStats.statuses.strength === 0,
            `Got ${state.playerStats.statuses.strength}`);

        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        test('Momentum: 2nd attack - no Strength yet', state.playerStats.statuses.strength === 0,
            `Got ${state.playerStats.statuses.strength}`);

        // 3rd attack - should trigger
        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        test('Momentum: 3rd attack grants +1 Strength', state.playerStats.statuses.strength === 1,
            `Expected 1, got ${state.playerStats.statuses.strength}`);
    }

    // Test Quick Learner (+1 Dexterity every 3 attacks) - Kunai equivalent
    {
        let state = createTestState();
        state.relics = [{ ...GAME_DATA.relics.quick_learner }];
        state.playerStats.statuses = { ...state.playerStats.statuses, dexterity: 0 };

        // 3 attacks to trigger
        let result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;

        test('Quick Learner grants +1 Dexterity after 3 attacks',
            state.playerStats.statuses.dexterity === 1,
            `Expected 1, got ${state.playerStats.statuses.dexterity}`);
    }

    // Test Focus Mode (+4 Block every 3 attacks) - Ornamental Fan equivalent
    {
        let state = createTestState();
        state.relics = [{ ...GAME_DATA.relics.focus_mode }];
        state.playerStats.mitigation = 0;

        // 3 attacks to trigger
        let result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;
        result = applyOnAttackRelics(state.relics, state.playerStats);
        state.playerStats = result.stats;

        test('Focus Mode grants +4 Mitigation after 3 attacks', state.playerStats.mitigation === 4,
            `Expected 4, got ${state.playerStats.mitigation}`);
    }

    // Test Second Wind (heal 12 if HP ≤50% after combat) - Meat on the Bone equivalent
    {
        let state = createTestState();
        state.playerStats.hp = 30; // ≤50% of 75
        state.playerStats.maxHp = 75;
        state.relics = [GAME_DATA.relics.second_wind];

        const { stats } = applyCombatEndRelics(state.playerStats, state.relics);

        test('Second Wind heals 12 HP when at ≤50%', stats.hp === 42,
            `Expected 42, got ${stats.hp}`);
    }

    // Test Second Wind does NOT trigger above 50%
    {
        let state = createTestState();
        state.playerStats.hp = 50; // >50% of 75 (threshold is 50%, so 50 is >37.5)
        state.playerStats.maxHp = 75;
        state.relics = [GAME_DATA.relics.second_wind];

        const { stats } = applyCombatEndRelics(state.playerStats, state.relics);

        // At 50/75 = 66.7%, trigger threshold is 50% (so 37.5 HP)
        // 50 > 37.5, so should NOT trigger
        test('Second Wind does NOT trigger when HP >50%', stats.hp === 50,
            `Expected 50, got ${stats.hp}`);
    }

    // Test Force Multiplier (+1 energy +1 draw on enemy death) - Gremlin Horn equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.force_multiplier];
        state.playerStats.bandwidth = 2;

        const { stats, drawCards: cardsToDraw } = applyOnEnemyDeathRelics(state.relics, state.playerStats);

        test('Force Multiplier grants +1 bandwidth on enemy death', stats.bandwidth === 3,
            `Expected 3, got ${stats.bandwidth}`);
        test('Force Multiplier grants +1 card draw on enemy death', cardsToDraw === 1,
            `Expected 1, got ${cardsToDraw}`);
    }

    // Test Secret Weapon (start with chosen skill card)
    {
        let state = createTestState();
        const skillCard = state.deck.find(c => c.type === 'skill');
        state.relics = [{ ...GAME_DATA.relics.secret_weapon }];

        const chosenCard = getSecretWeaponCard(state.relics, state.deck);

        test('Secret Weapon returns a skill card', chosenCard !== null && chosenCard.type === 'skill',
            `Got ${chosenCard?.type || 'null'}`);
    }

    // Test Growth Mindset (Vulnerable = 75% instead of 50%) - Paper Phrog equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.growth_mindset];

        const multiplier = getVulnerableMultiplier(state.relics);

        test('Growth Mindset increases Vulnerable to 75%', multiplier === 1.75,
            `Expected 1.75, got ${multiplier}`);
    }

    // Test Growth Mindset damage bonus in combat
    {
        const testEnemy = createTestEnemy(50);
        testEnemy.statuses.vulnerable = 2;
        const relics = [GAME_DATA.relics.growth_mindset];
        const playerStatus = { ...GAME_DATA.character.stats.statuses };
        const neutralStatus = { ...testEnemy.statuses, vulnerable: 0 };

        const normalDamage = calculateDamage(6, playerStatus, neutralStatus, 1, relics);
        const vulnerableDamage = calculateDamage(6, playerStatus, testEnemy.statuses, 1, relics);

        test('Growth Mindset: 6 base damage becomes 10 vs Vulnerable',
            vulnerableDamage === 10, // 6 * 1.75 = 10.5, floored = 10
            `Expected 10 (6 * 1.75), got ${vulnerableDamage}`);
    }

    // Test Antifragile (gain 3 block next turn on HP loss) - Self-Forming Clay equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.antifragile];

        const { blockNextTurn } = applyOnHpLossRelics(state.relics, 10);

        test('Antifragile grants 3 block next turn on HP loss', blockNextTurn === 3,
            `Expected 3, got ${blockNextTurn}`);
    }

    // Test Antifragile does NOT trigger on 0 damage
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.antifragile];

        const { blockNextTurn } = applyOnHpLossRelics(state.relics, 0);

        test('Antifragile does NOT trigger on 0 damage', blockNextTurn === 0,
            `Expected 0, got ${blockNextTurn}`);
    }

    // Test Market Dominance (+2 Strength to player, +1 to enemies at turn start) - Brimstone equivalent
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50), createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.market_dominance];
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const { stats, enemies } = applyMarketDominanceRelics(state.relics, state.playerStats, state.enemies);

        test('Market Dominance grants +2 Strength to player', stats.statuses.strength === 2,
            `Expected 2, got ${stats.statuses.strength}`);
        test('Market Dominance grants +1 Strength to all enemies',
            enemies.every(e => e.statuses.strength === 1),
            `Enemy strength: ${enemies.map(e => e.statuses.strength).join(', ')}`);
    }
}

// ========== RARE RELIC TESTS ==========

function testRareRelics() {
    section('RARE RELICS');

    // Test Coffee Drip (+1 bandwidth every turn) - Custom relic
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.coffee_drip];

        const bandwidth = getTurnStartBandwidth(state.relics);

        test('Coffee Drip grants +1 bandwidth every turn', bandwidth === 4,
            `Expected 4, got ${bandwidth}`);
    }

    // Test Pressure Cooker (apply Weak when applying Vulnerable) - Champion Belt equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.pressure_cooker];

        const weakAmount = getPressureCookerWeak(state.relics);

        test('Pressure Cooker grants 1 Weak when applying Vulnerable', weakAmount === 1,
            `Expected 1, got ${weakAmount}`);
    }

    // Test Pressure Cooker integration with Sticky Note
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.sticky_note, GAME_DATA.relics.pressure_cooker];

        const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Pressure Cooker + Sticky Note applies both Vulnerable and Weak',
            enemies[0].statuses.vulnerable >= 1 && enemies[0].statuses.weak >= 1,
            `Vulnerable: ${enemies[0].statuses.vulnerable}, Weak: ${enemies[0].statuses.weak}`);
    }

    // Test Phoenix Protocol (deal 3 damage to all on exhaust) - Charon's Ashes equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.phoenix_protocol];

        const damage = getPhoenixProtocolDamage(state.relics);

        test('Phoenix Protocol deals 3 damage on exhaust', damage === 3,
            `Expected 3, got ${damage}`);
    }

    // Test Wellness Program (healing 50% more effective) - Magic Flower equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.wellness_program];

        const multiplier = getHealingMultiplier(state.relics);

        test('Wellness Program increases healing by 50%', multiplier === 1.5,
            `Expected 1.5, got ${multiplier}`);
    }
}

// ========== BOSS RELIC TESTS ==========

function testBossRelics() {
    section('BOSS RELICS');

    // Test Pivoting Power (Snecko Eye - draw 2 more, randomize costs)
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.pivoting_power];

        const hasSnecko = hasSneckoEffect(state.relics);
        const drawBonus = getDrawBonus(state.relics);

        test('Pivoting Power enables Snecko effect', hasSnecko === true,
            `Expected true, got ${hasSnecko}`);
        test('Pivoting Power grants +2 draw bonus', drawBonus === 2,
            `Expected 2, got ${drawBonus}`);
    }

    // Test Memory Bank (cards not discarded at end of turn) - Runic Pyramid equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.memory_bank];

        const retains = hasRetainHand(state.relics);

        test('Memory Bank enables retain hand', retains === true,
            `Expected true, got ${retains}`);
    }

    // Test Rate Limiter (+1 bandwidth, 6 card limit) - Velvet Choker equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.rate_limiter];

        const bandwidth = getTurnStartBandwidth(state.relics);
        const cardLimit = getCardLimit(state.relics);

        test('Rate Limiter grants +1 bandwidth', bandwidth === 4,
            `Expected 4, got ${bandwidth}`);
        test('Rate Limiter limits to 6 cards per turn', cardLimit === 6,
            `Expected 6, got ${cardLimit}`);
    }

    // Test Cutting Corners (+1 bandwidth, adds 2 wounds) - Ectoplasm analogy
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.cutting_corners];

        const bandwidth = getTurnStartBandwidth(state.relics);
        const wounds = getRelicWoundsToAdd(state.relics);

        test('Cutting Corners grants +1 bandwidth', bandwidth === 4,
            `Expected 4, got ${bandwidth}`);
        test('Cutting Corners adds 2 Bug cards', wounds.length === 2,
            `Expected 2, got ${wounds.length}`);
    }

    // Test No Rest for the Bold (+1 bandwidth, can't rest) - Coffee Dripper equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.no_rest_for_the_bold];

        const bandwidth = getTurnStartBandwidth(state.relics);
        const canRest = canRestAtSite(state.relics);

        test('No Rest for Bold grants +1 bandwidth', bandwidth === 4,
            `Expected 4, got ${bandwidth}`);
        test('No Rest for Bold disables resting', canRest === false,
            `Expected false, got ${canRest}`);
    }

    // Test Aggressive Growth (+1 bandwidth, enemies start with +1 Strength) - Cursed Key analogy
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [GAME_DATA.relics.aggressive_growth];

        const bandwidth = getTurnStartBandwidth(state.relics);
        const { enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Aggressive Growth grants +1 bandwidth', bandwidth === 4,
            `Expected 4, got ${bandwidth}`);
        test('Aggressive Growth gives enemies +1 Strength', enemies[0].statuses.strength === 1,
            `Expected 1, got ${enemies[0].statuses.strength}`);
    }

    // Test Unicorn Status (heal 12 at combat end - upgraded Git Repository) - Black Blood equivalent
    {
        let state = createTestState();
        state.playerStats.hp = 50;
        state.playerStats.maxHp = 75;
        state.relics = [GAME_DATA.relics.unicorn_status];

        const { stats } = applyCombatEndRelics(state.playerStats, state.relics);

        test('Unicorn Status heals 12 HP at combat end', stats.hp === 62,
            `Expected 62, got ${stats.hp}`);
    }

    // Test Data-Driven (draw 1 card on HP loss) - Runic Cube equivalent
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.data_driven];

        const { drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 10);

        test('Data-Driven draws 1 card on HP loss', cardsToDraw === 1,
            `Expected 1, got ${cardsToDraw}`);
    }

    // Test Data-Driven does NOT trigger on 0 damage
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.data_driven];

        const { drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 0);

        test('Data-Driven does NOT trigger on 0 damage', cardsToDraw === 0,
            `Expected 0, got ${cardsToDraw}`);
    }
}

// ========== RELIC STACKING TESTS ==========

function testRelicStacking() {
    section('RELIC STACKING & COMBOS');

    // Test multiple bandwidth relics stack
    {
        let state = createTestState();
        state.relics = [
            GAME_DATA.relics.coffee_drip,
            GAME_DATA.relics.rate_limiter,
            GAME_DATA.relics.cutting_corners
        ];

        const bandwidth = getTurnStartBandwidth(state.relics);

        test('Multiple bandwidth relics stack (3 + 1 + 1 + 1 = 6)', bandwidth === 6,
            `Expected 6, got ${bandwidth}`);
    }

    // Test multiple combat start relics
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.relics = [
            GAME_DATA.relics.safety_net,
            GAME_DATA.relics.sticky_note,
            GAME_DATA.relics.fresh_eyes
        ];
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const { stats, enemies } = applyCombatStartRelics(state.playerStats, state.relics, state.enemies);

        test('Safety Net + Fresh Eyes: Block and Strength applied',
            stats.mitigation === 10 && stats.statuses.strength === 1,
            `Block: ${stats.mitigation}, Strength: ${stats.statuses.strength}`);
        test('Sticky Note applies Vulnerable alongside other relics',
            enemies[0].statuses.vulnerable >= 1,
            `Vulnerable: ${enemies[0].statuses.vulnerable}`);
    }

    // Test Antifragile + Data-Driven combo on same HP loss
    {
        let state = createTestState();
        state.relics = [GAME_DATA.relics.antifragile, GAME_DATA.relics.data_driven];

        const { blockNextTurn, drawCards: cardsToDraw } = applyOnHpLossRelics(state.relics, 10);

        test('Antifragile + Data-Driven both trigger on HP loss',
            blockNextTurn === 3 && cardsToDraw === 1,
            `Block next turn: ${blockNextTurn}, Cards to draw: ${cardsToDraw}`);
    }

    // Test on_attack_count relics don't interfere with each other
    {
        let state = createTestState();
        state.relics = [
            { ...GAME_DATA.relics.momentum },
            { ...GAME_DATA.relics.quick_learner },
            { ...GAME_DATA.relics.focus_mode }
        ];
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0, dexterity: 0 };
        state.playerStats.mitigation = 0;

        // Perform 3 attacks
        for (let i = 0; i < 3; i++) {
            const result = applyOnAttackRelics(state.relics, state.playerStats);
            state.playerStats = result.stats;
        }

        test('All on_attack_count relics trigger after 3 attacks',
            state.playerStats.statuses.strength === 1 &&
            state.playerStats.statuses.dexterity === 1 &&
            state.playerStats.mitigation === 4,
            `Strength: ${state.playerStats.statuses.strength}, Dex: ${state.playerStats.statuses.dexterity}, Block: ${state.playerStats.mitigation}`);
    }

    // Test combat end relics stack
    {
        let state = createTestState();
        state.playerStats.hp = 30; // ≤50%
        state.playerStats.maxHp = 75;
        state.relics = [
            GAME_DATA.relics.git_repository, // +6
            GAME_DATA.relics.second_wind      // +12 if ≤50%
        ];

        const { stats } = applyCombatEndRelics(state.playerStats, state.relics);

        test('Git Repository + Second Wind heal 18 total when ≤50%',
            stats.hp === 48, // 30 + 6 + 12 = 48
            `Expected 48, got ${stats.hp}`);
    }
}

// ========== RELIC 1:1 MAPPING VERIFICATION ==========

function testRelicMappings() {
    section('RELIC 1:1 MAPPING VERIFICATION');

    const relics = GAME_DATA.relics;

    // Verify all relics have required properties
    const requiredProps = ['id', 'name', 'rarity', 'trigger', 'effect', 'description', 'icon'];
    let allValid = true;

    Object.entries(relics).forEach(([key, relic]) => {
        const r = relic as RelicData;
        const missing = requiredProps.filter(prop => !(prop in r) || r[prop as keyof RelicData] === undefined);
        if (missing.length > 0) {
            console.log(`❌ ${key} missing: ${missing.join(', ')}`);
            allValid = false;
        }
    });
    test('All relics have required properties', allValid);

    // Verify rarity distribution matches StS expectations
    const byRarity: Record<string, string[]> = {};
    Object.entries(relics).forEach(([key, relic]) => {
        const r = relic as RelicData;
        if (!byRarity[r.rarity]) byRarity[r.rarity] = [];
        byRarity[r.rarity].push(key);
    });

    console.log('\n📊 Relic Distribution:');
    Object.entries(byRarity).forEach(([rarity, keys]) => {
        console.log(`   ${rarity}: ${keys.length} relics`);
    });

    test('Has starter relic', byRarity['starter']?.length >= 1, `Got ${byRarity['starter']?.length || 0}`);
    test('Has common relics', byRarity['common']?.length >= 5, `Got ${byRarity['common']?.length || 0}`);
    test('Has uncommon relics', byRarity['uncommon']?.length >= 4, `Got ${byRarity['uncommon']?.length || 0}`);
    test('Has boss relics', byRarity['boss']?.length >= 5, `Got ${byRarity['boss']?.length || 0}`);

    // Verify trigger types are valid
    const validTriggers = [
        'turn_start', 'turn_end', 'combat_start', 'combat_end', 'on_play', 'on_draw',
        'passive', 'first_attack', 'first_turn', 'turn_end_conditional', 'on_damaged',
        'on_card_reward', 'on_attack_count', 'combat_end_conditional', 'on_enemy_death',
        'on_hp_loss', 'on_vulnerable', 'on_exhaust'
    ];

    let allTriggersValid = true;
    Object.entries(relics).forEach(([key, relic]) => {
        const r = relic as RelicData;
        if (!validTriggers.includes(r.trigger)) {
            console.log(`❌ ${key} has invalid trigger: ${r.trigger}`);
            allTriggersValid = false;
        }
    });
    test('All relics have valid trigger types', allTriggersValid);

    // Verify all effect types have handlers
    const handledEffects = [
        'heal', 'block', 'apply_vulnerable_all', 'strength', 'gain_bandwidth',
        'block_if_zero', 'thorns', 'bonus_capital', 'bonus_damage', 'strength_per_attacks',
        'dexterity_per_attacks', 'block_per_attacks', 'heal_if_low', 'energy_and_draw',
        'start_with_card', 'snecko', 'retain_hand', 'strength_when_low', 'vulnerable_bonus',
        'block_next_turn', 'draw_on_hp_loss', 'apply_weak_on_vulnerable', 'damage_all_on_exhaust',
        'healing_bonus', 'strength_both'
    ];

    let allEffectsHandled = true;
    Object.entries(relics).forEach(([key, relic]) => {
        const r = relic as RelicData;
        const effectType = r.effect?.type;
        if (effectType && !handledEffects.includes(effectType)) {
            console.log(`⚠️ ${key} effect type may need handler: ${effectType}`);
            allEffectsHandled = false;
        }
    });
    test('All relic effect types have handlers', allEffectsHandled);
}

// ========== RUN ALL TESTS ==========

console.log('\n🔍 COMPREHENSIVE RELIC TEST SUITE\n');
console.log('Testing all relics for 1:1 StS mapping accuracy...\n');

testStarterRelics();
testCommonRelics();
testUncommonRelics();
testRareRelics();
testBossRelics();
testRelicStacking();
testRelicMappings();

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 RELIC TEST SUMMARY');
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

console.log('\n');

// Export for potential module usage
export { testStarterRelics, testCommonRelics, testUncommonRelics, testRareRelics, testBossRelics };
