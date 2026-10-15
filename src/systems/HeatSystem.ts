// src/systems/HeatSystem.ts
import type { GameState } from '../types/game';
import { bus } from '../core/EventBus';

const HEAT_DECAY_PER_SEC = 0.5; // calor cai sozinho
const HEAT_PER_BIZ_RATE = 0.05; // multiplicador do calor das businesses

export function tickHeat(state: GameState, deltaSec: number): void {
  let heatGain = 0;
  for (const b of Object.values(state.businesses)) {
    if (b.count > 0) heatGain += b.baseHeat * b.count * HEAT_PER_BIZ_RATE;
  }

  // Capangas ajudam a "esfriar" (suborno/pressão)
  const crewCooling = Math.min(state.crew * 0.3, 3);
  state.heat += (heatGain - HEAT_DECAY_PER_SEC - crewCooling) * deltaSec;
  state.heat = Math.max(0, Math.min(100, state.heat));

  if (state.heat >= 100) {
    state.gameOver = true;
    state.gameOverReason = 'A polícia te pegou. A família caiu.';
    bus.emit('gameover', { reason: state.gameOverReason });
  } else if (state.heat > 80) {
    bus.emit('heat', { level: state.heat, warning: true });
  }
}

export function bribePolice(state: GameState, cost: number, heatReduction: number): boolean {
  if (state.money < cost) return false;
  state.money -= cost;
  state.heat = Math.max(0, state.heat - heatReduction);
  bus.emit('heat', { level: state.heat, warning: false });
  return true;
}
