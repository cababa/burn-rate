/**
 * GameLogger - Comprehensive logging system for game state tracking
 * Outputs both structured JSON and LLM-readable narrative text
 */

// Log categories for filtering and organization
export type LogCategory =
    | 'TURN_START' | 'TURN_END'
    | 'CARD_PLAY' | 'CARD_DRAW' | 'CARD_EXHAUST' | 'CARD_BURN' | 'CARD_DISCARD' | 'CARD_ADDED_TO_HAND' | 'CARD_RETAINED' | 'CARD_PLAY_FAILED' | 'CARD_BURNED' | 'CARD_DISCARDED'
    | 'DAMAGE_DEALT' | 'DAMAGE_TAKEN' | 'BLOCK_GAINED' | 'BLOCK_USED' | 'DAMAGE_BLOCKED'
    | 'STATUS_APPLIED' | 'STATUS_EXPIRED' | 'STATUS_TRIGGERED' | 'STATUS_CLEARED' | 'STATUS_EFFECT'
    | 'ENEMY_INTENT' | 'ENEMY_ACTION' | 'ENEMY_SPAWN' | 'ENEMY_DEATH' | 'ENEMY_BUFF' | 'ENEMY_STATUS_EFFECT' | 'ENEMY_ATTACK_SPECIAL' | 'ENEMY_ACTION_SPECIAL' | 'ENEMY_INTENT_SET'
    | 'COMBAT_START' | 'COMBAT_END' | 'VICTORY' | 'DEFEAT' | 'GAME_OVER' | 'COMBAT_VICTORY'
    | 'MAP_NODE' | 'REWARD' | 'RELIC' | 'RELIC_ACQUIRED' | 'RELIC_TRIGGER' | 'RELIC_EFFECT' | 'REWARD_CAPITAL' | 'REWARD_RELIC'
    | 'ENERGY' | 'HEAL' | 'SHUFFLE' | 'WARNING'
    | 'LEGACY_CODE_EFFECT' | 'EVOLVE_TRIGGER' | 'CARD_EFFECT_END_TURN' | 'CARD_EXHAUSTED' | 'BOSS_MECHANIC' | 'CARD_EFFECT_ENEMY' | 'CARD_EFFECT_SPECIAL' | 'CARD_EFFECT_BLOCKED'
    | 'POTION_DROP' | 'POTION_ACQUIRE' | 'POTION_USE' | 'POTION_REMOVE' | 'POTION_FAIRY' | 'POTION_EFFECT'
    | 'INNATE_DRAW';

export interface LogContext {
    // Card-related
    cardName?: string;
    cardId?: string;
    cardCost?: number;
    cardType?: string;

    // Damage/Block
    amount?: number;
    blocked?: number;
    unblocked?: number;
    source?: string;
    target?: string;
    targetHpBefore?: number;
    targetHpAfter?: number;

    // Status effects
    statusName?: string;
    statusValue?: number;
    statusDuration?: number;

    // Enemy-related
    enemyName?: string;
    enemyId?: string;
    enemyHp?: number;
    enemyMaxHp?: number;
    intentType?: string;
    intentValue?: number;
    intentDescription?: string;

    // Player state
    playerHp?: number;
    playerMaxHp?: number;
    playerBlock?: number;
    playerEnergy?: number;

    // Combat/Map
    floor?: number;
    nodeType?: string;
    encounterName?: string;

    // Rewards
    capital?: number;
    relicName?: string;
    cardRewards?: string[];

    // Generic
    reason?: string;
    details?: string;

    // Allow any additional context
    [key: string]: unknown;
}

export interface LogEntry {
    timestamp: number;
    turn: number;
    floor: number;
    category: LogCategory;
    message: string;
    context: LogContext;
}

/**
 * GameLogger class for tracking all game interactions
 */
export class GameLogger {
    private entries: LogEntry[] = [];
    private currentTurn: number = 0;
    private currentFloor: number = 1;
    private enabled: boolean = true;

    constructor(enabled: boolean = true) {
        this.enabled = enabled;
    }

    /**
     * Set the current turn (for log context)
     */
    setTurn(turn: number): void {
        this.currentTurn = turn;
    }

    /**
     * Set the current floor (for log context)
     */
    setFloor(floor: number): void {
        this.currentFloor = floor;
    }

    /**
     * Enable or disable logging
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Log an entry
     */
    log(category: LogCategory, message: string, context: LogContext = {}): void {
        if (!this.enabled) return;

        const entry: LogEntry = {
            timestamp: Date.now(),
            turn: this.currentTurn,
            floor: this.currentFloor,
            category,
            message,
            context
        };

        this.entries.push(entry);
    }

