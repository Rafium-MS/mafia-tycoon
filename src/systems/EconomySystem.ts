// src/systems/EconomySystem.ts
import type { GameState, BusinessId } from '../types/game';
import { getCost } from '../core/GameState';
import { getBusinessMultiplier } from './TerritorySystem';
import { bus } from '../core/EventBus';

export function tickEconomy(state: GameState, deltaSec: number): void {
  let income = 0;
  let respect = 0;

  for (const b of Object.values(state.businesses)) {
    if (b.count > 0) {
      // Aplica o bônus de território
      const multiplier = getBusinessMultiplier(state, b.id);
      income += b.baseIncome * b.count * multiplier * deltaSec;
      // Esquemas rendendo constroem reputação nas ruas
      respect += b.baseRespect * b.count * deltaSec;
    }
  }

  state.money += income;
  state.respect += respect;
  if (income > 0) bus.emit('income', { amount: income });

  // Desbloqueio por respeito (checado a cada tick da economia)
  for (const b of Object.values(state.businesses)) {
    if (!b.unlocked && state.respect >= b.requiresRespect) {
      b.unlocked = true;
      bus.emit('log', { message: `🔓 Novo esquema disponível: ${b.name}!` });
    }
  }
}

export function buyBusiness(state: GameState, id: BusinessId): boolean {
  const b = state.businesses[id];
  if (!b) return false;
  const cost = getCost(b);
  if (!b.unlocked || state.money < cost) return false;
  state.money -= cost;
  b.count += 1;
  bus.emit('log', { message: `💼 ${b.name} expandida (x${b.count}).` });
  return true;
}
