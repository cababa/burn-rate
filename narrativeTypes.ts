// ============================================
// NARRATIVE TYPES - AI-Generated Storytelling
// ============================================
// Types for Google Gemini structured output
// Enables immersive Twitter-style narrative

/**
 * Startup context from user input at run start
 */
export interface StartupContext {
    name: string;          // e.g., "Serial Flicks"
    oneLiner: string;      // e.g., "Netflix for book serials"
}

/**
 * Tweet author type for narrative variety
 */
export type TweetAuthorType =
    | 'startup'    // The player's startup celebrating/struggling
    | 'enemy'      // The current problem/enemy speaking
    | 'investor'   // VC perspective on the situation
    | 'customer'   // User/customer feedback
    | 'community'  // Tech Twitter commentary
    | 'cofounder'; // Team member perspective

/**
 * Individual tweet in the narrative timeline
 * Styled to look exactly like Twitter/X
 */
export interface NarrativeTweet {
    id: string;
    author: TweetAuthorType;
    handle: string;        // e.g., "@serial_flicks", "@angry_vc"
    displayName: string;   // e.g., "Serial Flicks 🎬", "The Doubter"
    avatarEmoji: string;   // e.g., "🎬", "🤨"
    content: string;       // The tweet text (max 280 chars)
    timestamp: string;     // e.g., "2h ago", "just now"
    likes: number;
    retweets: number;
    replies: number;
    isVictory?: boolean;   // True for victory celebration tweets
    isDefeat?: boolean;    // True for game over tweets
}

/**
 * Pre-generated pool of tweets for a specific enemy type
 * Generated at run start based on startup context
 * Organized by INTENT TYPE for contextual trash-talking
 */
export interface EnemyTweetPool {
    enemyId: string;        // Maps to EnemyData.id
    enemyName: string;      // For display, e.g., "The Doubter"
    // Intent-specific tweet pools (trash-talking the company)
    attackTweets: NarrativeTweet[];   // When enemy attacks
    buffTweets: NarrativeTweet[];     // When enemy buffs itself
    debuffTweets: NarrativeTweet[];   // When enemy debuffs player
    defeatTweet: NarrativeTweet;      // Victory tweet when player defeats enemy
    // Cycling indices
    attackTweetIndex: number;
    buffTweetIndex: number;
    debuffTweetIndex: number;
}

/**
 * Trigger types for story beats
 */
export type StoryBeatTrigger =
    | 'floor_start'       // Beginning of a floor
    | 'floor_end'         // Completed a floor
    | 'elite_encounter'   // About to fight elite
    | 'boss_encounter'    // About to fight boss
    | 'event_start'       // Random event triggered
    | 'rest_site';        // At retrospective node

/**
 * Story beat - narrative moment triggered at specific game points
 */
export interface StoryBeat {
    id: string;
    floorRange: [number, number];  // [min, max] floor range
    trigger: StoryBeatTrigger;
    tweet: NarrativeTweet;
    shown: boolean;                // Track if already displayed
}

/**
 * Complete narrative for an Act
 * Generated once at run start via Gemini API
 */
export interface ActNarrative {
    actNumber: 1 | 2 | 3;
    theme: string;                       // e.g., "Finding Product-Market Fit"
    startupContext: StartupContext;
    enemyTweetPools: EnemyTweetPool[];   // Pre-generated for each enemy type
    storyBeats: StoryBeat[];             // ~5-8 story progression tweets
    introTweet: NarrativeTweet;          // First tweet at run start
    victoryTweet: NarrativeTweet;        // End-of-act victory
    defeatTweet: NarrativeTweet;         // Game over tweet
}

/**
 * Narrative state persisted in GameState
 */
export interface NarrativeState {
    startupContext: StartupContext;
    actNarrative: ActNarrative | null;
    currentTweet: NarrativeTweet | null;
    tweetHistory: NarrativeTweet[];
    isGenerating: boolean;
    generationError: string | null;
}

/**
 * Gemini API structured output schema
 * Used to request JSON response in specific format
 * NOTE: Gemini doesn't support $ref/$defs, so all types are inlined
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

export const NARRATIVE_SCHEMA = {
    type: "object",
    properties: {
        theme: { type: "string" },
        introTweet: TWEET_SCHEMA,
        victoryTweet: TWEET_SCHEMA,
        defeatTweet: TWEET_SCHEMA,
        storyBeats: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    floorMin: { type: "integer" },
                    floorMax: { type: "integer" },
                    trigger: { type: "string" },
                    tweet: TWEET_SCHEMA
                },
                required: ["floorMin", "floorMax", "trigger", "tweet"]
            }
        },
        enemyTweetPools: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    enemyId: { type: "string" },
                    enemyName: { type: "string" },
                    attackTweets: { type: "array", items: TWEET_SCHEMA },
                    buffTweets: { type: "array", items: TWEET_SCHEMA },
                    debuffTweets: { type: "array", items: TWEET_SCHEMA },
                    defeatTweet: TWEET_SCHEMA
                },
                required: ["enemyId", "enemyName", "attackTweets", "buffTweets", "debuffTweets", "defeatTweet"]
            }
        }
    },
    required: ["theme", "introTweet", "victoryTweet", "defeatTweet", "storyBeats", "enemyTweetPools"]
};

/**
 * List of enemy IDs that need narrative content
 * Must match constants.ts enemy definitions
 */
export const NARRATIVE_ENEMY_IDS = [
    // Common enemies
    'fanboy',           // Feature Creep (Cultist)
    'spaghetti_code',   // The Copycat (Jaw Worm)
    'critical_bug',     // The Doubter (Louse Red)
    'minor_bug',        // The Naysayer (Louse Green)
    'quick_hack',       // The Shortcut Taker (Acid Slime S)
    'tech_debt',        // The Procrastinator (Acid Slime M)
    'legacy_module',    // The Old Guard (Acid Slime L)
    'hotfix',           // The Gambler (Spike Slime S)
    'bad_merge',        // The Firefighter (Spike Slime M)
    'memory_leak',      // The Energy Vampire (Spike Slime L)
    'micromanager',     // The Micromanager (Fungi Beast)
    'feature_pusher',   // The Yes-Man (Looter)
    'headhunter',       // The Poacher (Mugger)
    // Elites
    'scope_creep',      // Scope Creep (Gremlin Nob)
    'burnout',          // Burnout (Lagavulin)
    'pivot_master',     // The Pivot Master (Sentries)
    // Boss
    'investor_meeting', // The VC Gauntlet (Slime Boss)
];

/**
 * Preset startup ideas for quick selection
 */
export const STARTUP_PRESETS: StartupContext[] = [
    { name: "Serial Flicks", oneLiner: "Netflix for book serials" },
    { name: "CoffeeBot", oneLiner: "AI barista in your pocket" },
    { name: "PetMatch", oneLiner: "Tinder for pet adoption" },
    { name: "GiggleLearn", oneLiner: "TikTok meets education" },
    { name: "ChefShare", oneLiner: "Airbnb for home-cooked meals" },
    { name: "FitFam", oneLiner: "Peloton for friend groups" },
    { name: "PlantPal", oneLiner: "Duolingo for gardening" },
    { name: "SkillSwap", oneLiner: "LinkedIn meets Uber" },
];
