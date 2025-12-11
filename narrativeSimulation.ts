// ============================================
// NARRATIVE SIMULATION
// ============================================
// Runs a full 16-floor simulation with real Gemini API calls
// to validate narrative coherence and story flow.
//
// Run with: npx ts-node narrativeSimulation.ts

import {
    generateMacroNarrative,
    generateMesoNarrative,
    clearNarrativeCache,
    createFallbackMacro,
    setVerboseLogging,
    getEnemyIntentTweet,
    getCardPlayTweet,
    getEnemyDefeatTweetProgressive
} from './progressiveNarrativeService.ts';
import type { StartupContext } from './narrativeTypes.ts';
import type { MacroNarrative, MesoNarrative, FloorBeat, PlayerRole } from './progressiveNarrativeTypes.ts';
import * as fs from 'fs';

// ============================================
// CONFIGURATION
// ============================================

const API_KEY = 'AIzaSyB9UoRCHipxerCRt4W4NvuUenT-3jGlt0M';

// Test startup context
const STARTUP_CONTEXT: StartupContext = {
    name: 'GiggleLearn',
    oneLiner: 'Netflix for educational kids content - learning that feels like play'
};

// Player role for the simulation
const PLAYER_ROLE: PlayerRole = 'cto';

// Sample enemies by floor type
const FLOOR_ENEMIES: Record<string, { id: string; name: string; type: string }[]> = {
    // Common encounters (floors 1-7)
    common_1: [{ id: 'minor_bug', name: 'The Naysayer', type: 'common' }],
    common_2: [{ id: 'critical_bug', name: 'The Doubter', type: 'common' }, { id: 'minor_bug', name: 'The Naysayer', type: 'common' }],
    common_3: [{ id: 'spaghetti_code', name: 'The Copycat', type: 'common' }],
    common_4: [{ id: 'fanboy', name: 'Feature Creep', type: 'common' }, { id: 'quick_hack', name: 'The Shortcut', type: 'common' }],
    common_5: [{ id: 'tech_debt', name: 'The Procrastinator', type: 'common' }],
    common_6: [{ id: 'micromanager', name: 'The Micromanager', type: 'common' }, { id: 'memory_leak', name: 'Energy Vampire', type: 'common' }],
    common_7: [{ id: 'legacy_module', name: 'The Old Guard', type: 'common' }],

    // Elite encounters (floors 8-10)
    elite_8: [{ id: 'scope_creep', name: 'Scope Creep', type: 'elite' }],
    elite_9: [{ id: 'burnout', name: 'Burnout', type: 'elite' }],
    elite_10: [{ id: 'over_engineer', name: 'Over-Engineer', type: 'elite' }],

    // More common encounters (floors 11-14)
    common_11: [{ id: 'pivot_master', name: 'Pivot Master', type: 'elite' }],
    common_12: [{ id: 'headhunter', name: 'The Poacher', type: 'common' }, { id: 'bad_merge', name: 'The Gossip', type: 'common' }],
    common_13: [{ id: 'merge_conflict', name: 'The Politician', type: 'common' }],
    common_14: [{ id: 'hotfix', name: 'The Gambler', type: 'common' }, { id: 'feature_pusher', name: 'The Yes-Man', type: 'common' }],

    // Boss (floor 16)
    boss_15: [{ id: 'boss_burn_rate', name: 'Burn Rate', type: 'boss' }],
    boss_16: [{ id: 'investor_meeting', name: 'The VC Gauntlet', type: 'boss' }]
};

// Sample deck cards (used for MESO context)
const SAMPLE_DECK = [
    { name: 'Commit', type: 'attack', description: 'Deal 6 damage' },
    { name: 'Deploy', type: 'attack', description: 'Deal 8 damage' },
    { name: 'Refactor', type: 'skill', description: 'Gain 5 block' },
    { name: 'Rollback', type: 'skill', description: 'Gain 8 block' },
    { name: 'Network Effects', type: 'power', description: 'Gain 1 Velocity' },
    { name: 'Git Blame', type: 'attack', description: 'Deal 10 damage, apply Exposed' }
];

// ============================================
// SIMULATION
// ============================================

interface SimulationOutput {
    startup: StartupContext;
    macro: MacroNarrative;
    floors: FloorSimulation[];
    summary: {
        totalTweets: number;
        totalFloors: number;
        storyPhases: string[];
    };
}

interface FloorSimulation {
    floor: number;
    floorBeat: FloorBeat;
    enemies: { id: string; name: string }[];
    meso: {
        approachTweet: string;
        victoryTweet: string;
        enemyTweets: Record<string, {
            attack: string[];
            buff: string[];
            debuff: string[];
            defeat: string;
        }>;
        cardPlayTweets: {
            attack: string[];
            skill: string[];
            power: string[];
        };
    };
}

