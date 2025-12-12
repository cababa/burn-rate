/**
 * useCardGifs Hook - Manages GIF fetching for cards
 * Cards have 1:1 static GIF mapping for muscle memory consistency
 */

import { useState, useEffect, useCallback } from 'react';
import { prefetchCardGifs, getCardGif, CARD_GIF_SEARCH_TERMS } from './giphyService';

interface CardGifState {
    [cardId: string]: string | null;
}

interface UseCardGifsOptions {
    cardIds?: string[];  // Optional: specific cards to fetch. If not provided, fetches all.
    enabled?: boolean;
}

/**
 * Normalize a runtime card ID to its base card ID
 * Runtime IDs look like: commit_0_abc123, stay_focused_2_xyz789, hotfix_abc123
 * Base IDs look like: cto_commit, cto_stay_focused, cto_hotfix
 * Also handles status cards: status_legacy_code, status_bug, etc.
 */
function normalizeCardId(runtimeId: string): string {
    // First, check if it's already a valid base ID
    if (CARD_GIF_SEARCH_TERMS[runtimeId]) {
        return runtimeId;
    }

    // Status cards - keep as is if they start with status_
    if (runtimeId.startsWith('status_')) {
        // Extract status_xxx from status_xxx_timestamp
        const statusMatch = runtimeId.match(/^(status_[a-z_]+?)(?:_\d+)?(?:_[a-z0-9]+)?$/);
        if (statusMatch && CARD_GIF_SEARCH_TERMS[statusMatch[1]]) {
            return statusMatch[1];
        }
        // Try truncating after the last known status ID
        for (const key of Object.keys(CARD_GIF_SEARCH_TERMS)) {
            if (key.startsWith('status_') && runtimeId.startsWith(key)) {
                return key;
            }
        }
    }

    // Try CTO card patterns
    // Card names like: commit_0_abc123 -> cto_commit
    //                  stay_focused_2_xyz789 -> cto_stay_focused  
    //                  hotfix_abc123 -> cto_hotfix

    // Extract the card name by removing numeric suffixes and random IDs
    // Pattern: cardname_N_randomid or cardname_randomid
    const parts = runtimeId.split('_');

    // Try progressively shorter combinations with cto_ prefix
    for (let len = parts.length - 1; len >= 1; len--) {
        // Skip parts that look like random IDs or pure numbers
        const candidateParts = parts.slice(0, len).filter(p => !/^[a-z0-9]{9}$/.test(p) && !/^\d+$/.test(p));
        if (candidateParts.length === 0) continue;

        const candidateName = candidateParts.join('_');
        const ctoId = `cto_${candidateName}`;

        if (CARD_GIF_SEARCH_TERMS[ctoId]) {
            return ctoId;
        }
    }

    // Fallback: return original ID (might not have a GIF)
    return runtimeId;
}

/**
 * Hook to manage card GIF URLs
 * Pre-fetches all card GIFs on mount, returns cached URLs
 */
export function useCardGifs({ cardIds, enabled = true }: UseCardGifsOptions = {}) {
    const [gifUrls, setGifUrls] = useState<CardGifState>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Pre-fetch all card GIFs on mount
    useEffect(() => {
        if (!enabled) return;

        const fetchGifs = async () => {
            setIsLoading(true);

            // Pre-fetch all card GIFs
            await prefetchCardGifs();

            // Load all cached GIFs into state
            const targetCardIds = cardIds || Object.keys(CARD_GIF_SEARCH_TERMS);
            const newGifUrls: CardGifState = {};

            for (const cardId of targetCardIds) {
                const cachedUrl = getCardGif(cardId);
                newGifUrls[cardId] = cachedUrl;
            }

            setGifUrls(newGifUrls);
            setIsLoading(false);
            setIsReady(true);
        };

        fetchGifs();
    }, [enabled, cardIds?.join(',')]);

    // Get GIF URL for a specific card (immediate, from state)
    // Normalizes runtime IDs to base card IDs for lookup
    const getGifUrl = useCallback((cardId: string): string | null => {
        const baseId = normalizeCardId(cardId);

        // First check state with normalized ID
        if (gifUrls[baseId] !== undefined) {
            return gifUrls[baseId];
        }
        // Fallback to direct cache lookup (for cards loaded after initial fetch)
        return getCardGif(baseId);
    }, [gifUrls]);

    return {
        gifUrls,
        getGifUrl,
        isLoading,
        isReady,
    };
}

/**
 * Hook to get a single card's GIF URL
 * Lightweight alternative when you only need one card
 */
export function useCardGif(cardId: string, enabled: boolean = true): string | null {
    const [gifUrl, setGifUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !cardId) return;

        // Normalize the card ID to base ID
        const baseId = normalizeCardId(cardId);

        // Try to get from cache first
        const cached = getCardGif(baseId);
        if (cached) {
            setGifUrl(cached);
            return;
        }

        // If not cached, the prefetch should have loaded it
        // Just re-check after a small delay
        const timer = setTimeout(() => {
            const url = getCardGif(baseId);
            setGifUrl(url);
        }, 100);

        return () => clearTimeout(timer);
    }, [cardId, enabled]);

    return gifUrl;
}

