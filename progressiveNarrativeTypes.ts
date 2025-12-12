// ============================================
// PROGRESSIVE NARRATIVE TYPES
// ============================================
// Three-layer progressive generation system:
// - MACRO: Act-level theme, voice, intro/defeat tweets, floor beats
// - MESO: Per-node story beats, enemy tweets, card reactions
// - MICRO: Card play reactions (included in MESO generation)

import { NarrativeTweet, StartupContext, TweetAuthorType } from './narrativeTypes';

// ============================================
// PLAYER ROLE SYSTEM
// ============================================
// Parametrized roles that shape the narrative angle

/**
 * Player role determines the narrative perspective and card flavor
 */
export type PlayerRole = 'cto' | 'ceo' | 'coo';

/**
 * Role context that shapes how the narrative is generated
 */
export interface RoleContext {
    title: string;          // "CTO / Technical Co-Founder"
    focus: string;          // What this role cares about
    strategy: string;       // How they approach problems
    voice: string;          // How they tweet
    cardFlavor: string;     // What their actions represent
    victoryStyle: string;   // How they celebrate wins
}

/**
 * Role-specific context for narrative generation
 */
export const ROLE_CONTEXT: Record<PlayerRole, RoleContext> = {
    cto: {
        title: "CTO / Technical Co-Founder",
        focus: "Building the product, shipping features, technical excellence",
        strategy: "Move fast with clean code - velocity through iteration",
        voice: "Builder energy - celebrates shipping, debugging wins, clean architecture",
        cardFlavor: "Commits, deploys, refactors - the language of shipping software",
        victoryStyle: "Celebrates shipping, hitting metrics, solving hard problems"
    },
    ceo: {
        title: "CEO / Founder",
        focus: "Vision, fundraising, team building, market strategy",
        strategy: "Inspire, pitch, lead - rally the team and investors",
        voice: "Visionary storyteller - celebrates milestones, team wins, market validation",
        cardFlavor: "Pitches, partnerships, pivots - the language of leading",
        victoryStyle: "Celebrates team wins, funding milestones, market traction"
    },
    coo: {
        title: "COO / Operations Lead",
        focus: "Processes, efficiency, scaling, execution",
        strategy: "Optimize and systematize - build repeatable processes",
        voice: "Operator mindset - celebrates efficiency gains, smooth operations",
        cardFlavor: "Workflows, metrics, automation - the language of scaling",
        victoryStyle: "Celebrates efficiency gains, process improvements, hitting OKRs"
    }
};

// ============================================
// MACRO LAYER - Act Level (Generated Once)
// ============================================

/**
 * Story phase for floor progression
 * Maps to the emotional arc of Act 1: Finding PMF → MVP Launch
 */
export type StoryPhase = 'hope' | 'grind' | 'doubt' | 'breakthrough' | 'climax';

/**
 * Narrative devices that can be used to enhance storytelling
 */
export type NarrativeDevice =
    | 'foreshadowing'      // Hint at future challenges
    | 'callback'           // Reference earlier events
    | 'tension_escalation' // Build dramatic tension
    | 'moment_of_doubt'    // Character questions their journey
    | 'small_victory'      // Minor win that builds momentum
    | 'setback'            // Things go wrong
    | 'revelation'         // Important insight gained
    | 'cliffhanger'        // Leave something unresolved
    | 'turning_point'      // Story direction changes
    | 'stakes_raising'     // Consequences become clearer
    | 'comic_relief'       // Brief moment of levity
    | 'ally_appears'       // Help arrives (customer, mentor, etc.)
    | 'dark_moment'        // Lowest point before breakthrough
    | 'payoff';            // Earlier setup pays off

/**
 * Emotional trajectory for a floor's story arc
 */
export type EmotionalArc =
    | 'hopeful_to_challenged'     // Hope phase floors
    | 'determined_to_tired'       // Grind phase floors
    | 'anxious_to_desperate'      // Doubt phase floors
    | 'desperate_to_hopeful'      // Breakthrough phase
    | 'tense_to_triumphant';      // Climax phase

/**
 * Per-floor story beat that guides MESO generation
 * Each floor has a complete mini-arc: setup → conflict → resolution
 */
export interface FloorBeat {
    floor: number;                    // 1-16
    storyPhase: StoryPhase;

