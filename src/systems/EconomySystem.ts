// src/systems/EconomySystem.ts
import type { GameState, BusinessId } from '../types/game';
import { getCost } from '../core/GameState';
import { getBusinessMultiplier } from './TerritorySystem';
import { bus } from '../core/EventBus';
import { CREW_UPKEEP_PER_SEC } from './CrewSystem';

const BANKRUPTCY_LIMIT_SEC = 60; // tempo insolvente até a derrota
const BANKRUPTCY_WARNING_SEC = 15; // aviso final antes da derrota

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

/** Renda líquida por segundo: esquemas (com bônus de território) menos salário dos capangas. */
export function getNetIncomePerSec(state: GameState): number {
  let income = 0;
  for (const b of Object.values(state.businesses)) {
    if (b.count > 0) income += b.baseIncome * b.count * getBusinessMultiplier(state, b.id);
  }
  return income - state.crew * CREW_UPKEEP_PER_SEC;
}

/**
 * Insolvente = renda líquida ≤ 0 e dinheiro abaixo do esquema mais barato:
 * não há como voltar a crescer sozinho.
 */
export function isInsolvent(state: GameState): boolean {
  if (getNetIncomePerSec(state) > 0) return false;
  const costs = Object.values(state.businesses)
    .filter((b) => b.unlocked)
    .map(getCost);
  return state.money < Math.min(...costs);
}

/** Falência prolongada: insolvente por BANKRUPTCY_LIMIT_SEC seguidos = derrota. */
export function tickBankruptcy(state: GameState, deltaSec: number): void {
  if (state.gameOver) return;

  if (!isInsolvent(state)) {
    if ((state.insolventSeconds ?? 0) > 0)
      bus.emit('log', { message: `😮‍💨 As contas voltaram a fechar.` });
    state.insolventSeconds = 0;
    return;
  }

  const before = state.insolventSeconds ?? 0;
  const after = before + deltaSec;
  state.insolventSeconds = after;

  if (before === 0) {
    bus.emit('log', {
      message: `⚠️ Sem renda e sem dinheiro para investir. Falência em ${BANKRUPTCY_LIMIT_SEC}s!`,
    });
  } else if (
    before < BANKRUPTCY_LIMIT_SEC - BANKRUPTCY_WARNING_SEC &&
    after >= BANKRUPTCY_LIMIT_SEC - BANKRUPTCY_WARNING_SEC
  ) {
    bus.emit('log', { message: `⏳ Falência em ${BANKRUPTCY_WARNING_SEC}s!` });
  }

  if (after >= BANKRUPTCY_LIMIT_SEC) {
    state.gameOver = true;
    state.gameOverReason = 'Os cofres secaram. A família faliu.';
    bus.emit('gameover', { reason: state.gameOverReason });
  }
}
