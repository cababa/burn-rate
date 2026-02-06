import fs from 'node:fs';
import { resolveCardEffect, resolveEnemyTurn } from './gameLogic.ts';
import { GAME_DATA } from './constants.ts';
import { isEffectTypeSupported } from './engine/cardToActions.ts';
import type { CardData, EnemyData, GameState, RelicData } from './types.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    console.log(`PASS ${name}`);
    passed++;
    return;
  }
  console.error(`FAIL ${name}${details ? ` - ${details}` : ''}`);
  failed++;
}

function makeEnemy(id: string, hp: number): EnemyData {
  return {
    ...GAME_DATA.enemies.fanboy,
    id,
    hp,
    maxHp: hp,
    mitigation: 0,
    statuses: { ...GAME_DATA.enemies.fanboy.statuses },
    currentIntent: { type: 'attack', value: 5, icon: 'attack', description: 'Attack' },
  };
}

function makeState(): GameState {
  return {
    playerStats: {
      ...GAME_DATA.character.stats,
      hp: 80,
      maxHp: 80,
      bandwidth: 3,
      mitigation: 0,
      statuses: { ...GAME_DATA.character.stats.statuses },
    },
    enemies: [makeEnemy('e1', 40)],
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
    potions: [null, null, null],
    potionSlotCount: 3,
    potionDropChance: 40,
    duplicateNextCard: false,
    seed: 'TEST',
  };
}

