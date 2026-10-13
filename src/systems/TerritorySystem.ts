// src/systems/TerritorySystem.ts
import type { GameState, TerritoryId, BusinessId } from '../types/game';
import { bus } from '../core/EventBus';

/**
 * Calcula o multiplicador total para um negócio baseado nos territórios controlados.
 * Ex: se você controla docks (smuggling +0.6) e mais nada que afete smuggling,
 * smuggling rende 1.6x o valor base.
 */
export function getBusinessMultiplier(state: GameState, business: BusinessId): number {
  let bonus = 0;
  for (const t of Object.values(state.territories)) {
    if (t.owner === 'player' && t.bonus.business === business) {
      bonus += t.bonus.multiplier;
    }
  }
  return 1 + bonus;
}

export function getPlayerTerritories(state: GameState): TerritoryId[] {
  return Object.values(state.territories)
    .filter(t => t.owner === 'player')
    .map(t => t.id);
}

/**
 * Verifica se o jogador pode atacar um território (precisa ser vizinho de algum que ele controla).
 */
export function canAttack(state: GameState, id: TerritoryId): boolean {
  const target = state.territories[id];
  if (target.owner === 'player') return false;
  return target.neighbors.some(nId => state.territories[nId].owner === 'player');
}

/**
 * Poder de ataque do jogador = capangas disponíveis + bônus de respeito.
 */
export function getPlayerAttackPower(state: GameState): number {
  const availableCrew = state.crew - state.crewInBattle;
  return availableCrew * 2 + Math.floor(state.respect / 10);
}

/**
 * Custo de conquista: aumenta se o território já foi atacado antes (defesa reforçada).
 */
export function getConquestCost(state: GameState, id: TerritoryId): number {
  const t = state.territories[id];
  // Cada vizinho do jogador dá um pequeno desconto (cercar o alvo)
  const friendlyNeighbors = t.neighbors.filter(n => state.territories[n].owner === 'player').length;
  return Math.floor(t.conquestCost * (1 - friendlyNeighbors * 0.1));
}