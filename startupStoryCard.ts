// ============================================
// STARTUP STORY CARD
// ============================================
// Generates shareable run summaries for players to share their journey
// Creates "personalized artifacts" (stickiness ingredient #9)

import { StartupContext } from './narrativeTypes';
import { MacroNarrative, FloorBeat } from './progressiveNarrativeTypes';

// ============================================
// TYPES
// ============================================

/**
 * Shareable story card summarizing a player's run
 */
export interface StartupStoryCard {
    startupName: string;
    emoji: string;
    oneLiner: string;
    floorsReached: number;
    maxFloors: number;
    outcome: 'victory' | 'defeat';
    bestMoment: string;           // Highest floor beat achieved
    pivotalChoice: string;        // Most-played card name
    seedCode: string;             // For replay
    runDuration: string;          // "12 mins" or "45 mins"
}

// ============================================
// STORY CARD GENERATION
// ============================================

/**
 * Generate a shareable story card from game state
 */
export function generateStoryCard(
    context: StartupContext,
    macro: MacroNarrative | null,
    floor: number,
    outcome: 'victory' | 'defeat',
    cardPlayCounts: Record<string, number>,
    seed: string,
    startTime: number
): StartupStoryCard {
    // Find the most-played card
    const entries = Object.entries(cardPlayCounts);
    const pivotalChoice = entries.length > 0
        ? entries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
        : 'The Hustle';

    // Get best moment from floor beats
    const floorBeat = macro?.floorBeats[floor - 1];
    const bestMoment = floorBeat?.resolution || 'Built something amazing';

    // Calculate run duration
    const durationMs = Date.now() - startTime;
    const durationMins = Math.round(durationMs / 60000);
    const runDuration = durationMins < 60
        ? `${durationMins} min${durationMins !== 1 ? 's' : ''}`
        : `${Math.round(durationMins / 60)} hr${Math.round(durationMins / 60) !== 1 ? 's' : ''}`;

    return {
        startupName: context.name,
        emoji: macro?.startupEmoji || '🚀',
        oneLiner: context.oneLiner,
        floorsReached: floor,
        maxFloors: 16,
        outcome,
        bestMoment,
        pivotalChoice,
        seedCode: seed,
        runDuration
    };
}

// ============================================
// SHAREABLE TEXT FORMATS
// ============================================

/**
 * Generate shareable text for Twitter/X
 */
export function formatShareableText(card: StartupStoryCard): string {
    const outcomeEmoji = card.outcome === 'victory' ? '🎉' : '💀';
    const verb = card.outcome === 'victory' ? 'Closed my Seed round!' : 'Ran out of runway';

    return `${card.emoji} ${card.startupName}
"${card.oneLiner}"

${outcomeEmoji} ${verb}
📍 Reached: Floor ${card.floorsReached}/${card.maxFloors}
⭐ Best moment: ${card.bestMoment}
🎯 Key strategy: ${card.pivotalChoice}
⏱️ Time: ${card.runDuration}
🎲 Seed: ${card.seedCode}

Play THE NEXT BIG THING!`;
}

/**
 * Generate a compact one-line share
 */
export function formatCompactShare(card: StartupStoryCard): string {
    const outcomeEmoji = card.outcome === 'victory' ? '🎉' : '💀';
    return `${card.emoji} ${card.startupName}: ${outcomeEmoji} Floor ${card.floorsReached}/${card.maxFloors} | ${card.pivotalChoice} | Seed: ${card.seedCode}`;
}

/**
 * Generate copy-to-clipboard text
 */
export function formatClipboardText(card: StartupStoryCard): string {
    return formatShareableText(card);
}
