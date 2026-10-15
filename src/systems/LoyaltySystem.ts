// src/systems/LoyaltySystem.ts
import type { GameState } from '../types/game';
import { bus } from '../core/EventBus';

export function tickLoyalty(state: GameState, deltaSec: number): void {
  // Sem dinheiro pra pagar a crew? Lealdade cai.
  const payrollPressure = state.crew > 0 && state.money < state.crew * 5 ? 2 : 0;
  // Calor alto deixa a crew nervosa
  const heatPressure = state.heat > 70 ? 1 : 0;

  state.loyalty -= (payrollPressure + heatPressure) * deltaSec;
  state.loyalty = Math.max(0, Math.min(100, state.loyalty));

  if (state.loyalty <= 0) {
    state.gameOver = true;
    state.gameOverReason = 'Sua própria família te traiu.';
    bus.emit('gameover', { reason: state.gameOverReason });
  }
}

export function payCrew(state: GameState, amount: number): boolean {
  if (state.money < amount) return false;
  state.money -= amount;
  state.loyalty = Math.min(100, state.loyalty + 10);
  bus.emit('loyalty', { level: state.loyalty });
  return true;
}
