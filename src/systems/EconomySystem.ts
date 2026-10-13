// src/systems/EconomySystem.ts
import type { GameState } from '../types/game';
import { getCost } from '../core/GameState';
import { getBusinessMultiplier } from './TerritorySystem';
import { bus } from '../core/EventBus';

export function tickEconomy(state: GameState, deltaSec: number): void {
  let income = 0;

  for (const b of Object.values(state.businesses)) {
    if (b.count > 0) {
      // APLICA O BÔNUS DE TERRITÓRIO
      const multiplier = getBusinessMultiplier(state, b.id);
      income += b.baseIncome * b.count * multiplier * deltaSec;
    }
  }

  state.money += income;
  if (income > 0) bus.emit('income', { amount: income });
}

export function buyBusiness(state: GameState, id: keyof typeof state.businesses): boolean {
  const b = state.businesses[id];
  const cost = getCost(b);
  if (!b.unlocked || state.money < cost) return false;
  state.money -= cost;
  b.count += 1;
  return true;
}

export function tickEconomy(state: GameState, deltaSec: number): void {
  let income = 0;

  for (const b of Object.values(state.businesses)) {
    if (b.count > 0) {
      income += b.baseIncome * b.count * deltaSec;
    }
  }

  state.money += income;
  if (income > 0) bus.emit('income', { amount: income });
}

export function buyBusiness(state: GameState, id: keyof typeof state.businesses): boolean {
  const b = state.businesses[id];
  const cost = getCost(b);
  if (!b.unlocked || state.money < cost) return false;

  state.money -= cost;
  b.count += 1;
  return true;
}