/**
 * Seeded Random Number Generator System
 * 
 * Implements a deterministic PRNG using the Mulberry32 algorithm.
 * Provides separate RNG streams for different game systems to ensure
 * reproducibility of runs with the same seed.
 */

/**
 * Mulberry32 - A fast, high-quality 32-bit PRNG
 * Period: 2^32
 */
export class SeededRandom {
    private state: number;

    constructor(seed: number) {
        // Ensure seed is a 32-bit integer
        this.state = seed >>> 0;
    }

    /**
     * Get the next random number in range [0, 1)
     */
    next(): number {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Get a random integer in range [min, max] (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Get a random float in range [min, max)
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Pick a random element from an array
     */
    pick<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('Cannot pick from empty array');
        }
        return array[Math.floor(this.next() * array.length)];
    }

    /**
     * Pick a random element from an array with weighted probabilities
     */
    weightedPick<T>(items: T[], weights: number[]): T {
        if (items.length !== weights.length) {
            throw new Error('Items and weights must have same length');
        }
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let roll = this.next() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return items[i];
        }
        return items[items.length - 1];
    }

    /**
     * Fisher-Yates shuffle with seeded RNG
     */
    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Get current state (for serialization)
     */
    getState(): number {
        return this.state;
    }

    /**
     * Set state (for deserialization)
     */
    setState(state: number): void {
        this.state = state >>> 0;
    }

    /**
     * Create a copy of this RNG with the same state
     */
    clone(): SeededRandom {
        const copy = new SeededRandom(0);
        copy.state = this.state;
        return copy;
    }
}

/**
 * Game RNG Manager - provides separate streams for different systems
 * This ensures that using cards doesn't affect map generation, etc.
 */
export interface GameRNG {
    seed: string;           // Human-readable seed
    seedNumber: number;     // Numeric seed value
    map: SeededRandom;      // Map generation
    cards: SeededRandom;    // Card rewards
    relics: SeededRandom;   // Relic generation
    potions: SeededRandom;  // Potion drops
    events: SeededRandom;   // Event selection
    encounters: SeededRandom; // Encounter spawning
    shuffle: SeededRandom;  // Combat deck shuffles
    misc: SeededRandom;     // Everything else
}

/**
 * Serializable state for saving/loading
 */
export interface GameRNGState {
    seed: string;
    seedNumber: number;
    mapState: number;
    cardsState: number;
    relicsState: number;
    potionsState: number;
    eventsState: number;
    encountersState: number;
    shuffleState: number;
    miscState: number;
}

/**
 * Convert an alphanumeric seed string to a number
 * Uses a simple hash function for good distribution
 */
export function seedToNumber(seed: string): number {
    let hash = 0;
    const str = seed.toUpperCase();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash >>> 0; // Convert to 32-bit unsigned
    }
    // Ensure non-zero seed
    return hash || 1;
}

/**
 * Generate a random human-readable seed
 * Uses characters that are easy to read and type: no 0/O, 1/I/L confusion
 */
export function generateRandomSeed(length: number = 8): string {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let seed = '';
    for (let i = 0; i < length; i++) {
        seed += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return seed;
}

/**
 * Create a new GameRNG with the given seed
 * Each stream uses a different offset from the base seed to ensure independence
 */
export function createGameRNG(seed?: string): GameRNG {
    const actualSeed = seed || generateRandomSeed();
    const seedNum = seedToNumber(actualSeed);

    // Create separate streams with offset seeds
    // These offsets are prime numbers to minimize correlation
    return {
        seed: actualSeed,
        seedNumber: seedNum,
        map: new SeededRandom(seedNum),
        cards: new SeededRandom(seedNum + 7919),
        relics: new SeededRandom(seedNum + 104729),
        potions: new SeededRandom(seedNum + 224737),
        events: new SeededRandom(seedNum + 350377),
        encounters: new SeededRandom(seedNum + 479909),
        shuffle: new SeededRandom(seedNum + 611953),
        misc: new SeededRandom(seedNum + 746773),
    };
}

/**
 * Serialize GameRNG state for saving
 */
export function serializeRNG(rng: GameRNG): GameRNGState {
    return {
        seed: rng.seed,
        seedNumber: rng.seedNumber,
        mapState: rng.map.getState(),
        cardsState: rng.cards.getState(),
        relicsState: rng.relics.getState(),
        potionsState: rng.potions.getState(),
        eventsState: rng.events.getState(),
        encountersState: rng.encounters.getState(),
        shuffleState: rng.shuffle.getState(),
        miscState: rng.misc.getState(),
    };
}

/**
 * Deserialize saved RNG state
 */
export function deserializeRNG(state: GameRNGState): GameRNG {
    const rng = createGameRNG(state.seed);
    rng.map.setState(state.mapState);
    rng.cards.setState(state.cardsState);
    rng.relics.setState(state.relicsState);
    rng.potions.setState(state.potionsState);
    rng.events.setState(state.eventsState);
    rng.encounters.setState(state.encountersState);
    rng.shuffle.setState(state.shuffleState);
    rng.misc.setState(state.miscState);
    return rng;
}
