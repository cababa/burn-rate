/**
 * Giphy Service - Fetches GIFs using the Giphy API
 * Supports:
 * - Enemy GIFs: 5 variations per emoji for visual variety
 * - Card GIFs: 1:1 static mapping for muscle memory
 * - 404 fallback: rotates through URLs, re-fetches if all fail
 * - Static cache fallback: uses pre-fetched URLs when API is unavailable
 * Persists URLs in localStorage to avoid repeated API calls
 */

import { CARD_GIF_STATIC_CACHE, getStaticCardGif } from './cardGifCache';

const GIPHY_API_KEY = (import.meta as any).env?.VITE_GIPHY_API_KEY || process.env.GIPHY_API_KEY || '';
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
const ENEMY_STORAGE_KEY = 'giphy_cache';
const CARD_STORAGE_KEY = 'giphy_card_cache';
const ENEMY_GIF_COUNT = 5; // Number of GIF variations per enemy

// In-memory caches for current session
const enemyMemoryCache: Map<string, string[]> = new Map();
const cardMemoryCache: Map<string, string> = new Map();

// Fallback mapping for specific emojis that might not search well
const EMOJI_SEARCH_TERMS: Record<string, string> = {
    '📦': 'boxes piling up',
    '🦜': 'parrot copying',
    '🤨': 'suspicious doubt',
    '👎': 'thumbs down disappointed',
    '✂️': 'cutting corners scissors',
    '😴': 'sleeping procrastinating',
    '👴': 'grumpy old man stubborn',
    '🎲': 'rolling dice gambling',
    '🗣️': 'gossip whispering',
    '🎭': 'two faced drama',
    '👔': 'boss micromanaging',
    '💭': 'daydreaming ideas',
    '🦊': 'sneaky fox',
    '🧛': 'vampire draining energy',
    '🐙': 'octopus grabbing',
    '⏰': 'deadline panic clock',
    '🚪': 'door slam rejection',
    '📝': 'criticism red pen',
    '📋': 'bureaucracy paperwork',
    '🔄': 'spinning change pivot',
    '🔥': 'money burning cash fire',
    '🏆': 'big boss competitor',
};

