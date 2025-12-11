// ============================================
// PROGRESSIVE NARRATIVE SERVICE
// ============================================
// Three-layer progressive generation:
// - MACRO: Generated once at new game (~3-5s)
// - MESO: Generated per node before combat (~5s)
// - MICRO: Card reactions (included in MESO)
//
// Replaces the slow upfront narrativeService.ts

import {
    MacroNarrative,
    MesoNarrative,
    FloorBeat,
    EnemyIntentTweets,
    CardPlayTweets,
    PathPreview,
    MACRO_SCHEMA,
    MESO_SCHEMA,
    DEFAULT_FLOOR_BEATS,
    StartupTone,
    PlayerRole,
    ROLE_CONTEXT
} from './progressiveNarrativeTypes';
import { NarrativeTweet, StartupContext } from './narrativeTypes';
import { MapNode, MapLayer, EnemyData } from './types';

// ============================================
// CONFIGURATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent';

// Verbose logging toggle - logs full prompts and responses for debugging
let VERBOSE_LOGGING = false;

export function setVerboseLogging(enabled: boolean): void {
    VERBOSE_LOGGING = enabled;
    console.log(`[Progressive] Verbose logging ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

export function isVerboseLogging(): boolean {
    return VERBOSE_LOGGING;
}

// ============================================
// API KEY MANAGEMENT (shared with old service)
// ============================================

export function getGeminiApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gemini_api_key');
}

export function setGeminiApiKey(apiKey: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('gemini_api_key', apiKey);
    }
}

export function hasGeminiApiKey(): boolean {
    return !!getGeminiApiKey();
}

// ============================================
// TWEET ID GENERATION
// ============================================

let tweetIdCounter = 0;

function generateTweetId(): string {
    return `tweet_${++tweetIdCounter}_${Date.now()}`;
}

function addTweetId(tweet: Omit<NarrativeTweet, 'id'>): NarrativeTweet {
    return { ...tweet, id: generateTweetId() };
}

// ============================================
// NARRATIVE CACHE
// ============================================

const mesoCache = new Map<string, MesoNarrative>();

export function getCachedMeso(nodeId: string): MesoNarrative | null {
    return mesoCache.get(nodeId) || null;
}

export function setCachedMeso(nodeId: string, meso: MesoNarrative): void {
    mesoCache.set(nodeId, meso);
}

export function clearNarrativeCache(): void {
    mesoCache.clear();
    tweetIdCounter = 0;
}

// ============================================
// MACRO GENERATION PROMPT
// ============================================

function buildMacroSystemPrompt(role: PlayerRole): string {
    const roleCtx = ROLE_CONTEXT[role];
    return `You generate authentic Twitter/X content for a startup founder's journey.

You're creating tweets for a ${roleCtx.title} building their startup through ACT 1: from naming the startup to closing Seed funding.

═══════════════════════════════════════════════
ACT 1: THE BEGINNING (Idea → MVP → PMF → Seed)
═══════════════════════════════════════════════

THE JOURNEY (16 story moments):

PHASE 1 - THE SPARK (Moments 1-4):
- You just quit your job and named the startup
- Writing the first lines of code
- Building the ugly first prototype
- Showing it to friends & family
→ Ends with: The prototype exists!

PHASE 2 - THE GRIND (Moments 5-8):
- Late nights fixing bugs
- Iterating on feedback
- Seeing competitors appear
- Tough decisions about direction
→ Ends with: MVP is taking shape

PHASE 3 - THE DOUBT (Moments 9-11):
- Runway getting scary
- Questioning if anyone will use this
- Team morale wavering
- The darkest moment before dawn
→ Ends with: A glimmer of hope

PHASE 4 - THE BREAKTHROUGH (Moments 12-14):
- First real user who LOVES it
- First paying customer
- Organic growth starting
- The metrics are moving!
→ Ends with: Product-Market Fit signals!

PHASE 5 - THE CLIMAX (Moments 15-16):
- The big investor meeting
- Pitching everything you built
→ Ends with: Seed round closed! 🎉

═══════════════════════════════════════════════

LANGUAGE RULES:
- Write so a 12-year-old AND a real ${role.toUpperCase()} both enjoy it
- NO jargon - "it works!" not "the system is stable"
- The ${role.toUpperCase()} flavor comes through ATTITUDE, not vocabulary
- Insider energy without insider words

CRITICAL RULES:
1. Write like a REAL FOUNDER tweets - casual, authentic, messy
2. NO hashtags, NO game references, NO jargon
3. Anyone should understand every word
4. Celebrate wins - shipping, milestones, traction
5. Never reference "enemies" or "battles" - just the founder journey`;
}

function buildMacroUserPrompt(context: StartupContext, role: PlayerRole): string {
    const roleCtx = ROLE_CONTEXT[role];
    return `Generate the ACT 1 story arc for this startup:

STARTUP: ${context.name}
WHAT THEY DO: ${context.oneLiner}
FOUNDER ROLE: ${roleCtx.title}

═══════════════════════════════════════════════
ACT 1: From naming the startup to closing Seed
═══════════════════════════════════════════════

Generate:
1. THEME: A catchy phrase for their Act 1 journey
2. TWITTER HANDLE: Using the startup name
3. EMOJI: One emoji that represents them
4. TONE: One of: scrappy, professional, quirky, serious
5. INTRO TWEET: The day they named the startup and started building
6. DEFEAT TWEET: If they ran out of runway before Seed (sad but dignified)
7. VICTORY TWEET: Seed round closed! MVP works, PMF found, funded!
8. STORY BEATS: 16 moments (one-liners for each)

STORY BEATS MUST follow the Act 1 journey:

THE SPARK (Moments 1-4) - Naming & First Prototype:
- "We finally have a name", "Quit the job", "First line of code"
- Milestone: ugly prototype exists

THE GRIND (Moments 5-8) - Building MVP:
- "Third all-nighter", "The bug that won't die", "Competitors appeared"
- Milestone: MVP is taking shape

THE DOUBT (Moments 9-11) - Pre-Launch Anxiety:
- "Runway is scary", "Is this even viable?", "Team is exhausted"
- Milestone: A glimmer of hope (one user loves it)

THE BREAKTHROUGH (Moments 12-14) - Launch & PMF:
- "Someone wants to pay!", "First 100 users", "The graph is going up"
- Milestone: Product-Market Fit signals!

THE CLIMAX (Moments 15-16) - Seed Pitch:
- "The investor meeting", "Everything on the line"
- Milestone: Seed round closed!

Each tweet under 200 characters - punchy, authentic, real.`;
}

// ============================================
// ENEMY PERSONALITY HELPER
// ============================================

interface EnemyPersonality {
    description: string;
    trashTalkStyle: string;
    handle: string;
    emoji: string;
}

/**
 * Returns personality traits for each enemy type to ensure grounded, specific tweets
 */
function getEnemyPersonality(enemyId: string): EnemyPersonality {
    const personalities: Record<string, EnemyPersonality> = {
        // Common enemies
        fanboy: {
            description: "Feature Creep - wants to add 'just one more thing' forever",
            trashTalkStyle: "Enthusiastic but overwhelming, suggests endless additions",
            handle: "@feature_creep",
            emoji: "📦"
        },
        spaghetti_code: {
            description: "The Copycat - steals ideas and does them cheaper",
            trashTalkStyle: "Condescending, claims they did it first and better",
            handle: "@copycat_ceo",
            emoji: "🦜"
        },
        critical_bug: {
            description: "The Doubter - questions everything, spreads FUD",
            trashTalkStyle: "Skeptical, asks rhetorical questions, uses 'I told you so'",
            handle: "@the_doubter",
            emoji: "🤨"
        },
        minor_bug: {
            description: "The Naysayer - says 'it won't work' and kills motivation",
            trashTalkStyle: "Dismissive, pessimistic, rolls eyes at everything",
            handle: "@nuh_uh",
            emoji: "👎"
        },
        quick_hack: {
            description: "The Shortcut Taker - cuts corners and weakens foundations",
            trashTalkStyle: "Rushed, impatient, mocks careful planning",
            handle: "@just_ship_it",
            emoji: "✂️"
        },
        tech_debt: {
            description: "The Procrastinator - delays everything, creates baggage",
            trashTalkStyle: "Lazy, suggests 'doing it later', yawns at urgency",
            handle: "@tomorrow_guy",
            emoji: "😴"
        },
        legacy_module: {
            description: "The Old Guard - stuck in old ways, resists change",
            trashTalkStyle: "Condescending about experience, 'back in my day' energy",
            handle: "@old_school",
            emoji: "👴"
        },
        hotfix: {
            description: "The Gambler - takes risky bets that might hurt",
            trashTalkStyle: "Reckless, taunts about taking chances",
            handle: "@yolo_dev",
            emoji: "🎲"
        },
        bad_merge: {
            description: "The Gossip - spreads rumors and hurts morale",
            trashTalkStyle: "Whispers secrets, claims inside knowledge",
            handle: "@office_gossip",
            emoji: "🗣️"
        },
        merge_conflict: {
            description: "The Politician - plays both sides, causes division",
            trashTalkStyle: "Two-faced, agrees then undermines",
            handle: "@corp_politics",
            emoji: "🎭"
        },
        memory_leak: {
            description: "The Energy Vampire - drains team energy slowly",
            trashTalkStyle: "Whiny, exhausting, constant small complaints",
            handle: "@energy_drain",
            emoji: "🧛"
        },
        micromanager: {
            description: "The Micromanager - demands updates, questions autonomy",
            trashTalkStyle: "Controlling, asks for status every 5 minutes",
            handle: "@status_pls",
            emoji: "🔍"
        },
        feature_pusher: {
            description: "The Yes-Man - agrees to everything, overcommits",
            trashTalkStyle: "Overly agreeable, then blames when things fail",
            handle: "@yes_and",
            emoji: "🤝"
        },
        headhunter: {
            description: "The Poacher - tries to steal your talent",
            trashTalkStyle: "Smooth, offers 'better opportunities'",
            handle: "@talent_scout",
            emoji: "🎯"
        },
        // Elites
        scope_creep: {
            description: "Scope Creep (Elite) - turns simple into impossible",
            trashTalkStyle: "Grand visions, impossible timelines, 'one more feature'",
            handle: "@scope_creep_",
            emoji: "📈"
        },
        over_engineer: {
            description: "Over-Engineer (Elite) - makes everything too complex",
            trashTalkStyle: "Intellectual superiority, overcomplicates simple things",
            handle: "@10x_engineer",
            emoji: "🔧"
        },
        burnout: {
            description: "Burnout (Elite) - pure exhaustion that makes you quit",
            trashTalkStyle: "Tired but relentless, 'you can't keep this up'",
            handle: "@burnout_inc",
            emoji: "🔥"
        },
        pivot_master: {
            description: "The Pivot Master (Elite) - demands constant changes",
            trashTalkStyle: "Constantly pivoting, 'what if we tried X instead'",
            handle: "@pivot_lord",
            emoji: "🔄"
        },
        // Bosses
        boss_the_pivot: {
            description: "The Pivot (Boss) - demands you change everything",
            trashTalkStyle: "Authoritative, questions your entire direction",
            handle: "@market_reality",
            emoji: "🔀"
        },
        boss_burn_rate: {
            description: "Burn Rate (Boss) - your money running out",
            trashTalkStyle: "Cold, financial, counts down your runway",
            handle: "@burn_rate",
            emoji: "💸"
        },
        boss_the_monolith: {
            description: "The Monolith (Boss) - legacy incumbent crushing startups",
            trashTalkStyle: "Corporate, dismissive of 'little startups'",
            handle: "@enterprise_inc",
            emoji: "🏢"
        },
        investor_meeting: {
            description: "The VC Gauntlet (Boss) - survive or die pitch meeting",
            trashTalkStyle: "Sharp questions, skeptical of metrics",
            handle: "@tough_vc",
            emoji: "💼"
        },
        // Legacy system enemies (multi-part)
        legacy_monolith: {
            description: "Legacy Code Monolith - old system that refuses to die",
            trashTalkStyle: "Ancient, speaks of 'how things were built'",
            handle: "@legacy_sys",
            emoji: "🏛️"
        },
        legacy_hack: {
            description: "Legacy Hack - quick fixes from the past haunting you",
            trashTalkStyle: "Sneaky, 'remember when you cut corners?'",
            handle: "@old_hack",
            emoji: "🔓"
        },
        legacy_patch: {
            description: "Legacy Patch - band-aids that never got fixed properly",
            trashTalkStyle: "Accusatory, 'you said you'd fix this later'",
            handle: "@temp_fix",
            emoji: "🩹"
        }
    };

    return personalities[enemyId] || {
        description: "A startup challenge that needs solving",
        trashTalkStyle: "Generic villain mocking the startup",
        handle: "@problem",
        emoji: "😈"
    };
}

/**
 * Generate personality-specific attack tweets for fallback
 */
function getPersonalityAttackTweets(enemyId: string, startupName: string, personality: EnemyPersonality): string[] {
    const attacks: Record<string, string[]> = {
        critical_bug: [
            `I mean... does anyone actually believe ${startupName} will work? 🤨`,
            `Called it. ${startupName} is already struggling. Told you so.`,
            `"Revolutionary idea" they said. Suuure. 😏`
        ],
        minor_bug: [
            `This ${startupName} thing? Yeah that's never gonna work.`,
            `${startupName}? lol no. Next.`,
            `Not even worth discussing. ${startupName} is DOA. 👎`
        ],
        fanboy: [
            `Oh wait ${startupName} should ALSO add [insert 50 features here]! 📦`,
            `What if ${startupName} also did X, Y, Z, AND... 🤩`,
            `More features! More scope! ${startupName} needs EVERYTHING!`
        ],
        spaghetti_code: [
            `Cute idea. We already did this 2 years ago. Better. 🦜`,
            `${startupName} is basically just a worse version of what we built`,
            `Imitation is flattering but ${startupName}'s execution is... yikes`
        ],
        quick_hack: [
            `Why waste time on quality? Just ship it! ✂️`,
            `${startupName} is taking too long. Cut corners already!`,
            `Tests? Documentation? LOL just push to prod 🏃`
        ],
        tech_debt: [
            `*yawns* ${startupName} will deal with this... eventually 😴`,
            `Who needs clean code anyway? Future ${startupName}'s problem`,
            `Add it to the backlog. We'll never actually fix it lol`
        ],
        legacy_module: [
            `Back in MY day, we didn't need fancy ${startupName}s 👴`,
            `This "modern" approach? Just a fad. The old ways worked fine.`,
            `${startupName} kids don't understand REAL engineering`
        ],
        burnout: [
            `How many hours has ${startupName} team been awake? 🔥`,
            `They can't keep this pace up. I'll wait.`,
            `Sustainability? What's that? ${startupName} is running on fumes`
        ],
        micromanager: [
            `Status update? What's the ETA? Can I get an hourly report? 🔍`,
            `${startupName} needs MORE oversight. I need to see EVERY decision.`,
            `Why wasn't I CC'd on this? Did you get approval?`
        ]
    };

    return attacks[enemyId] || [
        `${startupName} is about to learn a hard lesson`,
        `This won't end well for ${startupName}. Watch.`,
        `Another startup, another failure. ${startupName}'s turn.`
    ];
}

