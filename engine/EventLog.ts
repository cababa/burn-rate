import type { GameEvent } from './events.ts';

/**
 * Append-only in-memory log of GameEvents produced by the reducer.
 * The UI layer typically calls drain() after each logical step
 * (e.g. a card play or turn resolution) to consume events.
 */
export interface IEventLog {
  append(event: GameEvent): void;
  appendMany(events: GameEvent[]): void;
  /**
   * Returns all currently recorded events and clears the log.
   */
  drain(): GameEvent[];
  /**
   * Returns a shallow copy of the internal event list without clearing it.
   * Useful for debugging or inspection.
   */
  peekAll(): GameEvent[];
}

export class EventLog implements IEventLog {
  private events: GameEvent[] = [];

  append(event: GameEvent): void {
    this.events.push(event);
  }

  appendMany(events: GameEvent[]): void {
    if (events.length === 0) return;
    this.events.push(...events);
  }

  drain(): GameEvent[] {
    const copy = this.events;
    this.events = [];
    return copy;
  }

  peekAll(): GameEvent[] {
    return [...this.events];
  }
}