// Card GIF search terms - maps card ID to Giphy search query
export const CARD_GIF_SEARCH_TERMS: Record<string, string> = {
    // === STARTER CARDS ===
    'cto_commit': 'git push deploy code',
    'cto_stay_focused': 'laser focus concentration',
    'cto_hotfix': 'firefighter emergency fix',

    // === COMMON ATTACKS ===
    'cto_quick_fix': 'bandaid quick fix tape',
    'cto_brute_force': 'hulk smash brute force',
    'cto_sprint_planning': 'running sprint race fast',
    'cto_risk_mitigation': 'safety net fall protection',
    'cto_ship_it': 'rocket launch ship',
    'cto_leverage': 'leverage lifting heavy',
    'cto_batch_deploy': 'assembly line mass production',
    'cto_cherry_pick': 'cherry picking selection',
    'cto_dual_track': 'multitasking two things',
    'cto_compounding_commits': 'snowball growing bigger',
    'cto_yolo_deploy': 'cowboy reckless yolo',
    'cto_shotgun_debug': 'shotgun spray scatter',
    'cto_pair_programming': 'teamwork collaboration duo',
    'cto_tech_shortcut': 'shortcut cutting corners cheat',
    'cto_all_hands': 'team meeting all hands',
    'cto_caffeine_boost': 'coffee energy boost caffeine',
    'cto_ship_and_pray': 'praying fingers crossed hope',
    'cto_pivot_ready': 'yoga flexible pivot stretch',
    'cto_standup_notes': 'sticky notes planning board',

    // === COMMON SKILLS ===
    'cto_refactor': 'cleaning organizing tidy',
    'cto_tooling': 'tools wrench upgrade equipment',

    // === UNCOMMON ATTACKS ===
    'cto_root_cause': 'detective magnifying glass investigate',
    'cto_market_window': 'window opportunity closing time',
    'cto_viral_loop': 'viral spreading contagious loop',
    'cto_hackathon': 'hackathon coding marathon pizza',
    'cto_blitzscaling': 'lightning blitz fast attack',
    'cto_equity_dilution': 'water dilution pouring mixing',
    'cto_clean_slate': 'eraser clean slate fresh start',
    'cto_bootstrapped': 'pulling bootstrap struggle lifting',
    'cto_viral_growth': 'exponential growth chart rocket',
    'cto_core_product': 'diamond polishing gem perfect',

    // === UNCOMMON SKILLS ===
    'cto_flow_state': 'meditation zen flow state peaceful',
    'cto_talent_poach': 'fishing poaching stealing talent',
    'cto_firewall': 'firewall security protection shield',
    'cto_bridge_round': 'bridge crossing gap temporary',
    'cto_market_disruption': 'explosion disruption bomb shockwave',
    'cto_salary_cut': 'scissors cutting money budget',
    'cto_technical_bankruptcy': 'bankruptcy papers reset clear',
    'cto_restructuring': 'reorganizing restructure corporate',
    'cto_failsafe': 'parachute failsafe backup safety',
    'cto_double_down': 'double chips betting all in',
    'cto_paper_valuation': 'money stack paper bills illusion',
    'cto_push_through': 'pushing heavy struggle effort',
    'cto_founder_mode': 'founder CEO boss intense working',
    'cto_ab_test': 'split test comparison ab testing',
    'cto_wild_pitch': 'wild pitch baseball chaos random',
    'cto_market_fud': 'scared fear panic fud terror',

    // === UNCOMMON POWERS ===
    'cto_troubleshooting': 'lightbulb idea eureka solving',
    'cto_lean_ops': 'minimalist lean efficient simple',
    'cto_caching': 'saving storing cache memory',
    'cto_code_review': 'reviewing checking inspection approval',
    'cto_resource_allocation': 'chess strategy planning tactical',
    'cto_antifragile': 'phoenix rising stronger rebirth',
    'cto_startup_grind': 'grinding hustle working hard exhausted',
    'cto_dark_pattern': 'dark shadows sneaky manipulation',
    'cto_bug_bounty': 'bug catching hunter bounty reward',

    // === RARE ATTACKS ===
    'cto_acquihire': 'acquisition handshake deal merger',
    'cto_hostile_takeover': 'hostile takeover corporate aggressive',
    'cto_crushing_it': 'crushing destroying domination power',
    'cto_burn_the_boats': 'burning boats fire commitment',
    'cto_all_in_pivot': 'all in poker chips betting everything',

    // === RARE SKILLS ===
    'cto_10x_engineer': 'superhero programmer 10x engineer genius',
    'cto_blood_equity': 'blood sacrifice giving everything',
    'cto_runway_extension': 'airplane runway extension landing',
    'cto_copy_paste': 'copy paste duplicate clone',
    'cto_zombie_feature': 'zombie rising undead comeback',

    // === RARE POWERS ===
    'cto_network_effects': 'network connections web spreading',
    'cto_tech_debt': 'credit card debt borrowing interest',
    'cto_war_chest': 'treasure chest money vault savings',
    'cto_hypergrowth': 'rocket hypergrowth explosion fast',
    'cto_crunch_culture': 'exhausted tired crunch overwork burnout',
    'cto_flywheel': 'flywheel momentum spinning perpetual',

    // === STATUS CARDS ===
    'status_legacy_code': 'old dusty ancient computer vintage',
    'status_bug': 'bug insect crawling software glitch',
    'status_burnout': 'burnout exhausted fire tired dying',
    'status_scope_creep': 'octopus tentacles reaching grabbing',
    'status_context_switch': 'switch changing confusion distraction'
};

// === CACHE INTERFACES ===

interface StoredEnemyGifEntry {
    urls: string[];
    timestamp: number;
}

interface StoredEnemyGifCache {
    [emoji: string]: StoredEnemyGifEntry;
}

interface StoredCardGifEntry {
    url: string;
    timestamp: number;
}

interface StoredCardGifCache {
    [cardId: string]: StoredCardGifEntry;
}

// === ENEMY GIF CACHE FUNCTIONS ===

function loadEnemyCache(): StoredEnemyGifCache {
    try {
        const stored = localStorage.getItem(ENEMY_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migrate old single-URL format to new multi-URL format
            for (const key of Object.keys(parsed)) {
                if (typeof parsed[key].url === 'string') {
                    parsed[key] = {
                        urls: [parsed[key].url],
                        timestamp: parsed[key].timestamp
                    };
                }
            }
            return parsed;
        }
    } catch (error) {
        console.warn('[GiphyService] Error loading enemy cache:', error);
    }
    return {};
}