    // Mini-arc structure for this floor
    setup: string;                    // "The day begins with a promising email"
    conflict: string;                 // "But the meeting reveals unexpected competition"
    resolution: string;               // "You leave with a new strategy forming"

    // Legacy fields for backward compatibility
    storyBeat: string;                // Combined one-liner (setup → conflict)
    narrativeHook: string;            // Emotional hook for the player

    // Narrative enhancement
    primaryDevice: NarrativeDevice;   // Main storytelling technique for this floor
    secondaryDevice?: NarrativeDevice; // Optional secondary device
    emotionalArc: EmotionalArc;       // How emotions shift during this floor

    // Story continuity
    callbackFrom?: number;            // Reference to earlier floor (for callbacks)
    foreshadowsFloor?: number;        // Hints at future floor
    stakes: string;                   // What's at risk ("Your first customer", "The team's morale")
}

/**
 * Startup voice/tone generated from context
 */
export type StartupTone = 'scrappy' | 'professional' | 'quirky' | 'serious';

/**
 * MACRO narrative - Generated ONCE at new game
 * Establishes the unique narrative arc for this run
 */
export interface MacroNarrative {
    theme: string;                    // "The Underdog's Rise"
    startupHandle: string;            // "@gigglelearn"
    startupEmoji: string;             // "📚"
    startupTone: StartupTone;

    // Key story tweets
    introTweet: NarrativeTweet;       // Day 1 announcement
    defeatTweet: NarrativeTweet;      // Game over tweet
    bossVictoryTweet: NarrativeTweet; // Act completion celebration

    // Per-floor story beats - one-liner prompts for MESO generation
    floorBeats: FloorBeat[];          // 16 entries (floors 1-16)
}

// ============================================
// MESO LAYER - Node Level (Generated Per Node)
// ============================================

/**
 * Enemy intent tweet pools for a specific enemy in a specific fight
 */
export interface EnemyIntentTweets {
    attack: NarrativeTweet[];         // 2-3 attack tweets
    buff: NarrativeTweet[];           // 1-2 buff tweets
    debuff: NarrativeTweet[];         // 1-2 debuff tweets  
    defeat: NarrativeTweet;           // Victory over this enemy
    // Cycling indices
    attackIndex: number;
    buffIndex: number;
    debuffIndex: number;
}

/**
 * Card type reactions for MICRO layer (included in MESO)
 * Single tweet per card type - displayed immediately like a Pokemon move
 */
export interface CardPlayTweets {
    attack: NarrativeTweet;           // Single attack card tweet
    skill: NarrativeTweet;            // Single skill card tweet
    power: NarrativeTweet;            // Single power card tweet
}

/**
 * Path preview for map decision tooltips
 */
export interface PathPreview {
    nodeId: string;
    teaser: string;                   // "Technical Debt is piling up..."
    decisionHint: string;             // "Pay it down now or keep shipping?"
}

/**
 * MESO narrative - Generated PER NODE before combat
 * Creates the story beat that makes each fight unique
 */
export interface MesoNarrative {
    nodeId: string;                   // Map node ID
    floor: number;
    nodeType: string;                 // 'problem', 'elite', 'boss', etc.

    // Story tweets for this node
    approachTweet: NarrativeTweet;    // Sets up the challenge
    victoryTweet: NarrativeTweet;     // Celebration after winning

    // Founder turn-end tweets (displayed when player ends turn)
    turnEndTweets: NarrativeTweet[];  // 2-3 tweets for turn end
    turnEndIndex: number;             // Cycling index

    // Per-enemy tweets by enemy ID
    enemyIntentTweets: Record<string, EnemyIntentTweets>;

    // MICRO layer: Card play reactions
    cardPlayTweets: CardPlayTweets;

    // Path previews for next connected nodes
    pathPreviews: PathPreview[];
}

// ============================================
// ENEMY MEMORY SYSTEM (Character Persistence)
// ============================================

/**
 * Track enemy encounters for callback lines
 * Creates "We meet again" moments for repeat enemies
 */
export interface EnemyMemory {
    enemyId: string;
    encounterCount: number;
    lastFloor: number;
    wasDefeated: boolean;  // Did player overcome this enemy?
}

// ============================================
// PROGRESSIVE STATE
// ============================================

/**
 * Complete progressive narrative state
 */
export interface ProgressiveNarrativeState {
    startupContext: StartupContext;
    macro: MacroNarrative | null;
    mesoCache: Map<string, MesoNarrative>;  // nodeId -> narrative
    currentMeso: MesoNarrative | null;
    isGenerating: boolean;
    generationError: string | null;
}

