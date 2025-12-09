// ============================================
// NARRATIVE SERVICE - Gemini API Integration
// ============================================
// Generates immersive startup narrative via AI

import {
    StartupContext,
    ActNarrative,
    NarrativeTweet,
    EnemyTweetPool,
    StoryBeat,
    NARRATIVE_SCHEMA,
    NARRATIVE_ENEMY_IDS
} from './narrativeTypes.ts';

// ============================================
// CONFIGURATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Get Gemini API key from localStorage
 */
export function getGeminiApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gemini_api_key');
}

/**
 * Save Gemini API key to localStorage
 */
export function setGeminiApiKey(apiKey: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('gemini_api_key', apiKey);
    }
}

/**
 * Check if API key is configured
 */
export function hasGeminiApiKey(): boolean {
    return !!getGeminiApiKey();
}

// ============================================
// PROMPT ENGINEERING
// ============================================

/**
 * Build the system prompt for narrative generation
 */
function buildSystemPrompt(): string {
    return `You are a startup narrative generator for a roguelike game called "Burn Rate: The Unicorn Run".

The game follows a startup founder through Act 1: Finding Product-Market Fit & MVP launch.

Your job is to generate authentic, immersive Twitter-style tweets that tell the story of this startup journey.

CRITICAL LANGUAGE RULES:
1. NO HASHTAGS EVER. Do not use # symbols or hashtag words. They look spammy and break immersion.
2. Write like you're explaining to a smart 12-year-old who plays video games.
3. Use SHORT sentences. Keep it punchy and easy to scan quickly.
4. Be CONVERSATIONAL - like texting a friend, not writing an essay.
5. Avoid complex business jargon. If you must use startup terms, make them obvious in context.
   - Instead of "We achieved PMF" → "People actually WANT this thing!"
   - Instead of "Runway is depleting" → "Money's running out fast"
   - Instead of "Pivoting our value proposition" → "Changing direction"

STYLE GUIDELINES:
1. Tweets should feel like REAL social media - relatable, sometimes funny, sometimes tense
2. Each tweet must be under 280 characters
3. Enemies are startup problems personified - make their trash-talk feel like a bully, not a business textbook
4. Victory tweets should feel EARNED - like beating a tough boss in a video game
5. Mix tones: some tweets are dramatic, some are jokes, some hit you in the feels

ENEMY CONTEXT (startup problems as villain characters):
- Feature Creep: The "just one more thing" monster that never lets you finish
- The Doubter: Spreads fear and makes everyone second-guess the plan
- The Naysayer: The "it'll never work" pessimist who kills motivation
- The Procrastinator: Everything takes forever, deadlines slip away
- The Copycat: Steals ideas and does it cheaper
- Scope Creep (Elite): Turns a simple project into an impossible nightmare
- Burnout (Elite): Pure exhaustion that makes you want to quit
- The VC Gauntlet (Boss): The ultimate investor meeting - survive or die

STORY ARC for Act 1:
- Floor 1-5: The dream begins - hope, excitement, maybe some butterflies
- Floor 6-10: Building mode - late nights, setbacks, things get real
- Floor 11-14: Crunch time - everything's on the line, do or die
- Floor 15-16 (Boss): The big pitch - one shot at making it`
}

/**
 * Build the user prompt for narrative generation
 */
function buildUserPrompt(context: StartupContext): string {
    const enemyList = NARRATIVE_ENEMY_IDS.map(id => `"${id}"`).join(', ');

    return `Generate a complete narrative for this startup's Act 1 journey:

STARTUP NAME: ${context.name}
ONE-LINER: ${context.oneLiner}

IMPORTANT REMINDERS:
- NO HASHTAGS. Never use # symbols anywhere.
- Keep language simple and punchy. Short sentences win.
- Enemy tweets should be mean but easy to understand - like a schoolyard bully, not a business consultant.

Generate the following:

1. THEME: A catchy phrase for Act 1 (e.g., "The Hunt Begins" or "Finding Our First Fans")

2. INTRO TWEET: Startup announcing their journey begins (excited, hopeful)

3. VICTORY TWEET: Startup celebrating beating Act 1 boss (huge relief, celebration vibes)

4. DEFEAT TWEET: Startup announcing shutdown (sad but dignified)

5. STORY BEATS (6 total):
   - Floor 1-3, floor_start: The adventure begins
   - Floor 4-6, floor_end: Small wins or growing doubts
   - Floor 7-9, elite_encounter: A big scary challenge appears
   - Floor 10-12, rest_site: A moment to breathe
   - Floor 13-14, floor_start: The final push begins
   - Floor 15, boss_encounter: Standing at the gates of the big meeting

6. ENEMY TWEET POOLS for each of these enemies: [${enemyList}]
   Each pool = tweets where the ENEMY publicly trash-talks ${context.name}.
   These are public posts mocking the startup, NOT @replying to anyone.
   Think: villain monologue meets mean tweet.
   
   For each enemy, generate:
   - 5 attackTweets (enemy mocking the startup's doom)
   - 3 buffTweets (enemy celebrating as problems multiply)  
   - 3 debuffTweets (enemy mocking the exhausted team)
   - 1 defeatTweet (startup celebrating after defeating this problem)

Make handles start with "@" and fit the character.
Engagement counts: enemies get low numbers, victories get high numbers.`;
}

