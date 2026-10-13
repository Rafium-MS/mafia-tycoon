// src/systems/TerritorySystem.ts
import type { GameState, TerritoryId, BusinessId } from '../types/game';

/** Constante de balanceamento: desconto por vizinho aliado ao cercar o alvo. */
const SIEGE_DISCOUNT_PER_NEIGHBOR = 0.1;
const MIN_CONQUEST_COST = 100; // clamp: custo nunca fica irrisório

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
 * Custo de conquista: diminui conforme você cerca o alvo com territórios aliados.
 */
export function getConquestCost(state: GameState, id: TerritoryId): number {
  const t = state.territories[id];
  // Cada vizinho do jogador dá um pequeno desconto (cercar o alvo)
  const friendlyNeighbors = t.neighbors.filter(n => state.territories[n].owner === 'player').length;
  const discounted = t.conquestCost * (1 - friendlyNeighbors * SIEGE_DISCOUNT_PER_NEIGHBOR);
  return Math.max(MIN_CONQUEST_COST, Math.floor(discounted));
}