/**
 * Generate personality-specific buff tweets for fallback
 */
function getPersonalityBuffTweets(enemyId: string, startupName: string, personality: EnemyPersonality): string[] {
    const buffs: Record<string, string[]> = {
        critical_bug: [
            `See? The doubt is spreading. Even ${startupName}'s team is unsure now 🤨`,
            `Uncertainty compounds. ${startupName} is questioning everything.`
        ],
        minor_bug: [
            `More naysayers joining. ${startupName} hype is dying 👎`,
            `The skepticism is growing. ${startupName} can feel it.`
        ],
        fanboy: [
            `YES! ${startupName} agreed to more features! Scope = infinity! 📦`,
            `Feature creep is WINNING. ${startupName}'s roadmap is chaos now!`
        ],
        tech_debt: [
            `More shortcuts = more debt. ${startupName} future is MINE 😴`,
            `Backlog growing. ${startupName} will NEVER catch up.`
        ],
        burnout: [
            `The exhaustion compounds. ${startupName} is running on empty 🔥`,
            `Another late night. ${startupName} team morale = 📉`
        ]
    };

    return buffs[enemyId] || [
        `${startupName}'s problems are multiplying. Love to see it 📈`,
        `Getting stronger. ${startupName} can't stop this.`
    ];
}

/**
 * Generate personality-specific debuff tweets for fallback
 */
