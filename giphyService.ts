/**
 * Giphy Service - Fetches GIFs using the Giphy API
 * Uses emoji search to find reaction GIFs for enemies
 * Persists URLs in localStorage to avoid repeated API calls
 */

const GIPHY_API_KEY = (import.meta as any).env?.VITE_GIPHY_API_KEY || process.env.GIPHY_API_KEY || '';
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
const STORAGE_KEY = 'giphy_cache';

// In-memory cache for current session
const memoryCache: Map<string, string> = new Map();

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

interface StoredGifCache {
    [emoji: string]: {
        url: string;
        timestamp: number;
    };
}

/**
 * Load persistent cache from localStorage
 */
function loadStoredCache(): StoredGifCache {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.warn('[GiphyService] Error loading stored cache:', error);
    }
    return {};
}

/**
 * Save cache to localStorage
 */
function saveStoredCache(cache: StoredGifCache): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('[GiphyService] Error saving cache:', error);
    }
}

/**
 * Store a single emoji->URL mapping persistently
 */
function storeGifUrl(emoji: string, url: string): void {
    const cache = loadStoredCache();
    cache[emoji] = {
        url,
        timestamp: Date.now()
    };
    saveStoredCache(cache);
    memoryCache.set(emoji, url);
    console.log(`[GiphyService] Stored GIF URL for "${emoji}" in localStorage`);
}

/**
 * Get a stored GIF URL (returns null if not found or invalid)
 */
function getStoredGifUrl(emoji: string): string | null {
    // Check memory cache first
    if (memoryCache.has(emoji)) {
        return memoryCache.get(emoji) || null;
    }

    // Check localStorage
    const cache = loadStoredCache();
    if (cache[emoji]?.url) {
        // Load into memory cache for faster access
        memoryCache.set(emoji, cache[emoji].url);
        return cache[emoji].url;
    }

    return null;
}

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

interface GiphyGif {
    id: string;
    url: string;
    images: {
        original: {
            url: string;
            width: string;
            height: string;
        };
        fixed_height: {
            url: string;
            width: string;
            height: string;
        };
        fixed_width: {
            url: string;
            width: string;
            height: string;
        };
        downsized: {
            url: string;
            width: string;
            height: string;
        };
    };
}

interface GiphySearchResponse {
    data: GiphyGif[];
    pagination: {
        total_count: number;
        count: number;
        offset: number;
    };
    meta: {
        status: number;
        msg: string;
    };
}

/**
 * Search for a GIF using an emoji
 * Returns the URL of the first matching GIF (fixed_width for performance)
 * Uses localStorage for persistence to avoid repeated API calls
 */
export async function searchGifByEmoji(emoji: string): Promise<string | null> {
    // 1. Check stored cache first (localStorage + memory)
    const storedUrl = getStoredGifUrl(emoji);
    if (storedUrl) {
        // Validate the URL is still working (do this in background, don't block)
        validateGifUrl(storedUrl).then(isValid => {
            if (!isValid) {
                console.warn(`[GiphyService] Stored URL for "${emoji}" is no longer valid, will refresh on next load`);
                // Remove from cache so it gets refreshed next time
                const cache = loadStoredCache();
                delete cache[emoji];
                saveStoredCache(cache);
                memoryCache.delete(emoji);
            }
        });

        console.log(`[GiphyService] Using stored GIF for "${emoji}"`);
        return storedUrl;
    }

    // 2. If no API key, return null (will fall back to emoji display)
    if (!GIPHY_API_KEY) {
        console.warn('[GiphyService] No GIPHY_API_KEY configured, falling back to emoji display');
        return null;
    }

    // 3. Fetch from Giphy API
    try {
        const searchTerm = EMOJI_SEARCH_TERMS[emoji] || emoji;

        const params = new URLSearchParams({
            api_key: GIPHY_API_KEY,
            q: searchTerm,
            limit: '1',
            rating: 'g', // Safe for work
            lang: 'en',
        });

        const response = await fetch(`${GIPHY_SEARCH_URL}?${params}`);

        if (!response.ok) {
            console.error(`[GiphyService] API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: GiphySearchResponse = await response.json();

        if (data.data && data.data.length > 0) {
            // Use fixed_width for better performance (200px wide)
            const gifUrl = data.data[0].images.fixed_width.url;

            // Store persistently in localStorage
            storeGifUrl(emoji, gifUrl);

            console.log(`[GiphyService] Found and stored GIF for "${searchTerm}":`, gifUrl);
            return gifUrl;
        }

        console.warn(`[GiphyService] No GIFs found for "${searchTerm}"`);
        return null;
    } catch (error) {
        console.error('[GiphyService] Error fetching GIF:', error);
        return null;
    }
}

/**
 * Pre-fetch GIFs for all enemies at game start
 * This helps avoid loading delays during combat
 */
export async function prefetchEnemyGifs(emojis: string[]): Promise<void> {
    const uniqueEmojis = [...new Set(emojis)];

    // Check which emojis we already have stored
    const needsFetch = uniqueEmojis.filter(emoji => !getStoredGifUrl(emoji));

    if (needsFetch.length === 0) {
        console.log(`[GiphyService] All ${uniqueEmojis.length} enemy GIFs already cached!`);
        return;
    }

    console.log(`[GiphyService] Pre-fetching ${needsFetch.length} enemy GIFs (${uniqueEmojis.length - needsFetch.length} already cached)...`);

    // Fetch in parallel but with rate limiting (max 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < needsFetch.length; i += batchSize) {
        const batch = needsFetch.slice(i, i + batchSize);
        await Promise.all(batch.map(emoji => searchGifByEmoji(emoji)));

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < needsFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`[GiphyService] Pre-fetch complete. Total cached: ${Object.keys(loadStoredCache()).length}`);
}

/**
 * Get a cached GIF URL (synchronous, use after pre-fetching)
 */
export function getCachedGif(emoji: string): string | null {
    return getStoredGifUrl(emoji);
}

/**
 * Clear the GIF cache (both memory and localStorage)
 */
export function clearGifCache(): void {
    memoryCache.clear();
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[GiphyService] Cache cleared');
    } catch (error) {
        console.warn('[GiphyService] Error clearing cache:', error);
    }
}

/**
 * Get cache statistics
 */
export function getGifCacheStats(): { memoryCount: number; storedCount: number } {
    const stored = loadStoredCache();
    return {
        memoryCount: memoryCache.size,
        storedCount: Object.keys(stored).length
    };
}
