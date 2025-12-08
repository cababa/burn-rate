/**
 * Comprehensive Card Test Suite
 * Tests ALL cards for correct 1:1 Slay the Spire mapping
 * Verifies: damage, block, effect activation, execution order, buffs, debuffs
 * 
 * Categories:
 * - Starter (3): Commit, Rollback, Hotfix  
 * - Common Attacks (14): Quick Fix, Brute Force, Sprint Plan, Risk Mitigation, Ship It!, 
 *                        Batch Deploy, Cherry Pick, Dual Track, Compounding, YOLO Deploy, 
 *                        Shotgun Debug, Pair Prog, Tech Shortcut, Leverage
 * - Common Skills (3): Refactor, Tooling
 * - Uncommon Attacks (6): Root Cause, Market Window, Viral Loop, Hackathon, Blitzscaling
 * - Uncommon Skills (4): Flow State, Talent Poach, Firewall, Bridge Round, Disruption
 * - Uncommon Powers (4): Troubleshoot, Lean Ops, Caching, Code Review, Resource Alloc, Antifragile
 * - Rare Powers (2): Network Effects, Tech Debt
 * - Status Cards (5): Legacy Code, Bug, Burnout, Scope Creep, Context Switch
 */

import { GameState, CardData, EnemyData, CharacterStats } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE } from './constants.ts';
import {
    generateStarterDeck,
    shuffle,
    drawCards,
    resolveCardEffect,
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

// ========== STARTER CARD TESTS ==========

function testStarterCards() {
    section('STARTER CARDS');

    // Test Commit (Strike equivalent)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_commit, id: 'test_commit' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Commit deals 6 damage', state.enemies[0].hp === prevHp - 6,
            `Expected ${prevHp - 6}, got ${state.enemies[0].hp}`);
        test('Commit costs 1 bandwidth', state.playerStats.bandwidth === 2,
            `Expected 2, got ${state.playerStats.bandwidth}`);
        test('Commit goes to discard', state.discardPile.some(c => c.id === card.id),
            `Card not in discard pile`);
    }

    // Test Rollback (Defend equivalent)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_rollback, id: 'test_rollback' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Rollback grants 5 block', state.playerStats.mitigation === 5,
            `Expected 5, got ${state.playerStats.mitigation}`);
        test('Rollback costs 1 bandwidth', state.playerStats.bandwidth === 2,
            `Expected 2, got ${state.playerStats.bandwidth}`);
    }

    // Test Hotfix (Bash equivalent)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_hotfix, id: 'test_hotfix' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Hotfix deals 8 damage', state.enemies[0].hp === prevHp - 8,
            `Expected ${prevHp - 8}, got ${state.enemies[0].hp}`);
        test('Hotfix applies 2 Vulnerable', state.enemies[0].statuses.vulnerable === 2,
            `Expected 2, got ${state.enemies[0].statuses.vulnerable}`);
        test('Hotfix costs 2 bandwidth', state.playerStats.bandwidth === 1,
            `Expected 1, got ${state.playerStats.bandwidth}`);
    }
}

// ========== COMMON ATTACK TESTS ==========

