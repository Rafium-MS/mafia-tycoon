// src/core/EventBus.ts

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Handler<any>[]>();

  on<T>(event: string, handler: Handler<T>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  emit<T>(event: string, payload: T): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }
}

export const bus = new EventBus();