// Setup localStorage mock for Node.js environment
function setupNodeEnvironment() {
    const store = new Map<string, string>();
    (globalThis as any).window = {
        localStorage: {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => { store.set(key, value); },
            removeItem: (key: string) => { store.delete(key); },
            clear: () => { store.clear(); }
        }
    };
    (globalThis as any).localStorage = (globalThis as any).window.localStorage;

    // Set API key
    (globalThis as any).localStorage.setItem('gemini_api_key', API_KEY);
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getEnemiesForFloor(floor: number): { id: string; name: string; type: string }[] {
    if (floor <= 7) {
        return FLOOR_ENEMIES[`common_${floor}`] || FLOOR_ENEMIES['common_1'];
    } else if (floor <= 10) {
        return FLOOR_ENEMIES[`elite_${floor}`] || FLOOR_ENEMIES['elite_8'];
    } else if (floor <= 14) {
        return FLOOR_ENEMIES[`common_${floor}`] || FLOOR_ENEMIES['common_11'];
    } else {
        return FLOOR_ENEMIES[`boss_${floor}`] || FLOOR_ENEMIES['boss_16'];
    }
}

async function runSimulation(): Promise<SimulationOutput> {
    console.log('\n' + '🚀'.repeat(40));
    console.log('\n   NARRATIVE SIMULATION - Full 16-Floor Run');
    console.log(`   Startup: ${STARTUP_CONTEXT.name}`);
    console.log(`   One-liner: ${STARTUP_CONTEXT.oneLiner}`);
    console.log('\n' + '🚀'.repeat(40) + '\n');

    // Enable verbose logging for full visibility
    setVerboseLogging(true);
    clearNarrativeCache();

    // Phase 1: Generate MACRO
    console.log('\n' + '='.repeat(80));
    console.log('📚 PHASE 1: GENERATING MACRO NARRATIVE');
    console.log('='.repeat(80) + '\n');

    const macro = await generateMacroNarrative(STARTUP_CONTEXT, PLAYER_ROLE);

    console.log('\n📊 MACRO GENERATED:');
    console.log(`   Theme: "${macro.theme}"`);
    console.log(`   Handle: ${macro.startupHandle}`);
    console.log(`   Emoji: ${macro.startupEmoji}`);
    console.log(`   Tone: ${macro.startupTone}`);
    console.log(`   Intro Tweet: "${macro.introTweet.content}"`);
    console.log(`   Boss Victory: "${macro.bossVictoryTweet.content}"`);

    console.log('\n📖 FLOOR BEATS (Story Arc):');
    macro.floorBeats.forEach(beat => {
        console.log(`   Floor ${beat.floor} [${beat.storyPhase.toUpperCase()}]: "${beat.storyBeat}"`);
    });

    // Phase 2: Generate MESO for each floor
    const floors: FloorSimulation[] = [];

    for (let floor = 1; floor <= 16; floor++) {
        console.log('\n' + '='.repeat(80));
        console.log(`🎬 FLOOR ${floor}/16 - MESO GENERATION`);
        console.log('='.repeat(80));

        const enemies = getEnemiesForFloor(floor);
        const floorBeat = macro.floorBeats[floor - 1];
        console.log(`   Story Phase: ${floorBeat.storyPhase}`);
        console.log(`   Story Beat: "${floorBeat.storyBeat}"`);
        console.log(`   Enemies: ${enemies.map(e => e.name).join(', ')}`);

        // Generate MESO with rate limit delay
        if (floor > 1) {
            console.log('   ⏳ Rate limit delay (2s)...');
            await delay(2000);
        }

        const nodeId = `floor_${floor}_node`;
        const nextNodes = floor < 16
            ? [{ id: `floor_${floor + 1}_a`, type: 'problem' }, { id: `floor_${floor + 1}_b`, type: 'problem' }]
            : [];

        const meso = await generateMesoNarrative(
            STARTUP_CONTEXT,
            macro,
            nodeId,
            floor,
            floor === 16 ? 'boss' : floor >= 8 && floor <= 10 ? 'elite' : 'problem',
            enemies,
            nextNodes,
            SAMPLE_DECK,
            PLAYER_ROLE
        );

        // Extract tweets for summary
        const enemyTweets: Record<string, { attack: string[]; buff: string[]; debuff: string[]; defeat: string }> = {};

        for (const enemy of enemies) {
            const attacks: string[] = [];
            const buffs: string[] = [];
            const debuffs: string[] = [];

            // Get sample tweets from each pool
            for (let i = 0; i < 3; i++) {
                const attack = getEnemyIntentTweet(meso, enemy.id, 'attack');
                if (attack) attacks.push(attack.content);

                const buff = getEnemyIntentTweet(meso, enemy.id, 'buff');
                if (buff) buffs.push(buff.content);

                const debuff = getEnemyIntentTweet(meso, enemy.id, 'debuff');
                if (debuff) debuffs.push(debuff.content);
            }

            const defeat = getEnemyDefeatTweetProgressive(meso, enemy.id);

            enemyTweets[enemy.id] = {
                attack: [...new Set(attacks)],
                buff: [...new Set(buffs)],
                debuff: [...new Set(debuffs)],
                defeat: defeat?.content || ''
            };
        }

        // Get card play tweets
        const cardAttacks: string[] = [];
        const cardSkills: string[] = [];
        const cardPowers: string[] = [];

        for (let i = 0; i < 3; i++) {
            const a = getCardPlayTweet(meso, 'attack');
            const s = getCardPlayTweet(meso, 'skill');
            const p = getCardPlayTweet(meso, 'power');
            if (a) cardAttacks.push(a.content);
            if (s) cardSkills.push(s.content);
            if (p) cardPowers.push(p.content);
        }

        floors.push({
            floor,
            floorBeat,
            enemies: enemies.map(e => ({ id: e.id, name: e.name })),
            meso: {
                approachTweet: meso.approachTweet.content,
                victoryTweet: meso.victoryTweet.content,
                enemyTweets,
                cardPlayTweets: {
                    attack: [...new Set(cardAttacks)],
                    skill: [...new Set(cardSkills)],
                    power: [...new Set(cardPowers)]
                }
            }
        });

        // Print floor summary
        console.log('\n   📝 FLOOR TWEETS GENERATED:');
        console.log(`      Approach: "${meso.approachTweet.content}"`);
        console.log(`      Victory: "${meso.victoryTweet.content}"`);

        for (const enemy of enemies) {
            console.log(`      ${enemy.name} attacks: ${enemyTweets[enemy.id]?.attack.length || 0} tweets`);
        }
    }

    // Summary
    const output: SimulationOutput = {
        startup: STARTUP_CONTEXT,
        macro,
        floors,
        summary: {
            totalTweets: floors.reduce((sum, f) => {
                let count = 2; // approach + victory
                Object.values(f.meso.enemyTweets).forEach(e => {
                    count += e.attack.length + e.buff.length + e.debuff.length + 1;
                });
                count += f.meso.cardPlayTweets.attack.length + f.meso.cardPlayTweets.skill.length + f.meso.cardPlayTweets.power.length;
                return sum + count;
            }, 3), // +3 for intro, defeat, boss victory
            totalFloors: 16,
            storyPhases: [...new Set(floors.map(f => f.floorBeat.storyPhase))]
        }
    };

    return output;
}

// ============================================
// NARRATIVE ANALYSIS
// ============================================

function printNarrativeAnalysis(output: SimulationOutput): void {
    console.log('\n' + '🎭'.repeat(40));
    console.log('\n   NARRATIVE ANALYSIS');
    console.log('\n' + '🎭'.repeat(40));

    console.log('\n📖 COMPLETE STORY ARC:\n');

    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 🌅 THE BEGINNING                                                            │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log(`"${output.macro.introTweet.content}"\n`);

    for (const floor of output.floors) {
        const phase = floor.floorBeat.storyPhase;
        const phaseEmoji = {
            hope: '🌟',
            grind: '⚙️',
            doubt: '😰',
            breakthrough: '🚀',
            climax: '🏆'
        }[phase] || '📍';

        console.log(`┌─── Floor ${floor.floor.toString().padStart(2, ' ')} [${phase.toUpperCase().padEnd(12, ' ')}] ${phaseEmoji} ───────────────────────────────────────`);
        console.log(`│ Beat: "${floor.floorBeat.storyBeat}"`);
        console.log(`│ Setup: "${floor.floorBeat.setup}"`);
        console.log(`│ Conflict: "${floor.floorBeat.conflict}"`);
        console.log(`│`);
        console.log(`│ 📢 Approach: "${floor.meso.approachTweet}"`);
        console.log(`│`);

        for (const [enemyId, tweets] of Object.entries(floor.meso.enemyTweets)) {
            const enemy = floor.enemies.find(e => e.id === enemyId);
            console.log(`│ 😈 ${enemy?.name || enemyId}:`);
            if (tweets.attack.length > 0) {
                console.log(`│    Attack: "${tweets.attack[0]}"`);
            }
            if (tweets.defeat) {
                console.log(`│    Defeated: "${tweets.defeat}"`);
            }
        }

        console.log(`│`);
        console.log(`│ 🎉 Victory: "${floor.meso.victoryTweet}"`);
        console.log(`└${'─'.repeat(76)}`);
        console.log('');
    }

    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ 🎊 THE FINALE                                                               │');
    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    console.log(`"${output.macro.bossVictoryTweet.content}"\n`);

    console.log('\n📊 SUMMARY:');
    console.log(`   Total tweets generated: ${output.summary.totalTweets}`);
    console.log(`   Story phases covered: ${output.summary.storyPhases.join(' → ')}`);
    console.log(`   Floors simulated: ${output.summary.totalFloors}`);
}

// ============================================
// MAIN
// ============================================

async function main(): Promise<void> {
    try {
        setupNodeEnvironment();

        console.log('🎮 Starting Narrative Simulation...\n');

        const output = await runSimulation();

        // Save full output to JSON
        const outputPath = './simulation_output.json';
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`\n💾 Full output saved to: ${outputPath}`);

        // Print narrative analysis
        printNarrativeAnalysis(output);

        console.log('\n✅ Simulation complete!');
        console.log('   Review the story arc above to check if it "feels real"');
        console.log('   and could have happened to a real startup.\n');

    } catch (error) {
        console.error('\n❌ Simulation failed:', error);
        process.exit(1);
    }
}

main();
