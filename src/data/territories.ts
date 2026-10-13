// src/data/territories.ts
import type { Territory, TerritoryId, Faction, FactionId } from '../types/game';

export const TERRITORY_DEFS: Record<TerritoryId, Omit<Territory, 'owner'>> = {
  little_italy: {
    id: 'little_italy',
    name: 'Little Italy',
    description: 'Berço da família. Ruas que te conhecem.',
    bonus: { business: 'loan_shark', multiplier: 0.5 },
    conquestCost: 0,
    defense: 10,
    originalOwner: 'player',
    neighbors: ['downtown', 'docks'],
  },
  docks: {
    id: 'docks',
    name: 'Porto',
    description: 'Contêineres que ninguém fiscaliza.',
    bonus: { business: 'smuggling', multiplier: 0.6 },
    conquestCost: 8000,
    defense: 40,
    originalOwner: 'marcone',
    neighbors: ['little_italy', 'downtown', 'red_light'],
  },
  downtown: {
    id: 'downtown',
    name: 'Centro',
    description: 'Lojas ricas. Polícia em cada esquina.',
    bonus: { business: 'protection', multiplier: 0.4 },
    conquestCost: 3000,
    defense: 25,
    originalOwner: 'police',
    neighbors: ['little_italy', 'docks', 'chinatown'],
  },
  chinatown: {
    id: 'chinatown',
    name: 'Chinatown',
    description: 'Becos onde a sorte se vende barato.',
    bonus: { business: 'numbers', multiplier: 0.5 },
    conquestCost: 12000,
    defense: 55,
    originalOwner: 'tongs',
    neighbors: ['downtown', 'red_light'],
  },
  red_light: {
    id: 'red_light',
    name: 'Red Light',
    description: 'Onde os ricos perdem tudo sem perceber.',
    bonus: { business: 'casino', multiplier: 0.7 },
    conquestCost: 60000,
    defense: 90,
    originalOwner: 'bratva',
    neighbors: ['docks', 'chinatown'],
  },
};

export const FACTION_DEFS: Record<FactionId, Faction> = {
  player:   { id: 'player',   name: 'Sua Família',      color: '#d4a574', power: 0,  aggression: 0,   awareOfPlayer: true },
  marcone:  { id: 'marcone',  name: 'Família Marcone',  color: '#4a6fa5', power: 30, aggression: 0.3, awareOfPlayer: false },
  tongs:    { id: 'tongs',    name: 'Tong',             color: '#8b2f9e', power: 45, aggression: 0.4, awareOfPlayer: false },
  bratva:   { id: 'bratva',   name: 'Bratva',           color: '#b8232b', power: 70, aggression: 0.6, awareOfPlayer: false },
  police:   { id: 'police',   name: 'Polícia',          color: '#2c5aa0', power: 20, aggression: 0,   awareOfPlayer: false },
};