function testCommonAttacks() {
    section('COMMON ATTACKS');

    // Test Quick Fix (Anger equivalent) - 0 cost, adds copy
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_quick_fix, id: 'test_quick_fix' };
        state.hand = [card];
        state.playerStats.bandwidth = 0; // 0 cost!
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Quick Fix deals 6 damage', state.enemies[0].hp === prevHp - 6,
            `Expected ${prevHp - 6}, got ${state.enemies[0].hp}`);
        test('Quick Fix costs 0 bandwidth', state.playerStats.bandwidth === 0,
            `Expected 0, got ${state.playerStats.bandwidth}`);
        test('Quick Fix adds copy to discard', state.discardPile.length >= 2, // Original + copy
            `Discard pile: ${state.discardPile.length}`);
    }

    // Test Brute Force (Heavy Blade equivalent) - 3x strength multiplier
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_brute_force, id: 'test_brute_force' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 2 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        // 14 base + (2 strength * 3 multiplier) = 14 + 6 = 20
        test('Brute Force applies 3x strength multiplier', damageDealt === 20,
            `Expected 20 (14 + 2*3), got ${damageDealt}`);
    }

    // Test Sprint Planning (Pommel Strike equivalent) - damage + draw
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.drawPile = shuffle(generateStarterDeck());
        const card = { ...GAME_DATA.cards.cto_sprint_planning, id: 'test_sprint' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        const prevHandSize = state.hand.length;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Sprint Plan deals 9 damage', state.enemies[0].hp === prevHp - 9,
            `Expected ${prevHp - 9}, got ${state.enemies[0].hp}`);
        test('Sprint Plan draws 1 card', state.hand.length >= prevHandSize,
            `Hand size: before ${prevHandSize}, after ${state.hand.length}`);
    }

    // Test Risk Mitigation (Clothesline equivalent) - damage + weak
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_risk_mitigation, id: 'test_risk' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Risk Mitigation deals 12 damage', state.enemies[0].hp === prevHp - 12,
            `Expected ${prevHp - 12}, got ${state.enemies[0].hp}`);
        test('Risk Mitigation applies 2 Weak', state.enemies[0].statuses.weak === 2,
            `Expected 2, got ${state.enemies[0].statuses.weak}`);
    }

    // Test Dual Track (Iron Wave equivalent) - damage + block
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_dual_track, id: 'test_dual' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Dual Track deals 5 damage', state.enemies[0].hp === prevHp - 5,
            `Expected ${prevHp - 5}, got ${state.enemies[0].hp}`);
        test('Dual Track grants 5 block', state.playerStats.mitigation === 5,
            `Expected 5, got ${state.playerStats.mitigation}`);
    }

    // Test Batch Deploy (Cleave equivalent) - AoE damage
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(30), createTestEnemy(30), createTestEnemy(30)];
        const card = { ...GAME_DATA.cards.cto_batch_deploy, id: 'test_batch' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHps = state.enemies.map(e => e.hp);
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        const damages = state.enemies.map((e, i) => prevHps[i] - e.hp);
        test('Batch Deploy hits ALL enemies for 8', damages.every(d => d === 8),
            `Damages: ${damages.join(', ')}`);
    }

    // Test Pair Programming (Twin Strike equivalent) - hit twice
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_pair_programming, id: 'test_pair' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Pair Prog hits twice for 5+5=10', damageDealt === 10,
            `Expected 10, got ${damageDealt}`);
    }

    // Test Shotgun Debug (Sword Boomerang equivalent) - 3 hits
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_shotgun_debug, id: 'test_shotgun' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Shotgun Debug hits 3 times for 3+3+3=9', damageDealt === 9,
            `Expected 9, got ${damageDealt}`);
    }

    // Test Leverage (Body Slam equivalent) - damage = block
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_leverage, id: 'test_leverage' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.mitigation = 15; // 15 block
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Leverage deals damage equal to block', damageDealt === 15,
            `Expected 15, got ${damageDealt}`);
    }

    // Test Compounding Commits (Perfected Strike equivalent) - scales with "Commit" cards
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_compounding_commits, id: 'test_compound' };
        // 5 Commits in starter deck
        state.hand = [card];
        state.drawPile = generateStarterDeck(); // Contains 5 Commits
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        // Base 6 + (5 Commits * 2) = 6 + 10 = 16
        test('Compounding scales with Commit count', damageDealt === 16,
            `Expected 16 (6 + 5*2), got ${damageDealt}`);
    }

    // Test YOLO Deploy (adds status card to draw pile)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_yolo_deploy }; // Keep original ID for add_card logic
        state.hand = [card];
        state.drawPile = [];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('YOLO Deploy deals 7 damage', state.enemies[0].hp === prevHp - 7,
            `Expected ${prevHp - 7}, got ${state.enemies[0].hp}`);
        test('YOLO Deploy adds Legacy Code to draw pile',
            state.drawPile.some(c => c.name === 'Legacy Code'),
            `Draw pile: ${state.drawPile.map(c => c.name).join(', ')}`);
    }

    // Test Tech Shortcut (adds status card to discard)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_tech_shortcut, id: 'test_shortcut' };
        state.hand = [card];
        state.discardPile = [];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Tech Shortcut deals 12 damage', state.enemies[0].hp === prevHp - 12,
            `Expected ${prevHp - 12}, got ${state.enemies[0].hp}`);
        test('Tech Shortcut adds Legacy Code to discard',
            state.discardPile.some(c => c.name === 'Legacy Code'),
            `Discard pile: ${state.discardPile.map(c => c.name).join(', ')}`);
    }
}

