/**
 * useEnemyGifs Hook - Manages GIF fetching for enemies using their emojis
 * Now supports multiple GIF variations per emoji for visual variety
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { prefetchEnemyGifs, getRandomEnemyGif } from './giphyService';

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
    
    // Track which enemies we've already assigned GIFs to (for stability)
    const assignedGifsRef = useRef<EnemyGifState>({});

    // Fetch GIFs for all enemies when they change
    useEffect(() => {
        if (!enabled || enemies.length === 0) return;

        const fetchGifs = async () => {
            setIsLoading(true);

            // Collect unique emojis
            const emojis = [...new Set(enemies.map(e => e.emoji))];

            // Pre-fetch all emojis (5 variations each)
            await prefetchEnemyGifs(emojis);

            // Update state with cached GIFs
            // Each enemy gets a random GIF from their emoji's pool
            // But we preserve already-assigned GIFs for stability
            const newGifUrls: EnemyGifState = {};
            for (const enemy of enemies) {
                // If this enemy already has an assigned GIF, keep it
                if (assignedGifsRef.current[enemy.id]) {
                    newGifUrls[enemy.id] = assignedGifsRef.current[enemy.id];
                } else {
                    // New enemy - assign a random GIF from the pool
                    const randomUrl = getRandomEnemyGif(enemy.emoji);
                    newGifUrls[enemy.id] = randomUrl;
                    assignedGifsRef.current[enemy.id] = randomUrl;
                }
            }

            setGifUrls(newGifUrls);
            setIsLoading(false);
        };

        fetchGifs();
    }, [enemies.map(e => e.id).join(','), enabled]);

    // Get GIF URL for a specific enemy (immediate, from state)
    const getGifUrl = useCallback((enemyId: string): string | null => {
        return gifUrls[enemyId] || null;
    }, [gifUrls]);

    return {
        gifUrls,
        getGifUrl,
        isLoading,
    };
}