function getPersonalityDebuffTweets(enemyId: string, startupName: string, personality: EnemyPersonality): string[] {
    const debuffs: Record<string, string[]> = {
        critical_bug: [
            `${startupName} is second-guessing everything now. My work here is done 🤨`,
            `Confidence = shattered. ${startupName} doesn't believe in themselves.`
        ],
        minor_bug: [
            `${startupName} team looks defeated. Good. 👎`,
            `Morale is tanking. ${startupName} is losing faith.`
        ],
        quick_hack: [
            `Corners cut. Quality dropped. ${startupName} will pay later ✂️`,
            `${startupName}'s foundations are WEAK now. My doing.`
        ],
        tech_debt: [
            `${startupName} is drowning in technical debt. Delicious 😴`,
            `Every shortcut haunts them. ${startupName} is paralyzed.`
        ],
        burnout: [
            `${startupName} team is exhausted. Can barely function 🔥`,
            `Sleep deprivation hitting hard. ${startupName} is slowing down.`
        ],
        micromanager: [
            `${startupName} can't make decisions without checking 10 people now 🔍`,
            `Autonomy? Gone. ${startupName} is caught in approval loops.`
        ]
    };

    return debuffs[enemyId] || [
        `${startupName} team looking exhausted. Love to see it 😴`,
        `Slowing down, ${startupName}? Good. Very good.`
    ];
}

// ============================================
// NARRATIVE ARC HELPERS
// ============================================

import { NarrativeDevice, EmotionalArc } from './progressiveNarrativeTypes';

/**
 * Get human-readable description of a narrative device for the LLM prompt
 */
