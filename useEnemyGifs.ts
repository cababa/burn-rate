/**
 * useEnemyGifs Hook - Manages GIF fetching for enemies using their emojis
 */

import { useState, useEffect, useCallback } from 'react';
import { searchGifByEmoji, getCachedGif, prefetchEnemyGifs } from './giphyService';

interface EnemyGifState {
    [enemyId: string]: string | null;
}

interface UseEnemyGifsOptions {
    enemies: Array<{ id: string; emoji: string }>;
    enabled?: boolean;
}

export function useEnemyGifs({ enemies, enabled = true }: UseEnemyGifsOptions) {
    const [gifUrls, setGifUrls] = useState<EnemyGifState>({});
    const [isLoading, setIsLoading] = useState(false);

    // Fetch GIFs for all enemies when they change
    useEffect(() => {
        if (!enabled || enemies.length === 0) return;

        const fetchGifs = async () => {
            setIsLoading(true);

            // Collect unique emojis
            const emojis = [...new Set(enemies.map(e => e.emoji))];

            // Pre-fetch all emojis
            await prefetchEnemyGifs(emojis);

            // Update state with cached GIFs
            const newGifUrls: EnemyGifState = {};
            for (const enemy of enemies) {
                const cachedUrl = getCachedGif(enemy.emoji);
                if (cachedUrl) {
                    newGifUrls[enemy.id] = cachedUrl;
                }
            }

            setGifUrls(newGifUrls);
            setIsLoading(false);
        };

        fetchGifs();
    }, [enemies.map(e => e.id).join(','), enabled]);

    // Get GIF URL for a specific enemy (immediate, from cache)
    const getGifUrl = useCallback((enemyId: string): string | null => {
        return gifUrls[enemyId] || null;
    }, [gifUrls]);

    return {
        gifUrls,
        getGifUrl,
        isLoading,
    };
}
