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
    StartupTone
} from './progressiveNarrativeTypes';
import { NarrativeTweet, StartupContext } from './narrativeTypes';
import { MapNode, MapLayer, EnemyData } from './types';

// ============================================
// CONFIGURATION
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

function buildMacroSystemPrompt(): string {
    return `You are a startup narrative generator for "Burn Rate: The Unicorn Run", a roguelike deckbuilder.

The game follows a startup founder through Act 1: Finding Product-Market Fit & MVP launch.

Your job is to generate the MACRO narrative layer - the overarching story arc for this run.

CRITICAL RULES:
1. NO HASHTAGS EVER. They break immersion.
2. Write for a smart 12-year-old. Short punchy sentences.
3. Be CONVERSATIONAL - like texting a friend.
4. Avoid complex jargon. Make startup terms obvious in context.

MACRO LAYER INCLUDES:
- Theme: A catchy phrase for the run's story arc
- Startup voice: Handle, emoji, tone
- Key tweets: Intro (Day 1), Defeat (Game Over), Boss Victory (Funded!)
- Floor beats: 16 one-liner story prompts that guide each floor's narrative

FLOOR BEAT STORY ARC:
- Floors 1-4 (hope): Dream begins, first steps, nervous excitement
- Floors 5-8 (grind): Late nights, building, small setbacks
- Floors 9-11 (doubt): Things get hard, questioning everything
- Floors 12-14 (breakthrough): Momentum, signs of traction
- Floors 15-16 (climax): The big pitch, all or nothing

Each floor beat should be:
- A one-liner that captures that moment in the journey
- On-brand for the specific startup
- Emotionally resonant with the story phase`;
}

function buildMacroUserPrompt(context: StartupContext): string {
    return `Generate the MACRO narrative layer for this startup:

STARTUP NAME: ${context.name}
ONE-LINER: ${context.oneLiner}

Generate:
1. THEME: A catchy phrase for this run's story arc (e.g., "The Underdog's Rise")
2. STARTUP HANDLE: Twitter handle for the startup (e.g., "@giggle_learn")
3. STARTUP EMOJI: One emoji that represents them (e.g., "📚")
4. STARTUP TONE: One of: scrappy, professional, quirky, serious
5. INTRO TWEET: Day 1 announcement (excited, hopeful)
6. DEFEAT TWEET: Game over tweet (sad but dignified)
7. BOSS VICTORY TWEET: Seed round closed (huge celebration!)
8. FLOOR BEATS: 16 story beat one-liners, one for each floor

Floor beats should follow the story arc and be specific to ${context.name}'s journey:
- Floors 1-4: hope phase
- Floors 5-8: grind phase  
- Floors 9-11: doubt phase
- Floors 12-14: breakthrough phase
- Floors 15-16: climax phase

Each tweet should be under 280 characters.
Make handles start with "@" and fit the character.`;
}

// ============================================
// MESO GENERATION PROMPT
// ============================================

function buildMesoSystemPrompt(): string {
    return `You are generating the MESO narrative layer for a specific combat encounter.

MESO creates the story beat for ONE fight - making it feel unique and dramatic.

CRITICAL RULES:
1. NO HASHTAGS EVER.
2. Short punchy sentences. Under 280 chars per tweet.
3. Enemy tweets ABOUT the startup, not TO it. Like villain monologue.
   ❌ WRONG: "@gigglelearn you're going to fail!"
   ✅ RIGHT: "LOL this 'GiggleLearn' thinks they can disrupt education? Watch them burn."

MESO LAYER INCLUDES:
- Approach tweet: Startup's tweet entering this challenge
- Victory tweet: Celebration after winning
- Enemy tweets: Per-enemy trash-talk by intent type (attack/buff/debuff/defeat)
- Card play tweets: Reactions when playing attack/skill/power cards
- Path previews: Teaser text for next decision points`;
}

