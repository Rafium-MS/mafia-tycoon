// src/systems/CrewSystem.ts
import type { GameState } from '../types/game';
import { bus } from '../core/EventBus';

const CREW_COST_BASE = 500;
const CREW_COST_MULTIPLIER = 1.8;
export const CREW_UPKEEP_PER_SEC = 0.5; // cada capanga custa $0.5/s

export function getCrewRecruitCost(state: GameState): number {
  return Math.floor(CREW_COST_BASE * Math.pow(CREW_COST_MULTIPLIER, state.crew));
}

export function recruitCrew(state: GameState): boolean {
  const cost = getCrewRecruitCost(state);
  if (state.money < cost) return false;
  state.money -= cost;
  state.crew += 1;
  bus.emit('log', { message: `👤 Capanga recrutado. Total: ${state.crew}` });
  return true;
}

export function tickCrewUpkeep(state: GameState, deltaSec: number): void {
  const upkeep = state.crew * CREW_UPKEEP_PER_SEC * deltaSec;
  state.money -= upkeep;
  if (state.money < 0) {
    state.money = 0;
    // Sem dinheiro pra pagar, lealdade cai
    state.loyalty -= deltaSec * 2;
  }
}