// ============================================
// PROGRESSIVE NARRATIVE TYPES
// ============================================
// Three-layer progressive generation system:
// - MACRO: Act-level theme, voice, intro/defeat tweets, floor beats
// - MESO: Per-node story beats, enemy tweets, card reactions
// - MICRO: Card play reactions (included in MESO generation)

import { NarrativeTweet, StartupContext, TweetAuthorType } from './narrativeTypes';

// ============================================
// MACRO LAYER - Act Level (Generated Once)
// ============================================

/**
 * Story phase for floor progression
 * Maps to the emotional arc of Act 1: Finding PMF → MVP Launch
 */
export type StoryPhase = 'hope' | 'grind' | 'doubt' | 'breakthrough' | 'climax';

/**
 * Per-floor story beat that guides MESO generation
 * Like a one-line screenwriter's prompt for each floor
 */
export interface FloorBeat {
    floor: number;                    // 1-16
    storyBeat: string;                // "The first cold email goes unanswered"
    narrativeHook: string;            // "Rejection stings, but you keep going"
    storyPhase: StoryPhase;
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
 */
export interface CardPlayTweets {
    attack: NarrativeTweet[];         // 2-3 attack card reactions
    skill: NarrativeTweet[];          // 2-3 skill card reactions
    power: NarrativeTweet[];          // 2-3 power card reactions
    // Cycling indices
    attackIndex: number;
    skillIndex: number;
    powerIndex: number;
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

    // Per-enemy tweets by enemy ID
    enemyIntentTweets: Record<string, EnemyIntentTweets>;

    // MICRO layer: Card play reactions
    cardPlayTweets: CardPlayTweets;

    // Path previews for next connected nodes
    pathPreviews: PathPreview[];
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
        enemyIntentTweets: {
            type: "array",
            items: ENEMY_INTENT_TWEETS_SCHEMA
        },
        cardPlayTweets: {
            type: "object",
            properties: {
                attackTweets: { type: "array", items: TWEET_SCHEMA },
                skillTweets: { type: "array", items: TWEET_SCHEMA },
                powerTweets: { type: "array", items: TWEET_SCHEMA }
            },
            required: ["attackTweets", "skillTweets", "powerTweets"]
        },
        pathPreviews: {
            type: "array",
            items: PATH_PREVIEW_SCHEMA
        }
    },
    required: ["approachTweet", "victoryTweet", "enemyIntentTweets", "cardPlayTweets", "pathPreviews"]
};

// ============================================
// CONSTANTS
// ============================================

/**
 * Default floor beats for fallback (if MACRO fails)
 * Follows the Act 1 story arc: Finding PMF → MVP Launch
 */
export const DEFAULT_FLOOR_BEATS: FloorBeat[] = [
    // Hope phase (1-4)
    { floor: 1, storyBeat: "The idea sparks to life", narrativeHook: "Day one. Everything feels possible.", storyPhase: 'hope' },
    { floor: 2, storyBeat: "First lines of code written", narrativeHook: "Building something from nothing.", storyPhase: 'hope' },
    { floor: 3, storyBeat: "The prototype takes shape", narrativeHook: "It's ugly, but it works.", storyPhase: 'hope' },
    { floor: 4, storyBeat: "Early believers emerge", narrativeHook: "Mom says it's great. Does that count?", storyPhase: 'hope' },
    // Grind phase (5-8)
    { floor: 5, storyBeat: "Reality sets in", narrativeHook: "Coffee becomes a food group.", storyPhase: 'grind' },
    { floor: 6, storyBeat: "Bugs multiply overnight", narrativeHook: "Fixed one, broke three more.", storyPhase: 'grind' },
    { floor: 7, storyBeat: "Competition appears", narrativeHook: "They have funding. You have determination.", storyPhase: 'grind' },
    { floor: 8, storyBeat: "The pivot question looms", narrativeHook: "Is this the right direction?", storyPhase: 'grind' },
    // Doubt phase (9-11)
    { floor: 9, storyBeat: "Runway shrinks fast", narrativeHook: "The numbers don't lie.", storyPhase: 'doubt' },
    { floor: 10, storyBeat: "Team morale wavers", narrativeHook: "Late nights take their toll.", storyPhase: 'doubt' },
    { floor: 11, storyBeat: "The darkest hour", narrativeHook: "Maybe they were right to doubt.", storyPhase: 'doubt' },
    // Breakthrough phase (12-14)
    { floor: 12, storyBeat: "A user loves it", narrativeHook: "One real fan changes everything.", storyPhase: 'breakthrough' },
    { floor: 13, storyBeat: "Word starts spreading", narrativeHook: "Organic growth. The dream.", storyPhase: 'breakthrough' },
    { floor: 14, storyBeat: "Metrics finally move", narrativeHook: "The hockey stick begins.", storyPhase: 'breakthrough' },
    // Climax phase (15-16)
    { floor: 15, storyBeat: "The big meeting awaits", narrativeHook: "Everything leads to this moment.", storyPhase: 'climax' },
    { floor: 16, storyBeat: "Pitch day arrives", narrativeHook: "One shot. Make it count.", storyPhase: 'climax' },
];
