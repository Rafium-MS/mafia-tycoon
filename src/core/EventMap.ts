// src/core/EventMap.ts
import type { FactionId, TerritoryId } from '../types/game';

/** Contrato de eventos do EventBus: nome do evento -> tipo do payload. */
export interface EventMap {
  income: { amount: number };
  heat: { level: number; warning: boolean };
  loyalty: { level: number };
  unlock: { message: string };
  gameover: { reason: string };
  rival_attack: { message: string; faction: FactionId };
  log: { message: string };
  'territory:click': { id: TerritoryId };
  'map:dirty': Record<string, never>;
}
