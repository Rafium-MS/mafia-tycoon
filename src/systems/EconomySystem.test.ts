import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../types/game';
import { createInitialState, getCost } from '../core/GameState';
import { tickEconomy, buyBusiness, getNetIncomePerSec, isInsolvent, tickBankruptcy } from './EconomySystem';

let state: GameState;
beforeEach(() => { state = createInitialState(); });

describe('getCost', () => {
  it('cresce 1.15x por unidade comprada', () => {
    const b = state.businesses.loan_shark;
    expect(getCost(b)).toBe(15);
    b.count = 2;
    expect(getCost(b)).toBe(Math.floor(15 * 1.15 ** 2));
  });
});

describe('tickEconomy', () => {
  it('soma renda com o bônus do território controlado', () => {
    state.businesses.loan_shark.count = 2;
    state.money = 0;
    tickEconomy(state, 1);
    // Little Italy (do jogador) dá +50% em Agiotagem: 2 × 1 × 1.5
    expect(state.money).toBeCloseTo(3);
  });

  it('gera respeito passivo pelos esquemas', () => {
    state.businesses.numbers.count = 3;
    tickEconomy(state, 10);
    expect(state.respect).toBeCloseTo(0.1 * 3 * 10);
  });

  it('desbloqueia esquemas quando o respeito chega ao mínimo', () => {
    expect(state.businesses.protection.unlocked).toBe(false);
    state.respect = 10;
    tickEconomy(state, 0.1);
    expect(state.businesses.protection.unlocked).toBe(true);
    expect(state.businesses.numbers.unlocked).toBe(false);
  });
});

describe('buyBusiness', () => {
  it('cobra o custo e incrementa a quantidade', () => {
    state.money = 100;
    expect(buyBusiness(state, 'loan_shark')).toBe(true);
    expect(state.money).toBe(85);
    expect(state.businesses.loan_shark.count).toBe(1);
  });

  it('recusa sem dinheiro ou com esquema bloqueado', () => {
    state.money = 10;
    expect(buyBusiness(state, 'loan_shark')).toBe(false);
    state.money = 1_000_000;
    expect(buyBusiness(state, 'casino')).toBe(false);
    expect(state.businesses.casino.count).toBe(0);
  });
});

describe('falência', () => {
  it('renda líquida desconta o salário dos capangas', () => {
    state.businesses.loan_shark.count = 1;
    state.crew = 2;
    expect(getNetIncomePerSec(state)).toBeCloseTo(1.5 - 1);
  });

  it('é insolvente só sem renda líquida E sem dinheiro para o esquema mais barato', () => {
    state.money = 20; // estado inicial: 1 capanga, nenhum esquema
    expect(isInsolvent(state)).toBe(false);
    state.money = 14;
    expect(isInsolvent(state)).toBe(true);
    state.businesses.loan_shark.count = 1; // renda 1.5/s > 0.5/s de salário
    expect(isInsolvent(state)).toBe(false);
  });

  it('60s seguidos insolvente encerram a partida', () => {
    state.money = 0;
    state.crew = 0;
    tickBankruptcy(state, 59);
    expect(state.gameOver).toBe(false);
    tickBankruptcy(state, 1);
    expect(state.gameOver).toBe(true);
    expect(state.gameOverReason).toMatch(/faliu/);
  });

  it('o contador zera quando o jogador volta a ser solvente', () => {
    state.money = 0;
    tickBankruptcy(state, 50);
    state.money = 20;
    tickBankruptcy(state, 0.1);
    expect(state.insolventSeconds).toBe(0);
    state.money = 0;
    tickBankruptcy(state, 50);
    expect(state.gameOver).toBe(false);
  });
});
