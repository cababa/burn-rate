import type { Action } from './actions.ts';

/**
 * Simple FIFO queue for engine Actions.
 */
export interface IActionQueue {
  enqueue(action: Action): void;
  enqueueMany(actions: Action[]): void;
  dequeue(): Action | undefined;
  peek(): Action | undefined;
  isEmpty(): boolean;
  /** Snapshot of current queue contents for debugging. */
  toArray(): Action[];
}

export class ActionQueue implements IActionQueue {
  private queue: Action[] = [];

  enqueue(action: Action): void {
    this.queue.push(action);
  }

  enqueueMany(actions: Action[]): void {
    if (actions.length === 0) return;
    this.queue.push(...actions);
  }

  dequeue(): Action | undefined {
    return this.queue.shift();
  }

  peek(): Action | undefined {
    return this.queue[0];
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  toArray(): Action[] {
    return [...this.queue];
  }
}