// src/core/GameState.ts (atualizar)

import { BUSINESS_DEFS } from '../data/businesses';
import { TERRITORY_DEFS, FACTION_DEFS } from '../data/territories';
import type { GameState, Business, BusinessId, Territory, TerritoryId, Faction, FactionId } from '../types/game';

export function createInitialState(): GameState {
  const businesses = {} as Record<BusinessId, Business>;
  for (const [id, def] of Object.entries(BUSINESS_DEFS)) {
    businesses[id as BusinessId] = { ...def, count: 0, unlocked: def.requiresRespect === 0 };
  }

  const territories = {} as Record<TerritoryId, Territory>;
  for (const [id, def] of Object.entries(TERRITORY_DEFS)) {
    territories[id as TerritoryId] = { ...def, owner: def.originalOwner };
  }

  const factions = {} as Record<FactionId, Faction>;
  for (const [id, def] of Object.entries(FACTION_DEFS)) {
    factions[id as FactionId] = { ...def };
  }

  return {
    money: 20,
    respect: 0,
    heat: 0,
    loyalty: 100,
    businesses,
    territories,
    factions,
    activeBattles: [],
    crew: 0,
    crewInBattle: 0,
    territory: [],
    gameOver: false,
    lastTick: performance.now(),
    log: [],
  };
}

export function getCost(business: Business): number {
  return Math.floor(business.baseCost * Math.pow(1.15, business.count));
}