// ============================================
// GEMINI API SCHEMAS
// ============================================

/**
 * Tweet schema for Gemini structured output
 */
const TWEET_SCHEMA = {
    type: "object",
    properties: {
        author: { type: "string" },
        handle: { type: "string" },
        displayName: { type: "string" },
        avatarEmoji: { type: "string" },
        content: { type: "string" },
        likes: { type: "integer" },
        retweets: { type: "integer" },
        replies: { type: "integer" }
    },
    required: ["author", "handle", "displayName", "avatarEmoji", "content", "likes", "retweets", "replies"]
};

/**
 * Floor beat schema for MACRO generation
 */
const FLOOR_BEAT_SCHEMA = {
    type: "object",
    properties: {
        floor: { type: "integer" },
        storyBeat: { type: "string" },
        narrativeHook: { type: "string" },
        storyPhase: { type: "string" }
    },
    required: ["floor", "storyBeat", "narrativeHook", "storyPhase"]
};

/**
 * MACRO layer schema - Fast, focused generation (~3-5 seconds)
 * Generated ONCE at new game
 */
export const MACRO_SCHEMA = {
    type: "object",
    properties: {
        theme: { type: "string" },
        startupHandle: { type: "string" },
        startupEmoji: { type: "string" },
        startupTone: { type: "string" },
        introTweet: TWEET_SCHEMA,
        defeatTweet: TWEET_SCHEMA,
        bossVictoryTweet: TWEET_SCHEMA,
        floorBeats: {
            type: "array",
            items: FLOOR_BEAT_SCHEMA
        }
    },
    required: ["theme", "startupHandle", "startupEmoji", "startupTone",
        "introTweet", "defeatTweet", "bossVictoryTweet", "floorBeats"]
};

/**
 * Enemy intent tweets schema for MESO
 */
const ENEMY_INTENT_TWEETS_SCHEMA = {
    type: "object",
    properties: {
        enemyId: { type: "string" },
        attackTweets: { type: "array", items: TWEET_SCHEMA },
        buffTweets: { type: "array", items: TWEET_SCHEMA },
        debuffTweets: { type: "array", items: TWEET_SCHEMA },
        defeatTweet: TWEET_SCHEMA
    },
    required: ["enemyId", "attackTweets", "buffTweets", "debuffTweets", "defeatTweet"]
};

/**
 * Path preview schema
 */
const PATH_PREVIEW_SCHEMA = {
    type: "object",
    properties: {
        nodeId: { type: "string" },
        teaser: { type: "string" },
        decisionHint: { type: "string" }
    },
    required: ["nodeId", "teaser", "decisionHint"]
};

/**
 * MESO layer schema - Per-node generation (~5 seconds)
 * Generated for each combat node
 */
export const MESO_SCHEMA = {
    type: "object",
    properties: {
        approachTweet: TWEET_SCHEMA,
        victoryTweet: TWEET_SCHEMA,
        turnEndTweets: {
            type: "array",
            items: TWEET_SCHEMA
        },
        enemyIntentTweets: {
            type: "array",
            items: ENEMY_INTENT_TWEETS_SCHEMA
        },
        cardPlayTweets: {
            type: "object",
            properties: {
                attackTweet: TWEET_SCHEMA,
                skillTweet: TWEET_SCHEMA,
                powerTweet: TWEET_SCHEMA
            },
            required: ["attackTweet", "skillTweet", "powerTweet"]
        },
        pathPreviews: {
            type: "array",
            items: PATH_PREVIEW_SCHEMA
        }
    },
    required: ["approachTweet", "victoryTweet", "turnEndTweets", "enemyIntentTweets", "cardPlayTweets", "pathPreviews"]
};

// ============================================
// CONSTANTS
// ============================================

/**
 * Default floor beats for fallback (if MACRO fails)
 * Follows the Act 1 story arc: Finding PMF → MVP Launch
 * Each floor has a complete mini-arc with narrative devices
 */
