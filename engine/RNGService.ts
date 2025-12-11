import type { SeededRandom, GameRNG } from '../rng.ts';

/**
 * Names of the logical RNG streams available in GameRNG.
 * These map directly to fields on the GameRNG interface.
 */
export type RNGStreamName =
  | 'map'
  | 'cards'
  | 'relics'
  | 'potions'
  | 'events'
  | 'encounters'
  | 'shuffle'
  | 'misc';

export interface RNGServiceOptions {
  rng: GameRNG;
  stream?: RNGStreamName;
}

/**
 * Thin wrapper over a SeededRandom stream from GameRNG.
 * Keeps track of which logical stream is in use and exposes
 * common helpers for the reducer and effect handlers.
 */
export class RNGService {
  private readonly stream: SeededRandom;
  private readonly name: RNGStreamName;

  constructor(options: RNGServiceOptions) {
    this.name = options.stream ?? 'misc';
    this.stream = options.rng[this.name];
  }

  /**
   * Returns a float in range [0, 1).
   */
  next(): number {
    return this.stream.next();
  }

  /**
   * Returns an integer in range [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return this.stream.nextInt(min, max);
  }

  /**
   * Picks a random element from an array.
   * Throws if the array is empty.
   */
  pick<T>(array: T[]): T {
    return this.stream.pick(array);
  }

  /**
   * Returns a shuffled copy of the provided array.
   */
  shuffle<T>(array: T[]): T[] {
    return this.stream.shuffle(array);
  }

  /**
   * Name of the underlying RNG stream (for debugging / logging).
   */
  getStreamName(): RNGStreamName {
    return this.name;
  }
}