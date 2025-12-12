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
    const getGifUrl = useCallback((cardId: string): string | null => {
        // First check state
        if (gifUrls[cardId] !== undefined) {
            return gifUrls[cardId];
        }
        // Fallback to direct cache lookup (for cards loaded after initial fetch)
        return getCardGif(cardId);
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

        // Try to get from cache first
        const cached = getCardGif(cardId);
        if (cached) {
            setGifUrl(cached);
            return;
        }

        // If not cached, the prefetch should have loaded it
        // Just re-check after a small delay
        const timer = setTimeout(() => {
            const url = getCardGif(cardId);
            setGifUrl(url);
        }, 100);

        return () => clearTimeout(timer);
    }, [cardId, enabled]);

    return gifUrl;
}