// ============================================
// API CALL
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
 * Call Gemini API with structured output
 */
async function callGeminiAPI(context: StartupContext, apiKey: string): Promise<any> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[GEMINI] 🚀 Starting API call...');
    console.log('[GEMINI] Startup:', context.name, '-', context.oneLiner);
    console.log('[GEMINI] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('[GEMINI] URL:', GEMINI_API_URL);

    const userPrompt = buildUserPrompt(context);
    const systemPrompt = buildSystemPrompt();

    console.log('[GEMINI] System prompt length:', systemPrompt.length, 'chars');
    console.log('[GEMINI] User prompt length:', userPrompt.length, 'chars');
    console.log('[GEMINI] User prompt preview:', userPrompt.substring(0, 200) + '...');

    const requestBody = {
        contents: [{
            parts: [{
                text: userPrompt
            }]
        }],
        systemInstruction: {
            parts: [{
                text: systemPrompt
            }]
        },
        generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: NARRATIVE_SCHEMA,
            temperature: 0.9,
            maxOutputTokens: 32768
        }
    };

    console.log('[GEMINI] 📤 Sending request...');
    console.log('[GEMINI] Request body size:', JSON.stringify(requestBody).length, 'bytes');

    try {
        const startTime = Date.now();
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const elapsed = Date.now() - startTime;
        console.log('[GEMINI] 📥 Response received in', elapsed, 'ms');
        console.log('[GEMINI] Status:', response.status, response.statusText);

        if (!response.ok) {
            const error = await response.text();
            console.error('[GEMINI] ❌ API Error:', error);
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data: GeminiResponse = await response.json();
        console.log('[GEMINI] ✅ JSON parsed successfully');
        console.log('[GEMINI] Candidates count:', data.candidates?.length || 0);

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('[GEMINI] ❌ Invalid response structure:', JSON.stringify(data).substring(0, 500));
            throw new Error('Invalid response from Gemini API');
        }

        const rawText = data.candidates[0].content.parts[0].text;
        console.log('[GEMINI] Response text length:', rawText.length, 'chars');
        console.log('[GEMINI] Response preview:', rawText.substring(0, 300) + '...');

        const parsed = JSON.parse(rawText);
        console.log('[GEMINI] ✅ Response JSON parsed');
        console.log('[GEMINI] Theme:', parsed.theme);
        console.log('[GEMINI] Enemy pools:', parsed.enemyTweetPools?.length || 0);
        console.log('[GEMINI] Story beats:', parsed.storyBeats?.length || 0);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return parsed;
    } catch (error) {
        console.error('[GEMINI] ❌ EXCEPTION:', error);
        console.error('[GEMINI] Stack:', (error as Error).stack);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        throw error;
    }
}

// ============================================
// NARRATIVE GENERATION
// ============================================

let tweetIdCounter = 0;

function generateTweetId(): string {
    return `tweet_${++tweetIdCounter}_${Date.now()}`;
}

function addTweetId(tweet: Omit<NarrativeTweet, 'id'>): NarrativeTweet {
    return { ...tweet, id: generateTweetId() };
}

/**
 * Transform API response into ActNarrative structure
 */