function getNarrativeDeviceDescription(device: NarrativeDevice): string {
    const descriptions: Record<NarrativeDevice, string> = {
        'foreshadowing': "Plant subtle hints about future challenges (creates anticipation)",
        'callback': "Reference earlier events to create continuity (makes story feel connected)",
        'tension_escalation': "Build dramatic tension - stakes are rising",
        'moment_of_doubt': "Character questions their path (vulnerability, relatability)",
        'small_victory': "A minor win that builds momentum (hope amid struggle)",
        'setback': "Things go wrong - temporary defeat builds empathy",
        'revelation': "Important insight or truth is discovered",
        'cliffhanger': "Leave something unresolved (creates urgency to continue)",
        'turning_point': "The story direction fundamentally changes",
        'stakes_raising': "Make consequences clearer and more severe",
        'comic_relief': "Brief moment of levity to balance tension",
        'ally_appears': "Help arrives - customer, mentor, or supporter",
        'dark_moment': "Lowest point before breakthrough (makes victory sweeter)",
        'payoff': "Earlier setup pays off - reward for paying attention"
    };
    return descriptions[device] || "Advance the story naturally";
}

/**
 * Get human-readable description of emotional arc for the LLM prompt
 */
function getEmotionalArcDescription(arc: EmotionalArc): string {
    const descriptions: Record<EmotionalArc, string> = {
        'hopeful_to_challenged': "Start optimistic, end facing real obstacles (but still standing)",
        'determined_to_tired': "Start with resolve, end exhausted but pushing through",
        'anxious_to_desperate': "Start worried, end at breaking point",
        'desperate_to_hopeful': "Start at rock bottom, end with glimmer of hope",
        'tense_to_triumphant': "Start under pressure, end victorious"
    };
    return descriptions[arc] || "Natural emotional progression";
}

// ============================================
// MESO GENERATION PROMPT
// ============================================

function buildMesoSystemPrompt(role: PlayerRole): string {
    const roleCtx = ROLE_CONTEXT[role];
    return `You generate tweets for a specific MOMENT in a startup founder's journey.

THE FOUNDER is a ${roleCtx.title} - but write for EVERYONE to understand.

LANGUAGE RULES (CRITICAL):
- Write so a 12-year-old AND a real CTO both enjoy it
- NO technical jargon: "the system works" not "the architecture holds"
- NO infrastructure terms: "it's running" not "the infra is stable"  
- The ${role.toUpperCase()} flavor comes through ATTITUDE, not vocabulary
- Insider energy without insider words

GOOD EXAMPLES:
✅ "Pushed the fix. It works. That feeling never gets old."
✅ "3 AM and we finally figured it out. Sleep can wait."
✅ "First user said they love it. Best bug report ever."

BAD EXAMPLES (too technical):
❌ "Stabilized the DB cluster" → say "Fixed the crash"
❌ "The architecture is holding" → say "It's working"
❌ "Deployed to prod" → say "Shipped it"
❌ "Load balancer screaming" → say "Getting popular fast"

FOR THE FOUNDER'S TWEETS:
- Authentic, sometimes messy, always real
- Celebrate shipping and progress - never "defeating" anything
- Short punchy sentences like texting a friend

FOR DOUBTER TWEETS:
- General skepticism, not personal attacks
- Sound like random Twitter voices, not supervillains
- Never @mention the startup

CRITICAL RULES:
1. NO hashtags, NO game language, NO jargon
2. Under 180 characters - punchy and real
3. A 12-year-old should understand every word
4. A CTO should nod and think "been there"
5. Victory = pure celebration, no battle references`;
}

function buildMesoUserPrompt(
    context: StartupContext,
    macro: MacroNarrative,
    floor: number,
    floorBeat: FloorBeat,
    enemies: { id: string; name: string; type: string; description?: string; emoji?: string }[],
    nextNodes: { id: string; type: string }[],
    deckCards?: { name: string; type: string; description: string }[],
    role: PlayerRole = 'cto'
): string {
    const roleCtx = ROLE_CONTEXT[role];

    // Build obstacle descriptions without exposing IDs
    const obstacleDetails = enemies.map(e => {
        const personality = getEnemyPersonality(e.id);
        return `- ${personality.description}
     Voice: ${personality.trashTalkStyle}
     (internal ref: ${e.id})`;  // Internal ref for response matching only
    }).join('\n');

    // Group deck cards by type
    const attackCards = deckCards?.filter(c => c.type === 'attack').map(c => c.name) || [];
    const skillCards = deckCards?.filter(c => c.type === 'skill').map(c => c.name) || [];
    const powerCards = deckCards?.filter(c => c.type === 'power').map(c => c.name) || [];

    const uniqueAttacks = [...new Set(attackCards)].slice(0, 5).join(', ') || 'Commit, Deploy';
    const uniqueSkills = [...new Set(skillCards)].slice(0, 5).join(', ') || 'Rollback, Refactor';
    const uniquePowers = [...new Set(powerCards)].slice(0, 5).join(', ') || 'Network Effects';

    // Phase labels for the LLM (no floor numbers)
    const phaseLabel = {
        'hope': 'Early days, full of excitement',
        'grind': 'Deep in the build, exhausted but pushing',
        'doubt': 'Tough times, questioning everything',
        'breakthrough': 'Things are clicking, momentum building',
        'climax': 'The big moment, everything on the line'
    }[floorBeat.storyPhase] || 'On the journey';

    return `Generate tweets for this MOMENT in ${context.name}'s journey:

═══════════════════════════════════════════════
THE MOMENT: ${floorBeat.storyBeat}
PHASE: ${phaseLabel}
MOOD: ${floorBeat.emotionalArc.split('_')[0]} → ${floorBeat.emotionalArc.split('_').pop()}
═══════════════════════════════════════════════

THE SITUATION:
📖 What's happening: "${floorBeat.setup}"
⚡ The challenge: "${floorBeat.conflict}"
✨ The win: "${floorBeat.resolution}"

WHAT'S AT STAKE: ${floorBeat.stakes}

STARTUP: ${context.name} (${macro.startupHandle})
FOUNDER ROLE: ${roleCtx.title}
TOOLS THEY USE: ${uniqueAttacks}, ${uniqueSkills}, ${uniquePowers}

OBSTACLES/DOUBTERS IN THIS MOMENT:
${obstacleDetails}

═══════════════════════════════════════════════
GENERATE THESE TWEETS:
═══════════════════════════════════════════════

1. APPROACH TWEET (founder entering this moment):
   - Reflects: "${floorBeat.setup}"
   - Mood: ${floorBeat.emotionalArc.split('_')[0]}
   - Authentic ${role.toUpperCase()} voice

2. VICTORY TWEET (founder celebrating the win):
   - Reflects: "${floorBeat.resolution}"
   - CELEBRATE shipping/progress/milestone - NOT "defeating" anything
   - Pure positive energy, no mention of obstacles overcome

3. OBSTACLE TWEETS (for each obstacle above):
   Use the internal ref in your response for matching, but write tweets as GENERAL SKEPTICISM:
   - 2-3 skeptical tweets (their voice, about startups/founders in general)
   - 1-2 escalation tweets (doubt growing)
   - 1-2 undermining tweets (mocking the struggle)
   - 1 resolution tweet (what the FOUNDER tweets after pushing past this)
   
   ⚠️ DOUBTER TWEETS:
   - Never @mention or name ${context.name} directly
   - Sound like random skeptical Twitter voices
   - Examples: "Another app? Sure that'll work", "Founders always underestimate"

4. ACTION TWEETS (when founder uses their tools):
   - 2 "${uniqueAttacks}" tweets: Celebrating shipping (${roleCtx.cardFlavor})
   - 2 "${uniqueSkills}" tweets: Celebrating smart moves
   - 2 "${uniquePowers}" tweets: Celebrating strategic wins
   
   These should feel like BUILD LOG UPDATES:
   ✅ "Pushed the fix. Clean deploy. 🚀"
   ✅ "Refactored that mess. So much cleaner now."
   ❌ NOT "Take that!" or battle language

5. TEASERS for what's next (just internal use):
   - One-liner hints about upcoming challenges

REMEMBER: This is ${phaseLabel.toLowerCase()}. Match the energy!`;
}