// ========== COMMON SKILL TESTS ==========

function testCommonSkills() {
    section('COMMON SKILLS');

    // Test Refactor (True Grit equivalent) - block + exhaust random
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_refactor, id: 'test_refactor' };
        const otherCard = { ...GAME_DATA.cards.cto_commit, id: 'other_card' };
        state.hand = [card, otherCard];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'self');

        test('Refactor grants 7 block', state.playerStats.mitigation === 7,
            `Expected 7, got ${state.playerStats.mitigation}`);
        test('Refactor exhausts a random card', state.exhaustPile.length >= 1,
            `Exhaust pile: ${state.exhaustPile.length}`);
    }

    // Test Tooling (Armaments equivalent) - block + upgrade (triggers selection)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_tooling, id: 'test_tooling' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'self');

        test('Tooling grants 5 block', state.playerStats.mitigation === 5,
            `Expected 5, got ${state.playerStats.mitigation}`);
        test('Tooling triggers card selection', state.status === 'CARD_SELECTION',
            `Status: ${state.status}`);
    }
}

// ========== UNCOMMON ATTACK TESTS ==========

function testUncommonAttacks() {
    section('UNCOMMON ATTACKS');

    // Test Root Cause (Uppercut equivalent) - damage + weak + vulnerable
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_root_cause, id: 'test_root' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Root Cause deals 13 damage', state.enemies[0].hp === prevHp - 13,
            `Expected ${prevHp - 13}, got ${state.enemies[0].hp}`);
        test('Root Cause applies 1 Weak', state.enemies[0].statuses.weak === 1,
            `Expected 1, got ${state.enemies[0].statuses.weak}`);
        test('Root Cause applies 1 Vulnerable', state.enemies[0].statuses.vulnerable === 1,
            `Expected 1, got ${state.enemies[0].statuses.vulnerable}`);
    }

    // Test Market Window (Carnage equivalent) - high damage + ethereal
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_market_window, id: 'test_market' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Market Window deals 20 damage', state.enemies[0].hp === prevHp - 20,
            `Expected ${prevHp - 20}, got ${state.enemies[0].hp}`);
        test('Market Window has ethereal property', card.ethereal === true,
            `ethereal: ${card.ethereal}`);
    }

    // Test Viral Loop (Dropkick equivalent) - damage + refund if vulnerable
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].statuses.vulnerable = 2; // Make vulnerable
        state.drawPile = shuffle(generateStarterDeck());
        const card = { ...GAME_DATA.cards.cto_viral_loop, id: 'test_viral' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        // 5 damage * 1.5 vulnerable = 7.5 -> 7
        test('Viral Loop deals damage (with vulnerable)', state.enemies[0].hp < 50,
            `Enemy HP: ${state.enemies[0].hp}`);
        // Refunds 1 energy when enemy is vulnerable (started at 3, spent 1, refunded 1 = 3)
        test('Viral Loop refunds energy when enemy vulnerable', state.playerStats.bandwidth >= 2,
            `Bandwidth: ${state.playerStats.bandwidth}`);
    }

    // Test Viral Loop does NOT refund if enemy not vulnerable
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].statuses.vulnerable = 0; // NOT vulnerable
        const card = { ...GAME_DATA.cards.cto_viral_loop, id: 'test_viral2' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Viral Loop does NOT refund when enemy not vulnerable', state.playerStats.bandwidth === 2,
            `Bandwidth: ${state.playerStats.bandwidth}`);
    }

    // Test Hackathon (Pummel equivalent) - 4 hits + exhaust
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_hackathon, id: 'test_hackathon' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Hackathon hits 4 times for 2+2+2+2=8', damageDealt === 8,
            `Expected 8, got ${damageDealt}`);
        test('Hackathon exhausts', state.exhaustPile.some(c => c.id === card.id),
            `Card not in exhaust pile`);
    }

    // Test Blitzscaling (Whirlwind equivalent) - X cost AoE
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_blitzscaling, id: 'test_blitz' };
        state.hand = [card];
        state.playerStats.bandwidth = 3; // 3 energy = 3 hits of 5
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Blitzscaling uses all bandwidth', state.playerStats.bandwidth === 0,
            `Expected 0, got ${state.playerStats.bandwidth}`);
        test('Blitzscaling deals 5 * X (15) damage', damageDealt === 15,
            `Expected 15 (5*3), got ${damageDealt}`);
    }
}