function run() {
  console.log('Running mechanics regression tests...');

  // 1) No Draw blocks draw effects.
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_pivot_ready, id: 'no_draw_test' };
    state.hand = [card];
    state.drawPile = [{ ...GAME_DATA.cards.cto_commit, id: 'd1' }];
    state.playerStats.statuses.noDraw = 1;

    const out = resolveCardEffect(state, card, 'self');
    assert(out.hand.length === 0, 'No Draw blocks card draw', `hand=${out.hand.length}`);
    assert(out.discardPile.length === 1, 'Played card still discarded with No Draw', `discard=${out.discardPile.length}`);
  }

  // 2) Draw with near-full hand burns overflow (StS behavior).
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_flow_state, id: 'burn_test' };
    state.hand = Array.from({ length: 9 }, (_, i) => ({ ...GAME_DATA.cards.cto_commit, id: `h_${i}` }));
    state.hand.push(card);
    state.drawPile = [
      { ...GAME_DATA.cards.cto_commit, id: 'd1' },
      { ...GAME_DATA.cards.cto_commit, id: 'd2' },
      { ...GAME_DATA.cards.cto_commit, id: 'd3' },
    ];

    const out = resolveCardEffect(state, card, 'self');
    assert(out.hand.length === 10, 'Flow State fills to hand limit', `hand=${out.hand.length}`);
    assert(out.discardPile.length === 3, 'Flow State burns overflow + played card', `discard=${out.discardPile.length}`);
  }

  // 3) Juggernaut deals damage on block gain in new engine path.
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_stay_focused, id: 'jug_test' };
    state.hand = [card];
    state.playerStats.statuses.juggernaut = 5;
    const hpBefore = state.enemies[0].hp;

    const out = resolveCardEffect(state, card, 'self');
    assert(out.enemies[0].hp === hpBefore - 5, 'Juggernaut triggers on block gain', `hpBefore=${hpBefore} hpAfter=${out.enemies[0].hp}`);
  }

  // 4) Pressure Cooker applies Weak when applying Vulnerable.
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_hotfix, id: 'pressure_test' };
    state.hand = [card];
    state.relics = [{ ...GAME_DATA.relics.pressure_cooker } as RelicData];

    const out = resolveCardEffect(state, card, 'enemy', 'e1');
    assert(out.enemies[0].statuses.vulnerable >= 2, 'Hotfix applies Vulnerable');
    assert(out.enemies[0].statuses.weak >= 1, 'Pressure Cooker applies Weak');
  }

  // 5) Opening Move first-attack damage bonus is applied.
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_commit, id: 'opening_test' };
    state.hand = [card];
    state.relics = [{ ...GAME_DATA.relics.opening_move } as RelicData];

    const out = resolveCardEffect(state, card, 'enemy', 'e1');
    assert(out.enemies[0].hp === 26, 'Opening Move adds +8 damage to first attack', `hp=${out.enemies[0].hp}`);
  }

  // 6) On enemy death relic (Force Multiplier) grants energy + draw.
  {
    const state = makeState();
    const card = { ...GAME_DATA.cards.cto_commit, id: 'death_relic_test' };
    state.hand = [card];
    state.enemies = [makeEnemy('e1', 6), makeEnemy('e2', 30)];
    state.relics = [{ ...GAME_DATA.relics.force_multiplier } as RelicData];
    state.drawPile = [{ ...GAME_DATA.cards.cto_commit, id: 'drawn_from_death' }];

    const out = resolveCardEffect(state, card, 'enemy', 'e1');
    assert(out.playerStats.bandwidth === 3, 'Force Multiplier refunds spent energy on kill', `bandwidth=${out.playerStats.bandwidth}`);
    assert(out.hand.length === 1, 'Force Multiplier draws on kill', `hand=${out.hand.length}`);
  }

  // 7) Data-Driven no longer loses cards during enemy turn draw trigger.
  {
    const state = makeState();
    state.playerStats.hp = 40;
    state.relics = [{ ...GAME_DATA.relics.data_driven } as RelicData];
    state.enemies = [makeEnemy('e1', 20)];
    state.enemies[0].currentIntent = { type: 'attack', value: 1, icon: 'attack', description: 'Attack' };
    state.drawPile = [
      { ...GAME_DATA.cards.cto_commit, id: 'a' },
      { ...GAME_DATA.cards.cto_commit, id: 'b' },
      { ...GAME_DATA.cards.cto_commit, id: 'c' },
      { ...GAME_DATA.cards.cto_commit, id: 'd' },
      { ...GAME_DATA.cards.cto_commit, id: 'e' },
      { ...GAME_DATA.cards.cto_commit, id: 'f' },
    ];
    state.discardPile = [
      { ...GAME_DATA.cards.cto_commit, id: 'g' },
      { ...GAME_DATA.cards.cto_commit, id: 'h' },
    ];
    const before = state.hand.length + state.drawPile.length + state.discardPile.length + state.exhaustPile.length;

    const out = resolveEnemyTurn(state);
    const after = out.hand.length + out.drawPile.length + out.discardPile.length + out.exhaustPile.length;
    assert(after === before, 'Data-Driven preserves card count', `before=${before} after=${after}`);
  }

  // 8) Thick Skin reflects damage to attacker.
  {
    const state = makeState();
    state.relics = [{ ...GAME_DATA.relics.thick_skin } as RelicData];
    state.enemies = [makeEnemy('e1', 20)];
    state.enemies[0].currentIntent = { type: 'attack', value: 5, icon: 'attack', description: 'Attack' };

    const out = resolveEnemyTurn(state);
    assert(out.enemies[0].hp === 17, 'Thick Skin reflects 3 damage', `enemyHp=${out.enemies[0].hp}`);
  }

  // 9) Tooling+ forced to legacy path (upgrade-all still unsupported in new engine).
  {
    const effect = { type: 'upgrade_hand', value: 99, target: 'self' } as CardData['effects'][number];
    assert(!isEffectTypeSupported(effect), 'Tooling+ upgrade-all routes to legacy resolver');
  }

  // 10) UI end-turn button bound to canonical resolver entrypoint.
  {
    const appCode = fs.readFileSync('./App.tsx', 'utf-8');
    assert(appCode.includes('onClick={endTurn}'), 'End Turn button uses endTurn handler');
  }

  console.log(`Done: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
