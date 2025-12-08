import { GameState, CardData, EnemyData } from './types.ts';
import { GAME_DATA, MAX_HAND_SIZE } from './constants.ts';
import {
    drawCards,
    resolveCardEffect,
    resolveEnemyTurn,
    resolveEndTurn,
    shuffle
} from './gameLogic.ts';

const createMockState = (): GameState => ({
    playerStats: { ...GAME_DATA.character.stats, hp: 50, maxHp: 50, bandwidth: 3, mitigation: 0, statuses: { ...GAME_DATA.character.stats.statuses } },
    enemies: [],
    hand: [],
    drawPile: [],
    deck: [],
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
    // Potion system
    potions: [null, null, null],
    potionSlotCount: 3,
    potionDropChance: 40,
    duplicateNextCard: false,
        seed: 'TEST'
});

const runTests = () => {
    console.log("Running Edge Case Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, name: string) => {
        if (condition) {
            console.log(`✅ ${name}`);
            passed++;
        } else {
            console.error(`❌ ${name}`);
            failed++;
        }
    };

    // Test 1: Reshuffle (Draw empty, Discard has cards)
    {
        const state = createMockState();
        state.drawPile = [];
        state.discardPile = [{ ...GAME_DATA.cards.cto_commit, id: 'c1' }, { ...GAME_DATA.cards.cto_commit, id: 'c2' }];
        const { drawn, newDraw, newDiscard } = drawCards(state.drawPile, state.discardPile, 1);
        assert(drawn.length === 1 && newDraw.length === 1 && newDiscard.length === 0, "Reshuffle Logic");
    }

    // Test 2: Exhaustion (Deck runs out)
    {
        const state = createMockState();
        state.drawPile = [];
        state.discardPile = [];
        const { drawn } = drawCards(state.drawPile, state.discardPile, 1);
        assert(drawn.length === 0, "Draw from Empty Deck");
    }

    // Test 3: Thorns Kill (Simultaneous Death)
    {
        let state = createMockState();
        state.playerStats.hp = 1;
        state.playerStats.statuses.thorns = 5;
        state.enemies = [{ ...GAME_DATA.enemies.fanboy, id: 'e1', hp: 1, maxHp: 10, currentIntent: { type: 'attack', value: 5, icon: 'attack', description: 'Attack' }, statuses: { ...GAME_DATA.enemies.fanboy.statuses } }];

        state = resolveEnemyTurn(state);
        assert(state.status === 'GAME_OVER', "Simultaneous Death (Player Dies)");
        assert(state.enemies[0].hp <= 0, "Enemy Died to Thorns");
    }

    // Test 4: X-Cost with 0 Bandwidth
    {
        let state = createMockState();
        state.playerStats.bandwidth = 0;
        const mockXCard: CardData = { ...GAME_DATA.cards.cto_commit, id: 'x_mock', cost: -1, effects: [{ type: 'damage', value: 5, target: 'enemy' }] };
        state.enemies = [{ ...GAME_DATA.enemies.fanboy, id: 'e1', hp: 50, maxHp: 50, statuses: { ...GAME_DATA.enemies.fanboy.statuses }, currentIntent: { type: 'unknown', value: 0, icon: '', description: '' } }];

        state = resolveCardEffect(state, mockXCard, 'enemy');
        assert(state.enemies[0].hp === 50, "X-Cost 0 Energy deals 0 damage");
        assert(state.message.includes("Deployed"), "Card played successfully");
    }

    // Test 5: Hand Limit (Implemented)
    {
        let state = createMockState();
        state.hand = Array(MAX_HAND_SIZE).fill(GAME_DATA.cards.cto_commit);
        state.drawPile = Array(5).fill(GAME_DATA.cards.cto_commit); // 5 cards to draw
        state.enemies = [{ ...GAME_DATA.enemies.fanboy, id: 'e1', hp: 50, maxHp: 50, statuses: { ...GAME_DATA.enemies.fanboy.statuses }, currentIntent: { type: 'buff', value: 0, icon: '', description: '' } }];

        // Simulate Start of Turn Draw (via resolveEnemyTurn)
        state.status = 'ENEMY_TURN'; // Will transition to PLAYING and draw
        // Hand is full (10).
        // Should draw 5, burn all 5.
        // Hand should remain 10.
        // Discard should increase by 5.

        state = resolveEnemyTurn(state);

        assert(state.hand.length === MAX_HAND_SIZE, "Hand Limit Respected (Start Turn)");
        assert(state.discardPile.length === 5, "Burned Cards went to Discard");
        assert(state.message.includes("Hand full! Burned"), "Burn Message Shown");
    }

    // Test 6: Hand Limit (Card Effect)
    {
        let state = createMockState();
        state.hand = Array(MAX_HAND_SIZE - 1).fill(GAME_DATA.cards.cto_commit); // 9 cards
        // Play a card that draws 2.
        // Hand becomes 8 (played card removed).
        // Draw 2 -> Hand becomes 10.
        // Should fit.

        const drawCard: CardData = { ...GAME_DATA.cards.cto_commit, id: 'draw_2', cost: 0, effects: [{ type: 'draw', value: 2 }] };
        state.drawPile = [{ ...GAME_DATA.cards.cto_commit, id: 'd1' }, { ...GAME_DATA.cards.cto_commit, id: 'd2' }, { ...GAME_DATA.cards.cto_commit, id: 'd3' }];

        // We need to add drawCard to hand first? No, resolveCardEffect takes card as arg.
        // But it assumes card is in hand (filters it out).
        state.hand.push(drawCard); // Hand is 10 now.

        state = resolveCardEffect(state, drawCard, 'self');

        // Hand was 10. Played card removed -> 9.
        // Draw 2.
        // 9 + 1 = 10 (Fits).
        // 10 + 1 = 11 (Burned).
        // Result: Hand 10. Discard has played card + 1 burned.

        assert(state.hand.length === MAX_HAND_SIZE, "Hand Limit Respected (Card Effect)");
        assert(state.discardPile.length === 2, "Played card + Burned card in discard");
        assert(state.message.includes("Hand full! Burned"), "Burn Message Shown");
    }

    console.log(`Tests Complete: ${passed} Passed, ${failed} Failed.`);
};

runTests();
