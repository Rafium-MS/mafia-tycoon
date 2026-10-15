// src/core/EventBus.ts
import type { EventMap } from './EventMap';

type Handler<T> = (payload: T) => void;

/** Handlers indexados por evento, cada lista tipada com o payload do seu evento. */
type HandlerMap = { [K in keyof EventMap]?: Handler<EventMap[K]>[] };

export class EventBus {
  private handlers: HandlerMap = {};

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    const list: Handler<EventMap[K]>[] = this.handlers[event] ?? [];
    list.push(handler);
    // O TS não consegue provar escrita em índice genérico (K); a leitura acima já é tipada
    this.handlers[event] = list as HandlerMap[K];
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const list: Handler<EventMap[K]>[] | undefined = this.handlers[event];
    list?.forEach((h) => h(payload));
  }
}

export const bus = new EventBus();
