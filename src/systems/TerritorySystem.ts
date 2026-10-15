// src/systems/TerritorySystem.ts
import type { GameState, TerritoryId, BusinessId } from '../types/game';
import { bus } from '../core/EventBus';
import { TERRITORY_DEFS } from '../data/territories';

/** Constante de balanceamento: desconto por vizinho aliado ao cercar o alvo. */
const SIEGE_DISCOUNT_PER_NEIGHBOR = 0.1;
const MIN_CONQUEST_COST = 100; // clamp: custo nunca fica irrisório

/** Defesa de um território logo após trocar de dono. */
export const CONQUERED_DEFENSE = 30;
/** Tempo (s) para a defesa ir de 0 ao máximo fora de batalha. */
const DEFENSE_REGEN_FULL_SEC = 30;
/** Defesa adicionada por reforço comprado pelo jogador. */
export const REINFORCE_AMOUNT = 20;
/** Reforços podem levar a defesa até este múltiplo do máximo natural. */
const REINFORCE_CAP_MULTIPLIER = 3;
const REINFORCE_BASE_COST = 100;
const REINFORCE_COST_PER_DEFENSE = 10;

/** Defesa máxima: a original do território, nunca abaixo da defesa pós-conquista. */
export function getMaxDefense(id: TerritoryId): number {
  return Math.max(TERRITORY_DEFS[id].defense, CONQUERED_DEFENSE);
}

/** Teto de defesa alcançável com reforços. */
export function getReinforceCap(id: TerritoryId): number {
  return getMaxDefense(id) * REINFORCE_CAP_MULTIPLIER;
}

/** Custo do próximo reforço: cresce com a defesa atual (fortificar fica mais caro). */
export function getReinforceCost(state: GameState, id: TerritoryId): number {
  return Math.floor(REINFORCE_BASE_COST + REINFORCE_COST_PER_DEFENSE * state.territories[id].defense);
}

/** Só territórios do jogador abaixo do teto podem ser reforçados (inclusive em batalha). */
export function canReinforce(state: GameState, id: TerritoryId): boolean {
  const t = state.territories[id];
  return t.owner === 'player' && t.defense < getReinforceCap(id);
}

/** Jogador paga para aumentar a defesa de um território seu. */
export function reinforceTerritory(state: GameState, id: TerritoryId): boolean {
  if (!canReinforce(state, id)) return false;
  const cost = getReinforceCost(state, id);
  if (state.money < cost) return false;
  const t = state.territories[id];
  state.money -= cost;
  t.defense = Math.min(getReinforceCap(id), t.defense + REINFORCE_AMOUNT);
  bus.emit('log', { message: `🛡️ ${t.name} reforçado. Defesa: ${t.defense.toFixed(0)}` });
  bus.emit('map:dirty', {});
  return true;
}

/**
 * Territórios fora de batalha recuperam defesa aos poucos até o máximo.
 * Só avisa o mapa quando o valor exibido (arredondado) muda.
 */
export function tickTerritoryDefense(state: GameState, deltaSec: number): void {
  let changed = false;
  for (const t of Object.values(state.territories)) {
    if (state.activeBattles.some(b => b.territoryId === t.id)) continue;
    const max = getMaxDefense(t.id);
    if (t.defense >= max) continue;
    const before = Math.round(t.defense);
    t.defense = Math.min(max, t.defense + (max / DEFENSE_REGEN_FULL_SEC) * deltaSec);
    if (Math.round(t.defense) !== before) changed = true;
  }
  if (changed) bus.emit('map:dirty', {});
}

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
 * Vitória: o jogador controla todos os territórios do mapa.
 */
export function checkVictory(state: GameState): void {
  const all = Object.values(state.territories);
  if (!all.every(t => t.owner === 'player')) return;
  state.gameOver = true;
  state.won = true;
  state.gameOverReason = 'A cidade inteira é sua. Ninguém mais ousa te desafiar.';
  bus.emit('log', { message: `👑 Você dominou a cidade!` });
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