    /**
     * Log a warning
     */
    warn(category: LogCategory, message: string, context: LogContext = {}): void {
        this.log('WARNING', `[${category}] ${message}`, context);
    }

    /**
     * Get all log entries
     */
    getEntries(): LogEntry[] {
        return [...this.entries];
    }

    /**
     * Get entries filtered by category
     */
    getEntriesByCategory(category: LogCategory): LogEntry[] {
        return this.entries.filter(e => e.category === category);
    }

    /**
     * Get entries for a specific turn
     */
    getEntriesByTurn(turn: number): LogEntry[] {
        return this.entries.filter(e => e.turn === turn);
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries = [];
        this.currentTurn = 0;
        this.currentFloor = 1;
    }

    /**
     * Export as JSON string
     */
    toJSON(): string {
        return JSON.stringify(this.entries, null, 2);
    }

    /**
     * Export as LLM-readable narrative text
     */
    toNarrativeText(): string {
        const lines: string[] = [];
        let lastTurn = -1;
        let lastFloor = -1;

        for (const entry of this.entries) {
            // Add turn/floor headers when they change
            if (entry.turn !== lastTurn || entry.floor !== lastFloor) {
                if (lines.length > 0) lines.push('');
                lines.push(`=== TURN ${entry.turn} | FLOOR ${entry.floor} ===`);
                lastTurn = entry.turn;
                lastFloor = entry.floor;
            }

            lines.push(this.formatEntry(entry));
        }

        return lines.join('\n');
    }

    /**
     * Format a single entry for narrative output
     */
    private formatEntry(entry: LogEntry): string {
        const { category, message, context } = entry;
        let detail = '';

        // Add contextual details based on category
        switch (category) {
            case 'CARD_PLAY':
                if (context.cardCost !== undefined) {
                    detail = ` (${context.cardCost} energy)`;
                }
                if (context.target) {
                    detail += ` targeting ${context.target}`;
                }
                break;

            case 'DAMAGE_DEALT':
                if (context.targetHpBefore !== undefined && context.targetHpAfter !== undefined) {
                    detail = ` (HP: ${context.targetHpBefore} → ${context.targetHpAfter})`;
                }
                break;

            case 'DAMAGE_TAKEN':
                if (context.blocked && context.blocked > 0) {
                    detail = ` (${context.blocked} blocked, ${context.unblocked || 0} unblocked)`;
                }
                if (context.playerHp !== undefined) {
                    detail += ` (HP: ${context.playerHp})`;
                }
                break;

            case 'STATUS_APPLIED':
                if (context.statusValue) {
                    detail = ` x${context.statusValue}`;
                }
                break;

            case 'ENEMY_INTENT':
                if (context.intentDescription) {
                    detail = `: ${context.intentDescription}`;
                }
                break;

            case 'ENEMY_SPAWN':
                if (context.enemyHp && context.enemyMaxHp) {
                    detail = ` (${context.enemyHp}/${context.enemyMaxHp} HP)`;
                }
                break;

            case 'REWARD':
                const rewards: string[] = [];
                if (context.capital) rewards.push(`$${context.capital}k capital`);
                if (context.relicName) rewards.push(`Relic: ${context.relicName}`);
                if (context.cardRewards?.length) rewards.push(`Cards: ${context.cardRewards.join(', ')}`);
                if (rewards.length) detail = `: ${rewards.join(', ')}`;
                break;
        }

        return `[${category}] ${message}${detail}`;
    }

    /**
     * Get summary statistics
     */
    getSummary(): {
        totalEntries: number;
        entriesByCategory: Record<string, number>;
        turnsLogged: number;
        floorsLogged: number;
    } {
        const entriesByCategory: Record<string, number> = {};
        const turns = new Set<number>();
        const floors = new Set<number>();

        for (const entry of this.entries) {
            entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
            turns.add(entry.turn);
            floors.add(entry.floor);
        }

        return {
            totalEntries: this.entries.length,
            entriesByCategory,
            turnsLogged: turns.size,
            floorsLogged: floors.size
        };
    }
}

// Singleton logger for easy access (optional pattern)
let globalLogger: GameLogger | null = null;

export function getGlobalLogger(): GameLogger {
    if (!globalLogger) {
        globalLogger = new GameLogger();
    }
    return globalLogger;
}

export function setGlobalLogger(logger: GameLogger): void {
    globalLogger = logger;
}

export function clearGlobalLogger(): void {
    globalLogger = null;
}
