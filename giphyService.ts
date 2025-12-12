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
import CURATED_CARD_GIFS from './curatedCardGifs.json';

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
// Strategy: [action] + [emotion] + [style] for dynamic, impactful results
export const CARD_GIF_SEARCH_TERMS: Record<string, string> = {
    // === STARTER CARDS ===
    'cto_commit': 'push button epic launch dramatic',
    'cto_stay_focused': 'laser focus intense concentration zone',
    'cto_hotfix': 'emergency rush panic typing fast',

    // === COMMON ATTACKS ===
    'cto_quick_fix': 'duct tape slap fix urgent',
    'cto_brute_force': 'smash power hammer destroy',
    'cto_sprint_planning': 'race start sprint running fast',
    'cto_risk_mitigation': 'catch save safety net falling',
    'cto_ship_it': 'rocket launch liftoff celebration',
    'cto_leverage': 'lifting heavy power leverage strength',
    'cto_batch_deploy': 'rapid fire multiple launch automation',
    'cto_cherry_pick': 'selecting best choosing carefully',
    'cto_dual_track': 'multitasking juggling two things',
    'cto_compounding_commits': 'snowball rolling growing bigger momentum',
    'cto_yolo_deploy': 'yolo diving risky jump crazy',
    'cto_shotgun_debug': 'spray scatter chaos random firing',
    'cto_pair_programming': 'high five teamwork duo fist bump',
    'cto_tech_shortcut': 'cutting corners sneaky shortcut cheat',
    'cto_all_hands': 'team meeting hands up together',
    'cto_caffeine_boost': 'coffee power up energy jolt wired',
    'cto_ship_and_pray': 'crossed fingers hope praying nervous',
    'cto_pivot_ready': 'flexible twist turning agile pivot',
    'cto_standup_notes': 'sticky notes board planning organized',

    // === COMMON SKILLS ===
    'cto_refactor': 'organizing cleaning satisfying tidy order',
    'cto_tooling': 'upgrade tools new equipment power up',

    // === UNCOMMON ATTACKS ===
    'cto_root_cause': 'detective eureka discover magnifying glass',
    'cto_market_window': 'door closing hurry opportunity rush',
    'cto_viral_loop': 'spreading viral domino effect chain',
    'cto_hackathon': 'coding pizza marathon intense hacking',
    'cto_blitzscaling': 'lightning strike fast attack blitz',
    'cto_equity_dilution': 'water pouring dilution mixing drops',
    'cto_clean_slate': 'wiping clean fresh start reset',
    'cto_bootstrapped': 'pulling up struggle lifting bootstrap',
    'cto_viral_growth': 'exponential rocket chart spike growth',
    'cto_core_product': 'diamond polishing perfect shiny gem',

    // === UNCOMMON SKILLS ===
    'cto_flow_state': 'zen meditation peaceful flow calm',
    'cto_talent_poach': 'recruiting stealing talent headhunting',
    'cto_firewall': 'shield protection barrier security force field',
    'cto_bridge_round': 'bridge crossing gap jumping temporary',
    'cto_market_disruption': 'explosion boom disruption shockwave impact',
    'cto_salary_cut': 'cutting scissors money budget slash',
    'cto_technical_bankruptcy': 'reset clear bankruptcy wipe start over',
    'cto_restructuring': 'reorganizing reshuffling restructure building',
    'cto_failsafe': 'parachute deploying safety backup landing',
    'cto_double_down': 'chips pushing betting double down all in',
    'cto_paper_valuation': 'money stack fake illusion paper wealth',
    'cto_push_through': 'pushing hard struggle effort breakthrough',
    'cto_founder_mode': 'boss mode intense ceo working determined',
    'cto_ab_test': 'split comparison testing science experiment',
    'cto_wild_pitch': 'wild crazy throwing random chaos pitch',
    'cto_market_fud': 'scared panic fear terror fud nervous',

    // === UNCOMMON POWERS ===
    'cto_troubleshooting': 'lightbulb eureka idea solving aha moment',
    'cto_lean_ops': 'minimalist efficient lean simple clean',
    'cto_caching': 'saving storing memory cache data efficient',
    'cto_code_review': 'approval checkmark thumbs up reviewing',
    'cto_resource_allocation': 'chess strategy tactical planning smart',
    'cto_antifragile': 'phoenix rising stronger rebirth level up',
    'cto_startup_grind': 'hustle grind working late night coffee',
    'cto_dark_pattern': 'sneaky dark manipulation shadowy trick',
    'cto_bug_bounty': 'catching hunting bounty reward capturing',

    // === RARE ATTACKS ===
    'cto_acquihire': 'handshake deal acquisition power merger',
    'cto_hostile_takeover': 'takeover aggressive corporate hostile conquest',
    'cto_crushing_it': 'dominating crushing victory winning power',
    'cto_burn_the_boats': 'burning fire commitment no retreat',
    'cto_all_in_pivot': 'all in poker chips pushing dramatic bet',

    // === RARE SKILLS ===
    'cto_10x_engineer': 'superhero genius coding wizard power',
    'cto_blood_equity': 'sacrifice giving everything blood sweat',
    'cto_runway_extension': 'runway landing airplane extending stretch',
    'cto_copy_paste': 'copy paste duplicate clone copying',
    'cto_zombie_feature': 'zombie rising undead comeback alive',

    // === RARE POWERS ===
    'cto_network_effects': 'network spreading connections web viral growth',
    'cto_tech_debt': 'debt credit card borrowing piling interest',
    'cto_war_chest': 'treasure chest money vault gold stacking',
    'cto_hypergrowth': 'rocket explosion hypergrowth fast scaling',
    'cto_crunch_culture': 'exhausted burnout crunch overwork tired dying',
    'cto_flywheel': 'spinning momentum flywheel perpetual motion',

    // === STATUS CARDS ===
    'status_legacy_code': 'old dusty vintage ancient computer retro',
    'status_bug': 'bug glitch error broken computer crash',
    'status_burnout': 'burnout exhausted fire dying tired drained',
    'status_scope_creep': 'tentacles grabbing spreading creeping expanding',
    'status_context_switch': 'confused switching dizzy distracted chaos'
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
 * Prioritizes curated GIFs over auto-fetched ones
 */
export function getCardGif(cardId: string): string | null {
    // Check curated cache first
    const curated = getCuratedCardGif(cardId);
    if (curated) {
        return curated;
    }
    // Fall back to regular cache
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

// === GIF CURATION SYSTEM ===

const CURATED_STORAGE_KEY = 'giphy_curated_cards';

interface CuratedGifCache {
    [cardId: string]: {
        url: string;
        timestamp: number;
    };
}

function loadCuratedCache(): CuratedGifCache {
    try {
        const stored = localStorage.getItem(CURATED_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('[GiphyService] Error loading curated cache:', error);
    }
    return {};
}

function saveCuratedCache(cache: CuratedGifCache): void {
    try {
        localStorage.setItem(CURATED_STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('[GiphyService] Error saving curated cache:', error);
    }
}

/**
 * Search for multiple GIFs for a card (for curation UI)
 * Returns array of GIF URLs
 */
export async function searchMultipleGifsForCard(cardId: string, limit: number = 12): Promise<string[]> {
    const searchTerm = CARD_GIF_SEARCH_TERMS[cardId];
    if (!searchTerm) {
        console.warn(`[GiphyService] No search term for card: ${cardId}`);
        return [];
    }

    if (!GIPHY_API_KEY) {
        console.warn('[GiphyService] No API key available for curation search');
        return [];
    }

    try {
        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: searchTerm,
            limit: String(limit),
            rating: 'pg-13',
            lang: 'en'
        });

        const response = await fetch(`${GIPHY_SEARCH_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`Giphy API error: ${response.status}`);
        }

        const data: GiphySearchResponse = await response.json();
        const urls = data.data.map(gif => gif.images.fixed_width.url);
        console.log(`[GiphyService] Found ${urls.length} GIFs for curation of "${cardId}"`);
        return urls;
    } catch (error) {
        console.error('[GiphyService] Curation search failed:', error);
        return [];
    }
}

/**
 * Search GIFs by custom term (for user-defined searches in curation UI)
 */
export async function searchGifsByCustomTerm(searchTerm: string, limit: number = 12): Promise<string[]> {
    if (!searchTerm.trim()) {
        return [];
    }

    if (!GIPHY_API_KEY) {
        console.warn('[GiphyService] No API key available for custom search');
        return [];
    }

    try {
        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: searchTerm,
            limit: String(limit),
            rating: 'pg-13',
            lang: 'en'
        });

        const response = await fetch(`${GIPHY_SEARCH_URL}?${params}`);
        if (!response.ok) {
            throw new Error(`Giphy API error: ${response.status}`);
        }

        const data: GiphySearchResponse = await response.json();
        const urls = data.data.map(gif => gif.images.fixed_width.url);
        console.log(`[GiphyService] Custom search found ${urls.length} GIFs for "${searchTerm}"`);
        return urls;
    } catch (error) {
        console.error('[GiphyService] Custom search failed:', error);
        return [];
    }
}

/**
 * Set a curated GIF for a card (user's choice)
 */
export function setCuratedCardGif(cardId: string, url: string): void {
    const cache = loadCuratedCache();
    cache[cardId] = {
        url,
        timestamp: Date.now()
    };
    saveCuratedCache(cache);
    // Also update the regular card cache so it's used immediately
    cardMemoryCache.set(cardId, url);
    console.log(`[GiphyService] Curated GIF set for "${cardId}"`);
}

/**
 * Get curated GIF for a card (returns null if not curated)
 * Checks localStorage first, then falls back to persistent JSON file
 */
export function getCuratedCardGif(cardId: string): string | null {
    // Check localStorage first (user's session overrides)
    const cache = loadCuratedCache();
    if (cache[cardId]?.url) {
        return cache[cardId].url;
    }
    // Fall back to persistent JSON file (committed to git)
    return (CURATED_CARD_GIFS as Record<string, string>)[cardId] || null;
}

/**
 * Check if a card has a curated GIF
 */
export function isCardCurated(cardId: string): boolean {
    const cache = loadCuratedCache();
    return !!cache[cardId] || !!(CURATED_CARD_GIFS as Record<string, string>)[cardId];
}

/**
 * Get all curated card GIFs (for export)
 */
export function getAllCuratedGifs(): Record<string, string> {
    const cache = loadCuratedCache();
    const result: Record<string, string> = {};
    for (const [cardId, data] of Object.entries(cache)) {
        result[cardId] = data.url;
    }
    return result;
}

/**
 * Import curated GIFs from JSON
 */
export function importCuratedGifs(gifs: Record<string, string>): number {
    const cache = loadCuratedCache();
    let count = 0;
    for (const [cardId, url] of Object.entries(gifs)) {
        cache[cardId] = { url, timestamp: Date.now() };
        cardMemoryCache.set(cardId, url);
        count++;
    }
    saveCuratedCache(cache);
    console.log(`[GiphyService] Imported ${count} curated GIFs`);
    return count;
}

/**
 * Clear all curated GIFs
 */
export function clearCuratedGifs(): void {
    try {
        localStorage.removeItem(CURATED_STORAGE_KEY);
        console.log('[GiphyService] Curated cache cleared');
    } catch (error) {
        console.warn('[GiphyService] Error clearing curated cache:', error);
    }
}

/**
 * Get curated count
 */
export function getCuratedCount(): number {
    const cache = loadCuratedCache();
    return Object.keys(cache).length;
}