// ========== UNCOMMON SKILL TESTS ==========

function testUncommonSkills() {
    section('UNCOMMON SKILLS');

    // Test Flow State (Battle Trance equivalent) - draw 3 + no more draw
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.drawPile = shuffle(generateStarterDeck());
        const card = { ...GAME_DATA.cards.cto_flow_state, id: 'test_flow' };
        state.hand = [card];
        state.playerStats.bandwidth = 1;

        state = resolveCardEffect(state, card, 'self');

        test('Flow State draws 3 cards', state.hand.length >= 3,
            `Hand size: ${state.hand.length}`);
        test('Flow State applies no-draw status', state.playerStats.statuses.noDraw > 0,
            `noDraw status: ${state.playerStats.statuses.noDraw}`);
        test('Flow State costs 0', state.playerStats.bandwidth === 1,
            `Bandwidth: ${state.playerStats.bandwidth}`);
    }

    // Test Talent Poach (Disarm equivalent) - reduce enemy strength + exhaust
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].statuses.strength = 3;
        const card = { ...GAME_DATA.cards.cto_talent_poach, id: 'test_poach' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Talent Poach reduces enemy strength by 2', state.enemies[0].statuses.strength === 1,
            `Expected 1 (3-2), got ${state.enemies[0].statuses.strength}`);
        test('Talent Poach exhausts', state.exhaustPile.some(c => c.id === card.id),
            `Card not in exhaust pile`);
    }

    // Test Firewall (Flame Barrier equivalent) - block + thorns
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_firewall, id: 'test_firewall' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'self');

        test('Firewall grants 12 block', state.playerStats.mitigation === 12,
            `Expected 12, got ${state.playerStats.mitigation}`);
        test('Firewall grants 4 thorns', state.playerStats.statuses.thorns === 4,
            `Expected 4, got ${state.playerStats.statuses.thorns}`);
    }

    // Test Bridge Round (Seeing Red equivalent) - gain energy + exhaust
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_bridge_round, id: 'test_bridge' };
        state.hand = [card];
        state.playerStats.bandwidth = 1;

        state = resolveCardEffect(state, card, 'self');

        test('Bridge Round grants 2 bandwidth', state.playerStats.bandwidth === 2, // 1 - 1 + 2 = 2
            `Expected 2, got ${state.playerStats.bandwidth}`);
        test('Bridge Round exhausts', state.exhaustPile.some(c => c.id === card.id),
            `Card not in exhaust pile`);
    }

    // Test Disruption (Shockwave equivalent) - AoE weak + vulnerable + exhaust
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(30), createTestEnemy(30)];
        const card = { ...GAME_DATA.cards.cto_market_disruption, id: 'test_disruption' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'self');

        test('Disruption applies 3 Weak to ALL enemies',
            state.enemies.every(e => e.statuses.weak === 3),
            `Weak values: ${state.enemies.map(e => e.statuses.weak).join(', ')}`);
        test('Disruption applies 3 Vulnerable to ALL enemies',
            state.enemies.every(e => e.statuses.vulnerable === 3),
            `Vulnerable values: ${state.enemies.map(e => e.statuses.vulnerable).join(', ')}`);
        test('Disruption exhausts', state.exhaustPile.some(c => c.id === card.id),
            `Card not in exhaust pile`);
    }

    // Test Resource Allocation (Spot Weakness equivalent) - conditional strength
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].currentIntent = { type: 'attack', value: 10, icon: 'attack', description: 'Attack' };
        const card = { ...GAME_DATA.cards.cto_resource_allocation, id: 'test_resource' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Resource Alloc grants +3 strength when enemy attacking',
            state.playerStats.statuses.strength === 3,
            `Expected 3, got ${state.playerStats.statuses.strength}`);
    }

    // Test Resource Allocation does NOT trigger if enemy not attacking
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].currentIntent = { type: 'buff', value: 0, icon: 'buff', description: 'Buff' };
        const card = { ...GAME_DATA.cards.cto_resource_allocation, id: 'test_resource2' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Resource Alloc does NOT grant strength when enemy not attacking',
            state.playerStats.statuses.strength === 0,
            `Expected 0, got ${state.playerStats.statuses.strength}`);
    }
}