export const DEFAULT_FLOOR_BEATS: FloorBeat[] = [
    // ===== HOPE PHASE (Floors 1-4) =====
    // The dream begins, first steps, nervous excitement
    {
        floor: 1,
        storyPhase: 'hope',
        setup: "You quit your job. The idea burns bright.",
        conflict: "But the first day alone feels terrifying.",
        resolution: "You write the first line of code anyway.",
        storyBeat: "The idea sparks to life",
        narrativeHook: "Day one. Everything feels possible.",
        primaryDevice: 'foreshadowing',
        foreshadowsFloor: 9,  // Foreshadows the runway crisis
        emotionalArc: 'hopeful_to_challenged',
        stakes: "Your dream of being a founder"
    },
    {
        floor: 2,
        storyPhase: 'hope',
        setup: "The prototype is taking shape.",
        conflict: "Nothing works the way you imagined.",
        resolution: "But you see a glimmer of what it could be.",
        storyBeat: "First lines of code written",
        narrativeHook: "Building something from nothing.",
        primaryDevice: 'small_victory',
        emotionalArc: 'hopeful_to_challenged',
        stakes: "Proving the concept is even possible"
    },
    {
        floor: 3,
        storyPhase: 'hope',
        setup: "You have something to show.",
        conflict: "It's ugly. Really ugly.",
        resolution: "But... it works. Kind of.",
        storyBeat: "The prototype takes shape",
        narrativeHook: "It's ugly, but it works.",
        primaryDevice: 'revelation',
        foreshadowsFloor: 12,  // Foreshadows the first real user
        emotionalArc: 'hopeful_to_challenged',
        stakes: "The first working demo"
    },
    {
        floor: 4,
        storyPhase: 'hope',
        setup: "You show it to friends and family.",
        conflict: "Their feedback is... polite. Too polite.",
        resolution: "Someone actually signs up. For real.",
        storyBeat: "Early believers emerge",
        narrativeHook: "Mom says it's great. Does that count?",
        primaryDevice: 'ally_appears',
        secondaryDevice: 'comic_relief',
        emotionalArc: 'hopeful_to_challenged',
        stakes: "Your first real user (not your mom)"
    },

    // ===== GRIND PHASE (Floors 5-8) =====
    // Late nights, building, small setbacks
    {
        floor: 5,
        storyPhase: 'grind',
        setup: "The initial excitement fades.",
        conflict: "The work is harder than you thought.",
        resolution: "You find a rhythm, but it's exhausting.",
        storyBeat: "Reality sets in",
        narrativeHook: "Coffee becomes a food group.",
        primaryDevice: 'tension_escalation',
        callbackFrom: 1,  // Remember quitting your job?
        emotionalArc: 'determined_to_tired',
        stakes: "Your energy and motivation"
    },
    {
        floor: 6,
        storyPhase: 'grind',
        setup: "You ship a big update.",
        conflict: "Everything breaks. Users are angry.",
        resolution: "You fix it. Barely. At 3am.",
        storyBeat: "Bugs multiply overnight",
        narrativeHook: "Fixed one, broke three more.",
        primaryDevice: 'setback',
        secondaryDevice: 'tension_escalation',
        emotionalArc: 'determined_to_tired',
        stakes: "User trust and your sanity"
    },
    {
        floor: 7,
        storyPhase: 'grind',
        setup: "You're making progress.",
        conflict: "Then you see THEM. A well-funded competitor.",
        resolution: "You decide speed is your advantage.",
        storyBeat: "Competition appears",
        narrativeHook: "They have funding. You have determination.",
        primaryDevice: 'stakes_raising',
        foreshadowsFloor: 16,  // The final pitch will matter more
        emotionalArc: 'determined_to_tired',
        stakes: "Market position before they catch up"
    },
    {
        floor: 8,
        storyPhase: 'grind',
        setup: "User feedback is confusing.",
        conflict: "Half want feature A, half want B. Neither aligns with your vision.",
        resolution: "You make a choice. Time will tell if it's right.",
        storyBeat: "The pivot question looms",
        narrativeHook: "Is this the right direction?",
        primaryDevice: 'moment_of_doubt',
        secondaryDevice: 'cliffhanger',
        foreshadowsFloor: 11,  // This doubt will deepen
        emotionalArc: 'determined_to_tired',
        stakes: "Your entire product direction"
    },

    // ===== DOUBT PHASE (Floors 9-11) =====
    // Things get hard, questioning everything
    {
        floor: 9,
        storyPhase: 'doubt',
        setup: "You check the bank account.",
        conflict: "The numbers are worse than you remembered.",
        resolution: "You have weeks, not months.",
        storyBeat: "Runway shrinks fast",
        narrativeHook: "The numbers don't lie.",
        primaryDevice: 'stakes_raising',
        callbackFrom: 1,  // Payoff of foreshadowing
        secondaryDevice: 'tension_escalation',
        emotionalArc: 'anxious_to_desperate',
        stakes: "Your company's survival - literally"
    },
    {
        floor: 10,
        storyPhase: 'doubt',
        setup: "The team is quiet.",
        conflict: "People are burning out. Someone asks about job security.",
        resolution: "You give a speech you're not sure you believe.",
        storyBeat: "Team morale wavers",
        narrativeHook: "Late nights take their toll.",
        primaryDevice: 'dark_moment',
        secondaryDevice: 'moment_of_doubt',
        emotionalArc: 'anxious_to_desperate',
        stakes: "Your team staying together"
    },
    {
        floor: 11,
        storyPhase: 'doubt',
        setup: "You wake up at 4am with a pit in your stomach.",
        conflict: "Maybe the doubters were right. Maybe this won't work.",
        resolution: "But then... a notification. Someone new signed up.",
        storyBeat: "The darkest hour",
        narrativeHook: "Maybe they were right to doubt.",
        primaryDevice: 'turning_point',
        callbackFrom: 8,  // The doubt from floor 8 payoff
        foreshadowsFloor: 12,  // Sets up the breakthrough
        emotionalArc: 'anxious_to_desperate',
        stakes: "Your belief in yourself"
    },

    // ===== BREAKTHROUGH PHASE (Floors 12-14) =====
    // Momentum, signs of traction
    {
        floor: 12,
        storyPhase: 'breakthrough',
        setup: "That new user? They LOVE it.",
        conflict: "They want to pay. You don't even have a payment system.",
        resolution: "You stay up all night to build one.",
        storyBeat: "A user loves it",
        narrativeHook: "One real fan changes everything.",
        primaryDevice: 'payoff',
        callbackFrom: 3,  // The ugly prototype paid off
        secondaryDevice: 'ally_appears',
        emotionalArc: 'desperate_to_hopeful',
        stakes: "Your first paying customer"
    },
    {
        floor: 13,
        storyPhase: 'breakthrough',
        setup: "That customer told a friend.",
        conflict: "Now there are 10 users. Then 50. You're not ready for this.",
        resolution: "It's chaotic, but you're growing.",
        storyBeat: "Word starts spreading",
        narrativeHook: "Organic growth. The dream.",
        primaryDevice: 'small_victory',
        secondaryDevice: 'tension_escalation',
        emotionalArc: 'desperate_to_hopeful',
        stakes: "Managing growth without breaking everything"
    },
    {
        floor: 14,
        storyPhase: 'breakthrough',
        setup: "You look at the graphs.",
        conflict: "The curve is going up. Not linear. Exponential.",
        resolution: "This might actually work. You allow yourself to believe.",
        storyBeat: "Metrics finally move",
        narrativeHook: "The hockey stick begins.",
        primaryDevice: 'revelation',
        secondaryDevice: 'payoff',
        callbackFrom: 7,  // Competition doesn't matter now
        emotionalArc: 'desperate_to_hopeful',
        stakes: "Proving you have product-market fit"
    },

    // ===== CLIMAX PHASE (Floors 15-16) =====
    // The big pitch, all or nothing
    {
        floor: 15,
        storyPhase: 'climax',
        setup: "An investor wants to meet.",
        conflict: "This is it. The meeting that could change everything.",
        resolution: "You prepare the pitch of your life.",
        storyBeat: "The big meeting awaits",
        narrativeHook: "Everything leads to this moment.",
        primaryDevice: 'stakes_raising',
        callbackFrom: 9,  // Runway is running out
        foreshadowsFloor: 16,  // Final boss coming
        emotionalArc: 'tense_to_triumphant',
        stakes: "Getting funded or running out of runway"
    },
    {
        floor: 16,
        storyPhase: 'climax',
        setup: "You walk into the room.",
        conflict: "The investors are skeptical. They've heard a thousand pitches.",
        resolution: "But you have something they don't: proof.",
        storyBeat: "Pitch day arrives",
        narrativeHook: "One shot. Make it count.",
        primaryDevice: 'payoff',
        secondaryDevice: 'turning_point',
        callbackFrom: 1,  // Full circle from day one
        emotionalArc: 'tense_to_triumphant',
        stakes: "Your startup's future"
    },
];