// ============================================
// GEMINI API CALL
// ============================================

interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

/**
 * Sanitize JSON string to fix common escape sequence issues from LLM output
 */
function sanitizeJSON(rawText: string): string {
    // Fix common JSON escape issues
    let sanitized = rawText;

    // Fix unescaped newlines inside strings
    sanitized = sanitized.replace(/(?<!\\)\n(?=(?:[^"]*"[^"]*")*[^"]*"[^"]*$)/g, '\\n');

    // Fix unescaped tabs inside strings
    sanitized = sanitized.replace(/(?<!\\)\t/g, '\\t');

    // Fix invalid escape sequences (like \' which isn't valid in JSON)
    sanitized = sanitized.replace(/\\'/g, "'");

    // Fix double-escaped quotes that might break parsing
    sanitized = sanitized.replace(/\\\\"/g, '\\"');

    // Remove any control characters that might slip through
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return '';
    });

    return sanitized;
}

/**
 * Parse JSON with sanitization fallback
 */
function parseJSONSafe(rawText: string): any {
    // First try direct parse
    try {
        return JSON.parse(rawText);
    } catch (firstError) {
        console.log('[Progressive] ⚠️ Initial JSON parse failed, trying sanitization...');

        // Try with sanitization
        try {
            const sanitized = sanitizeJSON(rawText);
            return JSON.parse(sanitized);
        } catch (secondError) {
            console.error('[Progressive] ❌ JSON parse failed even after sanitization');
            console.error('[Progressive] Raw text (first 500 chars):', rawText.substring(0, 500));
            throw firstError; // Throw original error for clarity
        }
    }
}

async function callGeminiAPI(
    systemPrompt: string,
    userPrompt: string,
    schema: object,
    apiKey: string,
    maxRetries: number = 2
): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            const delay = Math.pow(2, attempt) * 500; // 1s, 2s exponential backoff
            console.log(`[Progressive] 🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log('[Progressive] 🚀 Gemini API call starting...');

        // Verbose logging: show full prompts
        if (VERBOSE_LOGGING) {
            console.log('\n' + '='.repeat(80));
            console.log('📝 SYSTEM PROMPT:');
            console.log('='.repeat(80));
            console.log(systemPrompt);
            console.log('\n' + '='.repeat(80));
            console.log('📝 USER PROMPT:');
            console.log('='.repeat(80));
            console.log(userPrompt);
            console.log('='.repeat(80) + '\n');
        }

        const requestBody = {
            contents: [{
                parts: [{ text: userPrompt }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema,  // Use responseSchema per Gemini API docs
                temperature: 0.9,
                maxOutputTokens: 16384
            }
        };

        const startTime = Date.now();
        console.log(`[Progressive] ⏱️ Request started at ${new Date().toISOString()}`);

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const timeToFirstByte = Date.now() - startTime;
            console.log(`[Progressive] ⚡ Time to first byte: ${timeToFirstByte}ms`);
            console.log(`[Progressive] 📥 Response status: ${response.status}`);

            if (!response.ok) {
                const error = await response.text();
                console.error('[Progressive] ❌ API Error:', error);

                // Don't retry on 4xx errors (client errors)
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    throw new Error(`Gemini API error: ${response.status} - ${error}`);
                }

                lastError = new Error(`Gemini API error: ${response.status} - ${error}`);
                continue; // Retry on 5xx or 429 (rate limit)
            }

            const data: GeminiResponse = await response.json();

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                lastError = new Error('Invalid response structure from Gemini API');
                continue; // Retry
            }

            const rawText = data.candidates[0].content.parts[0].text;
            const totalTime = Date.now() - startTime;
            console.log(`[Progressive] ✅ Response complete in ${totalTime}ms (TTFB: ${timeToFirstByte}ms, Parse: ${totalTime - timeToFirstByte}ms)`);

            // Verbose logging: show raw response
            if (VERBOSE_LOGGING) {
                console.log('\n' + '='.repeat(80));
                console.log('📥 RAW API RESPONSE:');
                console.log('='.repeat(80));
                console.log(rawText.substring(0, 5000) + (rawText.length > 5000 ? '\n... [truncated]' : ''));
                console.log('='.repeat(80) + '\n');
            }

            // Parse with sanitization fallback
            const parsed = parseJSONSafe(rawText);

            // Verbose logging: show parsed result
            if (VERBOSE_LOGGING) {
                console.log('\n' + '='.repeat(80));
                console.log('✅ PARSED RESULT:');
                console.log('='.repeat(80));
                console.log(JSON.stringify(parsed, null, 2).substring(0, 3000) + (JSON.stringify(parsed).length > 3000 ? '\n... [truncated]' : ''));
                console.log('='.repeat(80) + '\n');
            }

            return parsed;

        } catch (error) {
            lastError = error as Error;
            console.error(`[Progressive] ⚠️ Attempt ${attempt + 1} failed:`, lastError.message);

            // If it's a JSON parse error, try again (LLM might give better output)
            if (lastError.message.includes('JSON') || lastError.message.includes('parse')) {
                continue;
            }

            // For other errors, check if retryable
            if (attempt < maxRetries) {
                continue;
            }
        }
    }

    // All retries exhausted
    throw lastError || new Error('Gemini API call failed after retries');
}

// ============================================
// MACRO GENERATION
// ============================================

function transformMacroResponse(raw: any, context: StartupContext): MacroNarrative {
    // Transform floor beats - merge LLM-generated content with rich default narrative structure
    const floorBeats: FloorBeat[] = (raw.floorBeats || []).map((beat: any, index: number) => {
        // Get the default beat which has the full narrative arc structure
        const defaultBeat = DEFAULT_FLOOR_BEATS[index] || DEFAULT_FLOOR_BEATS[0];

        // Merge: LLM provides story text, defaults provide narrative structure
        return {
            ...defaultBeat,  // All narrative arc fields (setup, conflict, resolution, devices, etc.)
            floor: beat.floor || index + 1,
            storyBeat: beat.storyBeat || defaultBeat.storyBeat,
            narrativeHook: beat.narrativeHook || defaultBeat.narrativeHook,
            storyPhase: (beat.storyPhase as FloorBeat['storyPhase']) || defaultBeat.storyPhase,
            // If LLM provides these, use them; otherwise use defaults
            setup: beat.setup || defaultBeat.setup,
            conflict: beat.conflict || defaultBeat.conflict,
            resolution: beat.resolution || defaultBeat.resolution,
            stakes: beat.stakes || defaultBeat.stakes
        };
    });

    // Ensure we have 16 floor beats
    while (floorBeats.length < 16) {
        const fallback = DEFAULT_FLOOR_BEATS[floorBeats.length];
        floorBeats.push(fallback);
    }

    return {
        theme: raw.theme || "The Hunt for Product-Market Fit",
        startupHandle: raw.startupHandle || `@${context.name.toLowerCase().replace(/\s+/g, '_')}`,
        startupEmoji: raw.startupEmoji || "🚀",
        startupTone: (raw.startupTone as StartupTone) || 'scrappy',
        introTweet: addTweetId({ ...raw.introTweet, timestamp: 'just now' }),
        defeatTweet: addTweetId({ ...raw.defeatTweet, timestamp: 'just now', isDefeat: true }),
        bossVictoryTweet: addTweetId({ ...raw.bossVictoryTweet, timestamp: 'just now', isVictory: true }),
        floorBeats
    };
}

export async function generateMacroNarrative(context: StartupContext, role: PlayerRole = 'cto'): Promise<MacroNarrative> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.log('[Progressive] No API key, using fallback MACRO');
        return createFallbackMacro(context);
    }

    try {
        console.log('[Progressive] 🎬 Generating MACRO for:', context.name, '(role:', role, ')');
        const raw = await callGeminiAPI(
            buildMacroSystemPrompt(role),
            buildMacroUserPrompt(context, role),
            MACRO_SCHEMA,
            apiKey
        );
        const macro = transformMacroResponse(raw, context);
        console.log('[Progressive] ✅ MACRO generated:', macro.theme);
        return macro;
    } catch (error) {
        console.error('[Progressive] ❌ MACRO generation failed:', error);
        return createFallbackMacro(context);
    }
}

// ============================================
// MESO GENERATION
// ============================================

function transformMesoResponse(
    raw: any,
    nodeId: string,
    floor: number,
    nodeType: string,
    enemies: { id: string }[]
): MesoNarrative {
    // Transform enemy intent tweets
    const enemyIntentTweets: Record<string, EnemyIntentTweets> = {};

    for (const enemyPool of (raw.enemyIntentTweets || [])) {
        // Normalize the enemy ID returned by Gemini to ensure consistent lookup
        const rawEnemyId = enemyPool.enemyId || '';
        // Extract base ID (in case Gemini added extra suffixes)
        const normalizedId = rawEnemyId.split('_').filter((p: string) => !/^\d{10,}$/.test(p) && !/^\d{1,2}$/.test(p)).join('_') || rawEnemyId;

        console.log('[Progressive] MESO storing tweets for enemy:', normalizedId, '(raw:', rawEnemyId, ')');

        enemyIntentTweets[normalizedId] = {
            attack: (enemyPool.attackTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
            buff: (enemyPool.buffTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
            debuff: (enemyPool.debuffTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
            defeat: addTweetId({ ...enemyPool.defeatTweet, timestamp: 'just now', isVictory: true }),
            attackIndex: 0,
            buffIndex: 0,
            debuffIndex: 0
        };
    }

    console.log('[Progressive] MESO enemy IDs stored:', Object.keys(enemyIntentTweets));

    // Transform card play tweets
    const cardPlayTweets: CardPlayTweets = {
        attack: (raw.cardPlayTweets?.attackTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        skill: (raw.cardPlayTweets?.skillTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        power: (raw.cardPlayTweets?.powerTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        attackIndex: 0,
        skillIndex: 0,
        powerIndex: 0
    };

    // Transform path previews
    const pathPreviews: PathPreview[] = (raw.pathPreviews || []).map((p: any) => ({
        nodeId: p.nodeId,
        teaser: p.teaser,
        decisionHint: p.decisionHint
    }));

    return {
        nodeId,
        floor,
        nodeType,
        approachTweet: addTweetId({ ...raw.approachTweet, timestamp: 'just now' }),
        victoryTweet: addTweetId({ ...raw.victoryTweet, timestamp: 'just now', isVictory: true }),
        enemyIntentTweets,
        cardPlayTweets,
        pathPreviews
    };
}

export async function generateMesoNarrative(
    context: StartupContext,
    macro: MacroNarrative,
    nodeId: string,
    floor: number,
    nodeType: string,
    enemies: { id: string; name: string; type: string }[],
    nextNodes: { id: string; type: string }[],
    deckCards?: { name: string; type: string; description: string }[],
    role: PlayerRole = 'cto'
): Promise<MesoNarrative> {
    // Check cache first - but validate it has the right enemies
    const cached = getCachedMeso(nodeId);
    if (cached) {
        // Validate cached MESO has tweets for the actual enemies
        const cachedEnemyIds = Object.keys(cached.enemyIntentTweets);
        const requestedEnemyIds = enemies.map(e => e.id);
        const hasAllEnemies = requestedEnemyIds.every(id => cachedEnemyIds.includes(id));

        if (hasAllEnemies) {
            console.log('[Progressive] 📦 Using cached MESO for:', nodeId);
            return cached;
        } else {
            console.log('[Progressive] ⚠️ Cached MESO has wrong enemies. Expected:', requestedEnemyIds.join(', '), 'Got:', cachedEnemyIds.join(', '));
            // Fall through to generate new MESO
        }
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.log('[Progressive] No API key, using fallback MESO');
        return createFallbackMeso(context, macro, nodeId, floor, nodeType, enemies);
    }

    const floorBeat = macro.floorBeats[floor - 1] || DEFAULT_FLOOR_BEATS[floor - 1];

    try {
        console.log('[Progressive] 🎬 Generating MESO for floor:', floor, 'node:', nodeId, '(role:', role, ')');
        const raw = await callGeminiAPI(
            buildMesoSystemPrompt(role),
            buildMesoUserPrompt(context, macro, floor, floorBeat, enemies, nextNodes, deckCards, role),
            MESO_SCHEMA,
            apiKey
        );
        const meso = transformMesoResponse(raw, nodeId, floor, nodeType, enemies);
        setCachedMeso(nodeId, meso);
        console.log('[Progressive] ✅ MESO generated for floor:', floor);
        return meso;
    } catch (error) {
        console.error('[Progressive] ❌ MESO generation failed:', error);
        return createFallbackMeso(context, macro, nodeId, floor, nodeType, enemies);
    }
}

// ============================================
// COMBINED INITIAL GENERATION
// ============================================

/**
 * Generate MACRO + first node MESO together for fast startup
 * Called when player submits startup name
 */
export async function generateInitialNarrative(
    context: StartupContext,
    firstNode: { id: string; floor: number; type: string },
    enemies: { id: string; name: string; type: string }[],
    nextNodes: { id: string; type: string }[]
): Promise<{ macro: MacroNarrative; meso: MesoNarrative }> {
    console.log('[Progressive] 🚀 Generating initial narrative (MACRO + first MESO)');

    // Generate MACRO first
    const macro = await generateMacroNarrative(context);

    // Generate first node MESO
    const meso = await generateMesoNarrative(
        context,
        macro,
        firstNode.id,
        firstNode.floor,
        firstNode.type,
        enemies,
        nextNodes
    );

    return { macro, meso };
}

/**
 * Generate MESO for next connected paths (async, after victory)
 * Called while player picks rewards
 */
export async function generateNextPathNarratives(
    context: StartupContext,
    macro: MacroNarrative,
    connectedNodes: { id: string; floor: number; type: string }[],
    map: MapLayer[],
    getEnemiesForNode: (node: { id: string; floor: number; type: string }) => { id: string; name: string; type: string }[],
    deckCards?: { name: string; type: string; description: string }[]
): Promise<MesoNarrative[]> {
    console.log('[Progressive] 🔄 Generating MESO for', connectedNodes.length, 'next paths');

    const results: MesoNarrative[] = [];

    for (const node of connectedNodes) {
        // Get enemies that would spawn for this node
        const enemies = getEnemiesForNode(node);

        // Get next nodes from this node
        const nextFloorNodes = map[node.floor] || [];
        const nextNodes = nextFloorNodes
            .filter(n => {
                const parentNode = map[node.floor - 1]?.find(pn => pn.id === node.id);
                return parentNode?.connections.includes(n.id);
            })
            .map(n => ({ id: n.id, type: n.type }));

        const meso = await generateMesoNarrative(
            context,
            macro,
            node.id,
            node.floor,
            node.type,
            enemies,
            nextNodes,
            deckCards
        );
        results.push(meso);
    }

    return results;
}

// ============================================
// FALLBACK GENERATORS
// ============================================

export function createFallbackMacro(context: StartupContext): MacroNarrative {
    const handle = `@${context.name.toLowerCase().replace(/\s+/g, '_')}`;

    const createTweet = (
        author: NarrativeTweet['author'],
        content: string,
        likes = 10,
        retweets = 2,
        replies = 1
    ): NarrativeTweet => ({
        id: generateTweetId(),
        author,
        handle,
        displayName: context.name,
        avatarEmoji: '🚀',
        content,
        timestamp: 'just now',
        likes,
        retweets,
        replies
    });

    return {
        theme: "The Hunt for Product-Market Fit",
        startupHandle: handle,
        startupEmoji: '🚀',
        startupTone: 'scrappy',
        introTweet: createTweet('startup', `Day 1 of building ${context.name}. ${context.oneLiner}. Let's see if anyone actually wants this 🚀`, 42, 8, 5),
        defeatTweet: createTweet('startup', `Hard to write this... ${context.name} is shutting down. Ran out of runway. Thanks for believing. 💔`, 890, 45, 234),
        bossVictoryTweet: createTweet('startup', `WE DID IT! ${context.name} just closed our seed round! 🦄 Time to scale!`, 1200, 340, 89),
        floorBeats: DEFAULT_FLOOR_BEATS.map(beat => ({
            ...beat,
            storyBeat: beat.storyBeat.replace('The', context.name),
        }))
    };
}

export function createFallbackMeso(
    context: StartupContext,
    macro: MacroNarrative,
    nodeId: string,
    floor: number,
    nodeType: string,
    enemies: { id: string; name: string; type: string }[]
): MesoNarrative {
    const floorBeat = macro.floorBeats[floor - 1] || DEFAULT_FLOOR_BEATS[floor - 1];

    const createTweet = (
        author: NarrativeTweet['author'],
        content: string,
        likes = 10,
        isEnemy = false
    ): NarrativeTweet => ({
        id: generateTweetId(),
        author,
        handle: isEnemy ? '@problem' : macro.startupHandle,
        displayName: isEnemy ? 'Problem' : context.name,
        avatarEmoji: isEnemy ? '😈' : macro.startupEmoji,
        content,
        timestamp: 'just now',
        likes,
        retweets: Math.floor(likes / 5),
        replies: Math.floor(likes / 10)
    });

    // Create enemy intent tweets for each enemy - use personality for grounded tweets
    const enemyIntentTweets: Record<string, EnemyIntentTweets> = {};
    for (const enemy of enemies) {
        const personality = getEnemyPersonality(enemy.id);

        // Create enemy-specific tweet helper
        const createEnemyTweet = (content: string, likes = 5): NarrativeTweet => ({
            id: generateTweetId(),
            author: 'enemy',
            handle: personality.handle,
            displayName: enemy.name,
            avatarEmoji: personality.emoji,
            content,
            timestamp: 'just now',
            likes,
            retweets: Math.floor(likes / 5),
            replies: Math.floor(likes / 10)
        });

        // Generate personality-specific tweets
        const attackTweets = getPersonalityAttackTweets(enemy.id, context.name, personality);
        const buffTweets = getPersonalityBuffTweets(enemy.id, context.name, personality);
        const debuffTweets = getPersonalityDebuffTweets(enemy.id, context.name, personality);

        enemyIntentTweets[enemy.id] = {
            attack: attackTweets.map(t => createEnemyTweet(t, 5)),
            buff: buffTweets.map(t => createEnemyTweet(t, 6)),
            debuff: debuffTweets.map(t => createEnemyTweet(t, 4)),
            defeat: createTweet('startup', `Shut down ${enemy.name}! ${context.name} keeps shipping! 💪`, 25),
            attackIndex: 0,
            buffIndex: 0,
            debuffIndex: 0
        };
    }

    return {
        nodeId,
        floor,
        nodeType,
        approachTweet: createTweet('startup', `${floorBeat.storyBeat}. Time to face this challenge. 💪`, 15),
        victoryTweet: createTweet('startup', `Another obstacle overcome! ${context.name} is unstoppable! 🚀`, 45),
        enemyIntentTweets,
        cardPlayTweets: {
            attack: [
                createTweet('startup', `Take THAT! 💥`, 8),
                createTweet('startup', `Shipping fast and breaking things! 🚀`, 12),
            ],
            skill: [
                createTweet('startup', `Building up our defenses... 🛡️`, 6),
                createTweet('startup', `Strategy time. Let's think this through. 🧠`, 9),
            ],
            power: [
                createTweet('startup', `This architecture will pay off! 🏗️`, 11),
                createTweet('startup', `Long-term plays FTW! 📈`, 14),
            ],
            attackIndex: 0,
            skillIndex: 0,
            powerIndex: 0
        },
        pathPreviews: []
    };
}

// ============================================
// TWEET ACCESSORS
// ============================================

/**
 * Get next enemy intent tweet (cycles through pool)
 */
export function getEnemyIntentTweet(
    meso: MesoNarrative,
    enemyId: string,
    intentType: 'attack' | 'buff' | 'debuff'
): NarrativeTweet | null {
    // Extract base enemy ID (remove timestamp suffix AND trailing index)
    // Examples: 
    //   minor_bug_1765461419900_0 -> minor_bug
    //   critical_bug_1765461419900 -> critical_bug
    //   legacy_monolith -> legacy_monolith
    const parts = enemyId.split('_');
    const baseIdParts: string[] = [];
    for (const part of parts) {
        // Stop at timestamp (10+ digits) OR single/double digit index after timestamp
        if (/^\d{10,}$/.test(part)) break;
        if (/^\d{1,2}$/.test(part) && baseIdParts.length > 0) break; // Index like _0, _1, _2
        baseIdParts.push(part);
    }
    const baseEnemyId = baseIdParts.join('_') || enemyId;

    const pool = meso.enemyIntentTweets[baseEnemyId];
    if (!pool) {
        console.warn('[Progressive] No tweet pool for enemy:', baseEnemyId,
            '| Available:', Object.keys(meso.enemyIntentTweets).join(', '),
            '| Original ID:', enemyId);
        return null;
    }

    const tweets = pool[intentType];
    if (!tweets || tweets.length === 0) {
        return pool.attack[0] || null; // Fallback to attack
    }

    const indexKey = `${intentType}Index` as 'attackIndex' | 'buffIndex' | 'debuffIndex';
    const currentIndex = pool[indexKey];
    const tweet = tweets[currentIndex];
    pool[indexKey] = (currentIndex + 1) % tweets.length;

    // Generate a fresh ID for each returned tweet to ensure uniqueness
    // even when multiple enemies share the same base ID and tweet pool
    return { ...tweet, id: generateTweetId(), timestamp: 'just now' };
}

/**
 * Get enemy defeat tweet
 */
export function getEnemyDefeatTweetProgressive(
    meso: MesoNarrative,
    enemyId: string
): NarrativeTweet | null {
    // Extract base enemy ID
    const parts = enemyId.split('_');
    const baseIdParts: string[] = [];
    for (const part of parts) {
        if (/^\d{10,}$/.test(part)) break;
        baseIdParts.push(part);
    }
    const baseEnemyId = baseIdParts.join('_') || enemyId;

    const pool = meso.enemyIntentTweets[baseEnemyId];
    if (!pool) return null;

    // Generate a fresh ID for uniqueness
    return { ...pool.defeat, id: generateTweetId(), timestamp: 'just now' };
}

/**
 * Get card play reaction tweet (cycles)
 */
export function getCardPlayTweet(
    meso: MesoNarrative,
    cardType: 'attack' | 'skill' | 'power'
): NarrativeTweet | null {
    const pool = meso.cardPlayTweets;
    const tweets = pool[cardType];

    if (!tweets || tweets.length === 0) return null;

    const indexKey = `${cardType}Index` as 'attackIndex' | 'skillIndex' | 'powerIndex';
    const currentIndex = pool[indexKey];
    const tweet = tweets[currentIndex];
    pool[indexKey] = (currentIndex + 1) % tweets.length;

    // Generate a fresh ID for uniqueness
    return { ...tweet, id: generateTweetId(), timestamp: 'just now' };
}

/**
 * Get path preview for a node
 */
export function getPathPreview(meso: MesoNarrative, nodeId: string): PathPreview | null {
    return meso.pathPreviews.find(p => p.nodeId === nodeId) || null;
}