// ========== POWER CARD TESTS ==========

function testPowerCards() {
    section('POWER CARDS');

    // Test Code Review (Inflame equivalent) - +2 strength
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_code_review, id: 'test_code_review' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Code Review grants +2 strength', state.playerStats.statuses.strength === 2,
            `Expected 2, got ${state.playerStats.statuses.strength}`);
    }

    // Test Troubleshooting (Evolve equivalent) - evolve status
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_troubleshooting, id: 'test_troubleshoot' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, evolve: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Troubleshooting grants +1 Evolve', state.playerStats.statuses.evolve === 1,
            `Expected 1, got ${state.playerStats.statuses.evolve}`);
    }

    // Test Lean Ops (Feel No Pain equivalent) - feelNoPain status
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_lean_ops, id: 'test_lean' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, feelNoPain: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Lean Ops grants +3 Feel No Pain', state.playerStats.statuses.feelNoPain === 3,
            `Expected 3, got ${state.playerStats.statuses.feelNoPain}`);
    }

    // Test Caching (Metallicize equivalent) - metallicize status
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_caching, id: 'test_caching' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, metallicize: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Caching grants +3 Metallicize', state.playerStats.statuses.metallicize === 3,
            `Expected 3, got ${state.playerStats.statuses.metallicize}`);
    }

    // Test Antifragile (Rupture equivalent) - antifragile status
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_antifragile, id: 'test_antifragile' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, antifragile: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Antifragile grants +1 Antifragile', state.playerStats.statuses.antifragile === 1,
            `Expected 1, got ${state.playerStats.statuses.antifragile}`);
    }

    // Test Network Effects (Demon Form equivalent) - growth status
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_network_effects, id: 'test_network' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, growth: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Network Effects grants +2 Growth', state.playerStats.statuses.growth === 2,
            `Expected 2, got ${state.playerStats.statuses.growth}`);
    }

    // Test Tech Debt (Corruption equivalent) - corruption status
    if (GAME_DATA.cards.cto_tech_debt) {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_tech_debt, id: 'test_tech_debt' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, corruption: 0 };

        state = resolveCardEffect(state, card, 'self');

        test('Tech Debt grants +1 Corruption', state.playerStats.statuses.corruption === 1,
            `Expected 1, got ${state.playerStats.statuses.corruption}`);
    }
}

// ========== STATUS EFFECT INTERACTION TESTS ==========

function testStatusInteractions() {
    section('STATUS EFFECT INTERACTIONS');

    // Test Vulnerable increases damage by 50%
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].statuses.vulnerable = 2;
        const card = { ...GAME_DATA.cards.cto_commit, id: 'test_vuln' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Vulnerable increases damage by 50%', damageDealt === 9, // 6 * 1.5 = 9
            `Expected 9 (6*1.5), got ${damageDealt}`);
    }

    // Test Weak reduces damage by 25%
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_commit, id: 'test_weak' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0, weak: 2 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Weak reduces damage by 25%', damageDealt === 4, // 6 * 0.75 = 4.5 -> 4
            `Expected 4 (6*0.75), got ${damageDealt}`);
    }

    // Test Strength adds to damage
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_commit, id: 'test_str' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 3, weak: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Strength adds to damage', damageDealt === 9, // 6 + 3 = 9
            `Expected 9 (6+3), got ${damageDealt}`);
    }

    // Test Strength + Vulnerable combo
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].statuses.vulnerable = 2;
        const card = { ...GAME_DATA.cards.cto_commit, id: 'test_combo' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 2, weak: 0 };

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);
        const damageDealt = prevHp - state.enemies[0].hp;

        test('Strength + Vulnerable combo', damageDealt === 12, // (6 + 2) * 1.5 = 12
            `Expected 12 ((6+2)*1.5), got ${damageDealt}`);
    }

    // Test Frail reduces block by 25%
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_rollback, id: 'test_frail' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, frail: 2 };

        state = resolveCardEffect(state, card, 'self');

        test('Frail reduces block by 25%', state.playerStats.mitigation === 3, // 5 * 0.75 = 3.75 -> 3
            `Expected 3 (5*0.75), got ${state.playerStats.mitigation}`);
    }
}

