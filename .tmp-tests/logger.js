/**
 * GameLogger - Comprehensive logging system for game state tracking
 * Outputs both structured JSON and LLM-readable narrative text
 */
/**
 * GameLogger class for tracking all game interactions
 */
export class GameLogger {
    entries = [];
    currentTurn = 0;
    currentFloor = 1;
    enabled = true;
    constructor(enabled = true) {
        this.enabled = enabled;
    }
    /**
     * Set the current turn (for log context)
     */
    setTurn(turn) {
        this.currentTurn = turn;
    }
    /**
     * Set the current floor (for log context)
     */
    setFloor(floor) {
        this.currentFloor = floor;
    }
    /**
     * Enable or disable logging
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Log an entry
     */
    log(category, message, context = {}) {
        if (!this.enabled)
            return;
        const entry = {
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
    warn(category, message, context = {}) {
        this.log('WARNING', `[${category}] ${message}`, context);
    }
    /**
     * Get all log entries
     */
    getEntries() {
        return [...this.entries];
    }
    /**
     * Get entries filtered by category
     */
    getEntriesByCategory(category) {
        return this.entries.filter(e => e.category === category);
    }
    /**
     * Get entries for a specific turn
     */
    getEntriesByTurn(turn) {
        return this.entries.filter(e => e.turn === turn);
    }
    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        this.currentTurn = 0;
        this.currentFloor = 1;
    }
    /**
     * Export as JSON string
     */
    toJSON() {
        return JSON.stringify(this.entries, null, 2);
    }
    /**
     * Export as LLM-readable narrative text
     */
    toNarrativeText() {
        const lines = [];
        let lastTurn = -1;
        let lastFloor = -1;
        for (const entry of this.entries) {
            // Add turn/floor headers when they change
            if (entry.turn !== lastTurn || entry.floor !== lastFloor) {
                if (lines.length > 0)
                    lines.push('');
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
    formatEntry(entry) {
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
                const rewards = [];
                if (context.capital)
                    rewards.push(`$${context.capital}k capital`);
                if (context.relicName)
                    rewards.push(`Relic: ${context.relicName}`);
                if (context.cardRewards?.length)
                    rewards.push(`Cards: ${context.cardRewards.join(', ')}`);
                if (rewards.length)
                    detail = `: ${rewards.join(', ')}`;
                break;
        }
        return `[${category}] ${message}${detail}`;
    }
    /**
     * Get summary statistics
     */
    getSummary() {
        const entriesByCategory = {};
        const turns = new Set();
        const floors = new Set();
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
let globalLogger = null;
export function getGlobalLogger() {
    if (!globalLogger) {
        globalLogger = new GameLogger();
    }
    return globalLogger;
}
export function setGlobalLogger(logger) {
    globalLogger = logger;
}
export function clearGlobalLogger() {
    globalLogger = null;
}