function transformApiResponse(raw: any, context: StartupContext): ActNarrative {
    // Transform story beats
    const storyBeats: StoryBeat[] = (raw.storyBeats || []).map((beat: any) => ({
        id: generateTweetId(),
        floorRange: [beat.floorMin, beat.floorMax] as [number, number],
        trigger: beat.trigger,
        tweet: addTweetId({ ...beat.tweet, timestamp: 'just now' }),
        shown: false
    }));

    // Transform enemy pools
    const enemyTweetPools: EnemyTweetPool[] = (raw.enemyTweetPools || []).map((pool: any) => ({
        enemyId: pool.enemyId,
        enemyName: pool.enemyName,
        attackTweets: (pool.attackTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        buffTweets: (pool.buffTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        debuffTweets: (pool.debuffTweets || []).map((t: any) => addTweetId({ ...t, timestamp: 'just now' })),
        defeatTweet: addTweetId({ ...pool.defeatTweet, timestamp: 'just now', isVictory: true }),
        attackTweetIndex: 0,
        buffTweetIndex: 0,
        debuffTweetIndex: 0
    }));

    return {
        actNumber: 1,
        theme: raw.theme || "The Hunt for Product-Market Fit",
        startupContext: context,
        enemyTweetPools,
        storyBeats,
        introTweet: addTweetId({ ...raw.introTweet, timestamp: 'just now' }),
        victoryTweet: addTweetId({ ...raw.victoryTweet, timestamp: 'just now', isVictory: true }),
        defeatTweet: addTweetId({ ...raw.defeatTweet, timestamp: 'just now', isDefeat: true })
    };
}

/**
 * Generate complete Act narrative using Gemini API
 */
export async function generateActNarrative(
    context: StartupContext,
    actNumber: 1 | 2 | 3 = 1
): Promise<ActNarrative> {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    console.log('[Narrative] Generating Act', actNumber, 'narrative for:', context.name);

    const rawResponse = await callGeminiAPI(context, apiKey);
    console.log('[Narrative] Received response from Gemini');

    const narrative = transformApiResponse(rawResponse, context);
    console.log('[Narrative] Generated', narrative.enemyTweetPools.length, 'enemy pools and', narrative.storyBeats.length, 'story beats');

    return narrative;
}

// ============================================
// NARRATIVE ACCESSORS
// ============================================

/**
 * Get next attack tweet for an enemy (cycles through pool)
 */
export function getEnemyAttackTweet(
    narrative: ActNarrative,
    enemyId: string
): NarrativeTweet | null {
    return getEnemyTweetByIntent(narrative, enemyId, 'attack');
}

/**
 * Get tweet for an enemy based on their INTENT TYPE
 * This shows contextual trash-talk matching what the enemy is about to do
 */
export function getEnemyTweetByIntent(
    narrative: ActNarrative,
    enemyId: string,
    intentType: 'attack' | 'buff' | 'debuff' | 'defend' | 'unknown'
): NarrativeTweet | null {
    const pool = narrative.enemyTweetPools.find(p => p.enemyId === enemyId);

    if (!pool) {
        console.warn('[Narrative] No tweet pool found for enemy:', enemyId);
        return null;
    }

    // Select appropriate tweet pool based on intent
    let tweetArray: NarrativeTweet[];
    let indexKey: 'attackTweetIndex' | 'buffTweetIndex' | 'debuffTweetIndex';

    switch (intentType) {
        case 'buff':
            tweetArray = pool.buffTweets;
            indexKey = 'buffTweetIndex';
            break;
        case 'debuff':
            tweetArray = pool.debuffTweets;
            indexKey = 'debuffTweetIndex';
            break;
        case 'attack':
        case 'defend':
        case 'unknown':
        default:
            tweetArray = pool.attackTweets;
            indexKey = 'attackTweetIndex';
            break;
    }

    if (!tweetArray || tweetArray.length === 0) {
        // Fallback to attack tweets if specific type not available
        tweetArray = pool.attackTweets;
        indexKey = 'attackTweetIndex';
    }

    if (tweetArray.length === 0) {
        return null;
    }

    // Get current tweet and advance index
    const currentIndex = pool[indexKey];
    const tweet = tweetArray[currentIndex];
    pool[indexKey] = (currentIndex + 1) % tweetArray.length;

    // Update timestamp
    return { ...tweet, timestamp: 'just now' };
}

/**
 * Get defeat/victory tweet when enemy is killed
 */
export function getEnemyDefeatTweet(
    narrative: ActNarrative,
    enemyId: string
): NarrativeTweet | null {
    const pool = narrative.enemyTweetPools.find(p => p.enemyId === enemyId);

    if (!pool) {
        console.warn('[Narrative] No tweet pool found for enemy:', enemyId);
        return null;
    }

    return { ...pool.defeatTweet, timestamp: 'just now' };
}

/**
 * Get story beat tweet for current game state
 */
export function getStoryBeatTweet(
    narrative: ActNarrative,
    floor: number,
    trigger: string
): NarrativeTweet | null {
    const beat = narrative.storyBeats.find(b =>
        !b.shown &&
        floor >= b.floorRange[0] &&
        floor <= b.floorRange[1] &&
        b.trigger === trigger
    );

    if (beat) {
        beat.shown = true;
        return { ...beat.tweet, timestamp: 'just now' };
    }

    return null;
}

/**
 * Create fallback narrative for when API is unavailable
 */
export function createFallbackNarrative(context: StartupContext): ActNarrative {
    const createTweet = (
        author: NarrativeTweet['author'],
        content: string,
        handle: string,
        name: string,
        emoji: string,
        likes = 10,
        retweets = 2,
        replies = 1
    ): NarrativeTweet => ({
        id: generateTweetId(),
        author,
        handle,
        displayName: name,
        avatarEmoji: emoji,
        content,
        timestamp: 'just now',
        likes,
        retweets,
        replies
    });

    const startupHandle = `@${context.name.toLowerCase().replace(/\s+/g, '_')}`;

    return {
        actNumber: 1,
        theme: "The Hunt for Product-Market Fit",
        startupContext: context,
        introTweet: createTweet(
            'startup',
            `Day 1 of building ${context.name}. ${context.oneLiner}. Let's see if anyone actually wants this 🚀`,
            startupHandle,
            context.name,
            '🚀',
            42, 8, 5
        ),
        victoryTweet: createTweet(
            'startup',
            `WE DID IT! ${context.name} just closed our seed round! 🦄 Time to scale!`,
            startupHandle,
            context.name,
            '🦄',
            1200, 340, 89
        ),
        defeatTweet: createTweet(
            'startup',
            `Hard to write this... ${context.name} is shutting down. Ran out of runway. Thanks to everyone who believed in us. 💔`,
            startupHandle,
            context.name,
            '💔',
            890, 45, 234
        ),
        storyBeats: [],
        enemyTweetPools: NARRATIVE_ENEMY_IDS.map(enemyId => {
            // Create varied attack tweets - mocking the company's failures
            const attackMessages = [
                `Your little "${context.oneLiner}" thing? Not gonna happen. 😈`,
                `Lol another ${context.name} wannabe. How cute. 🙄`,
                `Nobody asked for "${context.oneLiner}". Just saying. 💀`,
                `Watched ${context.name}'s demo. I want those 5 minutes back. 📉`,
                `${context.name} is basically just Theranos for ${context.oneLiner.split(' ').slice(-2).join(' ')}. Change my mind. 🤡`,
            ];

            // Buff tweets - celebrating the startup's multiplying problems
            const buffMessages = [
                `${context.name}'s problems are multiplying. You love to see it 📈`,
                `The ${context.name} situation getting worse by the hour. Nature is healing 🌱`,
                `${context.name} thought they had it figured out. LOL. 😂`,
            ];

            // Debuff tweets - mocking the exhausted/struggling team
            const debuffMessages = [
                `${context.name} team looking EXHAUSTED. Maybe pivot to a job at Google? 😴`,
                `Watching ${context.name}'s velocity drop in real-time. Burnout incoming ⚠️`,
                `${context.name} founders probably regretting that "hustle culture" tweet rn 💀`,
            ];

            return {
                enemyId,
                enemyName: enemyId.replace(/_/g, ' '),
                attackTweets: attackMessages.map((msg, i) =>
                    createTweet('enemy', msg, '@hater', 'Hater', '😈', 3 + i, i, 1)
                ),
                buffTweets: buffMessages.map((msg, i) =>
                    createTweet('enemy', msg, '@doubter', 'Doubter', '📈', 5 + i, i, 2)
                ),
                debuffTweets: debuffMessages.map((msg, i) =>
                    createTweet('enemy', msg, '@burnout_watch', 'Burnout Watch', '😴', 8 + i, i, 3)
                ),
                defeatTweet: createTweet('startup', `Another problem solved! ${context.name} keeps shipping 💪`, startupHandle, context.name, '✅', 25, 4, 2),
                attackTweetIndex: 0,
                buffTweetIndex: 0,
                debuffTweetIndex: 0
            };
        })
    };
}