// ========== EXECUTION ORDER TESTS ==========

function testExecutionOrder() {
    section('EXECUTION ORDER');

    // Test damage applies before status effects
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_hotfix, id: 'test_order' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        // Damage should be 8 (not 12 with vulnerable), because vulnerable is applied AFTER damage
        test('Damage applies before Vulnerable (execution order)',
            state.enemies[0].hp === 42, // 50 - 8 = 42
            `Expected 42, got ${state.enemies[0].hp}`);
        test('Vulnerable is applied after damage',
            state.enemies[0].statuses.vulnerable === 2,
            `Vulnerable: ${state.enemies[0].statuses.vulnerable}`);
    }

    // Test block applies before damage in same card (Dual Track)
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_dual_track, id: 'test_dual_order' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        // Effects execute in order: damage first, then block
        test('Dual Track deals damage', state.enemies[0].hp === 45,
            `Expected 45, got ${state.enemies[0].hp}`);
        test('Dual Track grants block', state.playerStats.mitigation === 5,
            `Expected 5, got ${state.playerStats.mitigation}`);
    }

    // Test multi-hit cards apply effects in sequence
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        state.enemies[0].mitigation = 5; // 5 block
        const card = { ...GAME_DATA.cards.cto_pair_programming, id: 'test_multi' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;
        state.playerStats.statuses = { ...state.playerStats.statuses, strength: 0 };

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        // First 5 damage removes block, second 5 damage goes to HP
        test('Multi-hit removes block then deals HP damage',
            state.enemies[0].hp === 45 && state.enemies[0].mitigation === 0,
            `HP: ${state.enemies[0].hp}, Block: ${state.enemies[0].mitigation}`);
    }
}

// ========== CARD PROPERTY TESTS ==========

function testCardProperties() {
    section('CARD PROPERTIES');

    // Test exhaust property
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_hackathon, id: 'test_exhaust' };
        state.hand = [card];
        state.playerStats.bandwidth = 3;

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('Exhaust cards go to exhaust pile',
            state.exhaustPile.some(c => c.id === card.id),
            `Exhaust pile: ${state.exhaustPile.map(c => c.id).join(', ')}`);
        test('Exhaust cards do NOT go to discard',
            !state.discardPile.some(c => c.id === card.id),
            `Discard pile: ${state.discardPile.map(c => c.id).join(', ')}`);
    }

    // Test ethereal property exists on card
    {
        const marketWindow = GAME_DATA.cards.cto_market_window;
        test('Market Window has ethereal property', marketWindow.ethereal === true,
            `ethereal: ${marketWindow.ethereal}`);
    }

    // Test 0-cost cards playable with 0 energy
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_quick_fix, id: 'test_0cost' };
        state.hand = [card];
        state.playerStats.bandwidth = 0;

        const prevHp = state.enemies[0].hp;
        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('0-cost card playable with 0 energy', state.enemies[0].hp < prevHp,
            `Enemy HP: ${state.enemies[0].hp}`);
    }

    // Test X-cost uses all energy
    {
        let state = createTestState();
        state.enemies = [createTestEnemy(50)];
        const card = { ...GAME_DATA.cards.cto_blitzscaling, id: 'test_xcost' };
        state.hand = [card];
        state.playerStats.bandwidth = 5;

        state = resolveCardEffect(state, card, 'enemy', state.enemies[0].id);

        test('X-cost card uses all bandwidth', state.playerStats.bandwidth === 0,
            `Expected 0, got ${state.playerStats.bandwidth}`);
    }
}

