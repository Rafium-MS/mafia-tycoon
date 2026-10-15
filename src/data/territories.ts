// src/data/territories.ts
import type { Territory, TerritoryId, Faction, FactionId } from '../types/game';

/** Posição/raio visual de um território no mapa SVG. */
export interface TerritoryVisual {
  x: number; // 0-800 (coordenada SVG)
  y: number; // 0-500
  radius: number; // tamanho do nó
}

// Mapa pensado para caber em viewBox "0 0 800 500"
export const TERRITORY_POSITIONS: Record<TerritoryId, TerritoryVisual> = {
  little_italy: { x: 220, y: 350, radius: 55 }, // sudoeste (berço)
  docks: { x: 180, y: 150, radius: 60 }, // noroeste (porto)
  downtown: { x: 420, y: 260, radius: 65 }, // centro
  chinatown: { x: 620, y: 380, radius: 60 }, // sudeste
  red_light: { x: 620, y: 130, radius: 65 }, // nordeste (zona rica)
};

/** Nomes curtos exibidos dentro dos nós do mapa SVG. */
export const TERRITORY_SHORT_NAMES: Record<TerritoryId, string> = {
  little_italy: 'Little Italy',
  docks: 'Porto',
  downtown: 'Centro',
  chinatown: 'Chinatown',
  red_light: 'Red Light',
};

// Vizinhos ajustados para ficar visualmente coerentes com o mapa
export const TERRITORY_DEFS: Record<TerritoryId, Omit<Territory, 'owner'>> = {
  little_italy: {
    id: 'little_italy',
    name: TERRITORY_SHORT_NAMES.little_italy,
    description: 'Berço da família. Ruas que te conhecem.',
    bonus: { business: 'loan_shark', multiplier: 0.5 },
    conquestCost: 0,
    defense: 10,
    originalOwner: 'player',
    neighbors: ['docks', 'downtown'], // (era downtown, docks) — sem mudança visual
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
    neighbors: ['little_italy', 'docks', 'chinatown', 'red_light'],
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
    neighbors: ['docks', 'downtown', 'chinatown'],
  },
};

export const FACTION_DEFS: Record<FactionId, Faction> = {
  player: {
    id: 'player',
    name: 'Sua Família',
    color: '#d4a574',
    power: 0,
    aggression: 0,
    awareOfPlayer: true,
  },
  marcone: {
    id: 'marcone',
    name: 'Família Marcone',
    color: '#4a6fa5',
    power: 30,
    aggression: 0.3,
    awareOfPlayer: false,
  },
  tongs: {
    id: 'tongs',
    name: 'Tong',
    color: '#8b2f9e',
    power: 45,
    aggression: 0.4,
    awareOfPlayer: false,
  },
  bratva: {
    id: 'bratva',
    name: 'Bratva',
    color: '#b8232b',
    power: 70,
    aggression: 0.6,
    awareOfPlayer: false,
  },
  police: {
    id: 'police',
    name: 'Polícia',
    color: '#2c5aa0',
    power: 20,
    aggression: 0,
    awareOfPlayer: false,
  },
};