function saveEnemyCache(cache: StoredEnemyGifCache): void {
    try {
        localStorage.setItem(ENEMY_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('[GiphyService] Error saving enemy cache:', error);
    }
}

function storeEnemyGifUrls(emoji: string, urls: string[]): void {
    const cache = loadEnemyCache();
    cache[emoji] = {
        urls,
        timestamp: Date.now()
    };
    saveEnemyCache(cache);
    enemyMemoryCache.set(emoji, urls);
    console.log(`[GiphyService] Stored ${urls.length} GIF URLs for "${emoji}"`);
}

function getStoredEnemyGifUrls(emoji: string): string[] | null {
    // Check memory cache first
    if (enemyMemoryCache.has(emoji)) {
        return enemyMemoryCache.get(emoji) || null;
    }

    // Check localStorage
    const cache = loadEnemyCache();
    if (cache[emoji]?.urls?.length > 0) {
        enemyMemoryCache.set(emoji, cache[emoji].urls);
        return cache[emoji].urls;
    }

    return null;
}

// === CARD GIF CACHE FUNCTIONS ===

function loadCardCache(): StoredCardGifCache {
    try {
        const stored = localStorage.getItem(CARD_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('[GiphyService] Error loading card cache:', error);
    }
    return {};
}

function saveCardCache(cache: StoredCardGifCache): void {
    try {
        localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('[GiphyService] Error saving card cache:', error);
    }
}

function storeCardGifUrl(cardId: string, url: string): void {
    const cache = loadCardCache();
    cache[cardId] = {
        url,
        timestamp: Date.now()
    };
    saveCardCache(cache);
    cardMemoryCache.set(cardId, url);
    console.log(`[GiphyService] Stored card GIF for "${cardId}"`);
}

function getStoredCardGifUrl(cardId: string): string | null {
    // Check memory cache first
    if (cardMemoryCache.has(cardId)) {
        return cardMemoryCache.get(cardId) || null;
    }

    // Check localStorage
    const cache = loadCardCache();
    if (cache[cardId]?.url) {
        cardMemoryCache.set(cardId, cache[cardId].url);
        return cache[cardId].url;
    }

    // Fallback to static cache (pre-fetched URLs)
    const staticUrl = getStaticCardGif(cardId);
    if (staticUrl) {
        cardMemoryCache.set(cardId, staticUrl);
        return staticUrl;
    }

    return null;
}

// === VALIDATION ===

/**
 * Validate that a GIF URL is still accessible (not 404)
 */
async function validateGifUrl(url: string): Promise<boolean> {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Validate URLs and find first working one, rotating through array
 * Returns working URL or null if all fail
 */
async function findWorkingUrl(urls: string[]): Promise<string | null> {
    for (const url of urls) {
        if (await validateGifUrl(url)) {
            return url;
        }
    }
    return null;
}

// === GIPHY API TYPES ===

interface GiphyGif {
    id: string;
    url: string;
    images: {
        original: { url: string; width: string; height: string; };
        fixed_height: { url: string; width: string; height: string; };
        fixed_width: { url: string; width: string; height: string; };
        downsized: { url: string; width: string; height: string; };
    };
}

interface GiphySearchResponse {
    data: GiphyGif[];
    pagination: { total_count: number; count: number; offset: number; };
    meta: { status: number; msg: string; };
}

// === ENEMY GIF FUNCTIONS ===

/**
 * Search for GIFs using an emoji
 * Fetches 5 variations for visual variety
 * Returns array of URLs
 */
export async function searchGifsByEmoji(emoji: string, count: number = ENEMY_GIF_COUNT): Promise<string[]> {
    // 1. Check stored cache first
    const storedUrls = getStoredEnemyGifUrls(emoji);
    if (storedUrls && storedUrls.length >= count) {
        // Background validation - remove broken URLs
        findWorkingUrl(storedUrls).then(workingUrl => {
            if (!workingUrl) {
                console.warn(`[GiphyService] All stored URLs for "${emoji}" are invalid, clearing cache`);
                const cache = loadEnemyCache();
                delete cache[emoji];
                saveEnemyCache(cache);
                enemyMemoryCache.delete(emoji);
            }
        });
        console.log(`[GiphyService] Using ${storedUrls.length} cached GIFs for "${emoji}"`);
        return storedUrls;
    }

    // 2. If no API key, return empty
    if (!GIPHY_API_KEY) {
        console.warn('[GiphyService] No GIPHY_API_KEY configured');
        return [];
    }

    // 3. Fetch from Giphy API
    try {
        const searchTerm = EMOJI_SEARCH_TERMS[emoji] || emoji;

        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: searchTerm,
            limit: String(count),
            rating: 'g',
            lang: 'en',
        });

        const response = await fetch(`${GIPHY_SEARCH_URL}?${params}`);

        if (!response.ok) {
            console.error(`[GiphyService] API error: ${response.status} ${response.statusText}`);
            return [];
        }

        const data: GiphySearchResponse = await response.json();

        if (data.data && data.data.length > 0) {
            const urls = data.data.map(gif => gif.images.fixed_width.url);
            storeEnemyGifUrls(emoji, urls);
            console.log(`[GiphyService] Fetched ${urls.length} GIFs for "${searchTerm}"`);
            return urls;
        }

        console.warn(`[GiphyService] No GIFs found for "${searchTerm}"`);
        return [];
    } catch (error) {
        console.error('[GiphyService] Error fetching GIF:', error);
        return [];
    }
}

/**
 * Get a random GIF URL for an emoji (for enemy variety)
 * Returns null if no GIFs available
 */
export function getRandomEnemyGif(emoji: string): string | null {
    const urls = getStoredEnemyGifUrls(emoji);
    if (!urls || urls.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * urls.length);
    return urls[randomIndex];
}

/**
 * Legacy function for backwards compatibility
 */
export async function searchGifByEmoji(emoji: string): Promise<string | null> {
    const urls = await searchGifsByEmoji(emoji, 1);
    return urls.length > 0 ? urls[0] : null;
}

/**
 * Pre-fetch GIFs for all enemies at game start
 * Fetches 5 variations per emoji for visual variety
 */
export async function prefetchEnemyGifs(emojis: string[]): Promise<void> {
    const uniqueEmojis = [...new Set(emojis)];

    // Check which emojis need fetching (don't have enough URLs)
    const needsFetch = uniqueEmojis.filter(emoji => {
        const urls = getStoredEnemyGifUrls(emoji);
        return !urls || urls.length < ENEMY_GIF_COUNT;
    });

    if (needsFetch.length === 0) {
        console.log(`[GiphyService] All ${uniqueEmojis.length} enemy GIFs already cached with ${ENEMY_GIF_COUNT} variations!`);
        return;
    }

    console.log(`[GiphyService] Pre-fetching ${needsFetch.length} enemy GIFs (${uniqueEmojis.length - needsFetch.length} already cached)...`);

    // Fetch in parallel but with rate limiting (max 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < needsFetch.length; i += batchSize) {
        const batch = needsFetch.slice(i, i + batchSize);
        await Promise.all(batch.map(emoji => searchGifsByEmoji(emoji)));

        if (i + batchSize < needsFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[GiphyService] Enemy pre-fetch complete.`);
}

// === CARD GIF FUNCTIONS ===

/**
 * Search for a GIF by card ID
 * Uses CARD_GIF_SEARCH_TERMS mapping
 * Returns single URL (deterministic, first result)
 */
export async function searchGifByCardId(cardId: string): Promise<string | null> {
    // 1. Check stored cache (includes static cache fallback)
    const storedUrl = getStoredCardGifUrl(cardId);
    if (storedUrl) {
        // Background validation
        validateGifUrl(storedUrl).then(isValid => {
            if (!isValid) {
                console.warn(`[GiphyService] Card GIF for "${cardId}" is invalid, clearing`);
                const cache = loadCardCache();
                delete cache[cardId];
                saveCardCache(cache);
                cardMemoryCache.delete(cardId);
            }
        });
        return storedUrl;
    }

    // 2. Get search term
    const searchTerm = CARD_GIF_SEARCH_TERMS[cardId];
    if (!searchTerm) {
        console.warn(`[GiphyService] No search term for card "${cardId}"`);
        // Try static cache as last resort
        return getStaticCardGif(cardId);
    }

    // 3. If no API key, use static cache fallback
    if (!GIPHY_API_KEY) {
        console.warn('[GiphyService] No GIPHY_API_KEY configured, using static cache');
        return getStaticCardGif(cardId);
    }

    // 4. Fetch from Giphy API (only first result for cards)
    try {
        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: searchTerm,
            limit: '1',
            rating: 'g',
            lang: 'en',
        });

        const response = await fetch(`${GIPHY_SEARCH_URL}?${params}`);

        if (!response.ok) {
            console.error(`[GiphyService] API error: ${response.status}, using static cache`);
            return getStaticCardGif(cardId);
        }

        const data: GiphySearchResponse = await response.json();

        if (data.data && data.data.length > 0) {
            const url = data.data[0].images.fixed_width.url;
            storeCardGifUrl(cardId, url);
            console.log(`[GiphyService] Fetched card GIF for "${cardId}"`);
            return url;
        }

        console.warn(`[GiphyService] No GIF found for card "${cardId}", using static cache`);
        return getStaticCardGif(cardId);
    } catch (error) {
        console.error('[GiphyService] Error fetching card GIF:', error);
        // Fallback to static cache on any error
        return getStaticCardGif(cardId);
    }
}

/**
 * Get cached card GIF URL (synchronous)
 */
export function getCardGif(cardId: string): string | null {
    return getStoredCardGifUrl(cardId);
}

/**
 * Pre-fetch GIFs for all cards at game start
 */
export async function prefetchCardGifs(): Promise<void> {
    const cardIds = Object.keys(CARD_GIF_SEARCH_TERMS);

    // Check which cards need fetching
    const needsFetch = cardIds.filter(id => !getStoredCardGifUrl(id));

    if (needsFetch.length === 0) {
        console.log(`[GiphyService] All ${cardIds.length} card GIFs already cached!`);
        return;
    }

    console.log(`[GiphyService] Pre-fetching ${needsFetch.length} card GIFs (${cardIds.length - needsFetch.length} already cached)...`);

    // Fetch in parallel but with rate limiting
    const batchSize = 5;
    for (let i = 0; i < needsFetch.length; i += batchSize) {
        const batch = needsFetch.slice(i, i + batchSize);
        await Promise.all(batch.map(id => searchGifByCardId(id)));

        if (i + batchSize < needsFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[GiphyService] Card pre-fetch complete.`);
}

// === LEGACY COMPATIBILITY ===

/**
 * Get a cached GIF URL (legacy function, use getRandomEnemyGif instead)
 */
export function getCachedGif(emoji: string): string | null {
    return getRandomEnemyGif(emoji);
}

// === CACHE MANAGEMENT ===

/**
 * Clear all GIF caches (enemy and card)
 */
export function clearGifCache(): void {
    enemyMemoryCache.clear();
    cardMemoryCache.clear();
    try {
        localStorage.removeItem(ENEMY_STORAGE_KEY);
        localStorage.removeItem(CARD_STORAGE_KEY);
        console.log('[GiphyService] All caches cleared');
    } catch (error) {
        console.warn('[GiphyService] Error clearing cache:', error);
    }
}

/**
 * Clear only enemy GIF cache
 */
export function clearEnemyGifCache(): void {
    enemyMemoryCache.clear();
    try {
        localStorage.removeItem(ENEMY_STORAGE_KEY);
        console.log('[GiphyService] Enemy cache cleared');
    } catch (error) {
        console.warn('[GiphyService] Error clearing enemy cache:', error);
    }
}

/**
 * Clear only card GIF cache
 */
export function clearCardGifCache(): void {
    cardMemoryCache.clear();
    try {
        localStorage.removeItem(CARD_STORAGE_KEY);
        console.log('[GiphyService] Card cache cleared');
    } catch (error) {
        console.warn('[GiphyService] Error clearing card cache:', error);
    }
}

/**
 * Get cache statistics
 */
export function getGifCacheStats(): {
    enemyMemoryCount: number;
    enemyStoredCount: number;
    cardMemoryCount: number;
    cardStoredCount: number;
} {
    const enemyStored = loadEnemyCache();
    const cardStored = loadCardCache();
    return {
        enemyMemoryCount: enemyMemoryCache.size,
        enemyStoredCount: Object.keys(enemyStored).length,
        cardMemoryCount: cardMemoryCache.size,
        cardStoredCount: Object.keys(cardStored).length
    };
}