function buildMesoUserPrompt(
    context: StartupContext,
    macro: MacroNarrative,
    floor: number,
    floorBeat: FloorBeat,
    enemies: { id: string; name: string; type: string }[],
    nextNodes: { id: string; type: string }[],
    deckCards?: { name: string; type: string; description: string }[]
): string {
    const enemyList = enemies.map(e => `- ${e.name} (${e.id}): ${e.type}`).join('\n');
    const nextNodesList = nextNodes.map(n => `- ${n.id}: ${n.type}`).join('\n');

    // Group deck cards by type for context
    const attackCards = deckCards?.filter(c => c.type === 'attack').map(c => c.name) || [];
    const skillCards = deckCards?.filter(c => c.type === 'skill').map(c => c.name) || [];
    const powerCards = deckCards?.filter(c => c.type === 'power').map(c => c.name) || [];

    // Get unique card names
    const uniqueAttacks = [...new Set(attackCards)].slice(0, 8).join(', ') || 'Commit, Deploy';
    const uniqueSkills = [...new Set(skillCards)].slice(0, 8).join(', ') || 'Rollback, Refactor';
    const uniquePowers = [...new Set(powerCards)].slice(0, 8).join(', ') || 'Network Effects';

    return `Generate MESO narrative for this combat:

STARTUP: ${context.name} (${macro.startupHandle})
THEME: ${macro.theme}
TONE: ${macro.startupTone}
FLOOR: ${floor} of 16
STORY PHASE: ${floorBeat.storyPhase}
STORY BEAT: "${floorBeat.storyBeat}"
NARRATIVE HOOK: "${floorBeat.narrativeHook}"

ENEMIES IN THIS FIGHT:
${enemyList}

CARDS IN DECK:
- Attack cards: ${uniqueAttacks}
- Skill cards: ${uniqueSkills}
- Power cards: ${uniquePowers}

NEXT POSSIBLE PATHS:
${nextNodesList}

Generate:
1. APPROACH TWEET: ${context.name}'s tweet entering this challenge (reflects story beat)
2. VICTORY TWEET: Celebration after beating these enemies
3. ENEMY TWEETS for each enemy:
   - 2-3 attack tweets (mocking while attacking)
   - 1-2 buff tweets (celebrating as problems grow)
   - 1-2 debuff tweets (mocking the struggling team)
   - 1 defeat tweet (startup celebrating victory)
4. CARD PLAY TWEETS (positive shipping tone, reference card names):
   - 2 attack card tweets: Celebrating shipping code (reference: ${uniqueAttacks})
   - 2 skill card tweets: Celebrating building/protecting (reference: ${uniqueSkills})
   - 2 power card tweets: Celebrating strategic wins (reference: ${uniquePowers})
   
   IMPORTANT: Card tweets should sound like a founder celebrating SHIPPING progress.
   ✅ Good: "New commit pushed! 🚀" or "Refactoring complete, codebase is cleaner!"
   ❌ Bad: "Take THAT!" or "Shut down those haters!"
   
5. PATH PREVIEWS for each next node:
   - teaser: One-line preview of what's coming
   - decisionHint: The choice they're making

Remember: Enemy tweets are ABOUT ${context.name}, not TO them.`;
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

async function callGeminiAPI(
    systemPrompt: string,
    userPrompt: string,
    schema: object,
    apiKey: string
): Promise<any> {
    console.log('[Progressive] 🚀 Gemini API call starting...');

    const requestBody = {
        contents: [{
            parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            temperature: 0.9,
            maxOutputTokens: 16384
        }
    };

    const startTime = Date.now();
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Progressive] 📥 Response in ${elapsed}ms, status: ${response.status}`);

    if (!response.ok) {
        const error = await response.text();
        console.error('[Progressive] ❌ API Error:', error);
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
    }

    const rawText = data.candidates[0].content.parts[0].text;
    console.log('[Progressive] ✅ Parsing response...');
    return JSON.parse(rawText);
}

// ============================================
// MACRO GENERATION
// ============================================

function transformMacroResponse(raw: any, context: StartupContext): MacroNarrative {
    // Transform floor beats
    const floorBeats: FloorBeat[] = (raw.floorBeats || []).map((beat: any) => ({
        floor: beat.floor,
        storyBeat: beat.storyBeat,
        narrativeHook: beat.narrativeHook,
        storyPhase: beat.storyPhase as FloorBeat['storyPhase']
    }));

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

export async function generateMacroNarrative(context: StartupContext): Promise<MacroNarrative> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.log('[Progressive] No API key, using fallback MACRO');
        return createFallbackMacro(context);
    }

    try {
        console.log('[Progressive] 🎬 Generating MACRO for:', context.name);
        const raw = await callGeminiAPI(
            buildMacroSystemPrompt(),
            buildMacroUserPrompt(context),
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
    deckCards?: { name: string; type: string; description: string }[]
): Promise<MesoNarrative> {
    // Check cache first
    const cached = getCachedMeso(nodeId);
    if (cached) {
        console.log('[Progressive] 📦 Using cached MESO for:', nodeId);
        return cached;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        console.log('[Progressive] No API key, using fallback MESO');
        return createFallbackMeso(context, macro, nodeId, floor, nodeType, enemies);
    }

    const floorBeat = macro.floorBeats[floor - 1] || DEFAULT_FLOOR_BEATS[floor - 1];

    try {
        console.log('[Progressive] 🎬 Generating MESO for floor:', floor, 'node:', nodeId);
        const raw = await callGeminiAPI(
            buildMesoSystemPrompt(),
            buildMesoUserPrompt(context, macro, floor, floorBeat, enemies, nextNodes, deckCards),
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

    // Create enemy intent tweets for each enemy
    const enemyIntentTweets: Record<string, EnemyIntentTweets> = {};
    for (const enemy of enemies) {
        enemyIntentTweets[enemy.id] = {
            attack: [
                createTweet('enemy', `${context.name} is about to get crushed. Just watch. 😈`, 5, true),
                createTweet('enemy', `Another startup bites the dust. ${context.name} can't handle this.`, 8, true),
            ],
            buff: [
                createTweet('enemy', `Getting stronger. ${context.name}'s problems are multiplying. 📈`, 6, true),
            ],
            debuff: [
                createTweet('enemy', `${context.name} team looking exhausted. Love to see it. 😴`, 4, true),
            ],
            defeat: createTweet('startup', `Crushed that ${enemy.name}! ${context.name} keeps shipping! 💪`, 25),
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
        console.warn('[Progressive] No tweet pool for enemy:', baseEnemyId);
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

    return { ...tweet, timestamp: 'just now' };
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

    return { ...pool.defeat, timestamp: 'just now' };
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

    return { ...tweet, timestamp: 'just now' };
}

/**
 * Get path preview for a node
 */
export function getPathPreview(meso: MesoNarrative, nodeId: string): PathPreview | null {
    return meso.pathPreviews.find(p => p.nodeId === nodeId) || null;
}