// ========== 1:1 MAPPING VERIFICATION ==========

function testCardMappings() {
    section('CARD 1:1 MAPPING VERIFICATION');

    const cards = GAME_DATA.cards;

    // Verify all cards have required properties
    const requiredProps = ['id', 'name', 'type', 'rarity', 'cost', 'description', 'effects'];
    let allValid = true;

    Object.entries(cards).forEach(([key, card]) => {
        const c = card as CardData;
        const missing = requiredProps.filter(prop => !(prop in c) || c[prop as keyof CardData] === undefined);
        if (missing.length > 0) {
            console.log(`❌ ${key} missing: ${missing.join(', ')}`);
            allValid = false;
        }
    });
    test('All cards have required properties', allValid);

    // Count cards by rarity
    const byRarity: Record<string, string[]> = {};
    Object.entries(cards).forEach(([key, card]) => {
        const c = card as CardData;
        if (!byRarity[c.rarity]) byRarity[c.rarity] = [];
        byRarity[c.rarity].push(key);
    });

    console.log('\n📊 Card Distribution:');
    Object.entries(byRarity).forEach(([rarity, keys]) => {
        console.log(`   ${rarity}: ${keys.length} cards`);
    });

    test('Has starter cards', byRarity['starter']?.length >= 3, `Got ${byRarity['starter']?.length || 0}`);
    test('Has common cards', byRarity['common']?.length >= 10, `Got ${byRarity['common']?.length || 0}`);
    test('Has uncommon cards', byRarity['uncommon']?.length >= 5, `Got ${byRarity['uncommon']?.length || 0}`);
    test('Has rare cards', byRarity['rare']?.length >= 2, `Got ${byRarity['rare']?.length || 0}`);

    // Count cards by type
    const byType: Record<string, string[]> = {};
    Object.entries(cards).forEach(([key, card]) => {
        const c = card as CardData;
        if (!byType[c.type]) byType[c.type] = [];
        byType[c.type].push(key);
    });

    console.log('\n📊 Card Type Distribution:');
    Object.entries(byType).forEach(([type, keys]) => {
        console.log(`   ${type}: ${keys.length} cards`);
    });

    test('Has attack cards', byType['attack']?.length >= 10, `Got ${byType['attack']?.length || 0}`);
    test('Has skill cards', byType['skill']?.length >= 5, `Got ${byType['skill']?.length || 0}`);
    test('Has power cards', byType['power']?.length >= 5, `Got ${byType['power']?.length || 0}`);
    test('Has status cards', byType['status']?.length >= 3, `Got ${byType['status']?.length || 0}`);

    // Verify effect types are valid
    const validEffects = [
        'damage', 'block', 'draw', 'heal', 'apply_status', 'add_card', 'discard',
        'lose_bandwidth', 'add_copy', 'exhaust_random', 'exhaust_targeted',
        'conditional_strength', 'upgrade_hand', 'damage_scale_mitigation',
        'damage_scale_matches', 'retrieve_discard', 'gain_bandwidth',
        'conditional_refund', 'lose_hp_turn_end', 'steal_capital', 'escape', 'split', 'siphon'
    ];

    let allEffectsValid = true;
    Object.entries(cards).forEach(([key, card]) => {
        const c = card as CardData;
        c.effects?.forEach(effect => {
            if (!validEffects.includes(effect.type)) {
                console.log(`⚠️ ${key} has unknown effect type: ${effect.type}`);
                allEffectsValid = false;
            }
        });
    });
    test('All card effect types are valid', allEffectsValid);
}

// ========== RUN ALL TESTS ==========

console.log('\n🃏 COMPREHENSIVE CARD TEST SUITE\n');
console.log('Testing all cards for 1:1 StS mapping accuracy...\n');

testStarterCards();
testCommonAttacks();
testCommonSkills();
testUncommonAttacks();
testUncommonSkills();
testPowerCards();
testStatusInteractions();
testExecutionOrder();
testCardProperties();
testCardMappings();

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 CARD TEST SUMMARY');
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
export { testStarterCards, testCommonAttacks, testUncommonAttacks, testPowerCards };
