import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../types/game';
import { createInitialState } from '../core/GameState';
import { tickHeat, bribePolice } from './HeatSystem';
import { tickLoyalty, payCrew } from './LoyaltySystem';
import { getCrewRecruitCost, recruitCrew, tickCrewUpkeep } from './CrewSystem';

let state: GameState;
beforeEach(() => { state = createInitialState(); });

describe('HeatSystem', () => {
  it('calor sobe com esquemas e é limitado a 0-100', () => {
    state.crew = 0;
    state.businesses.casino.count = 20; // 15 × 20 × 0.05 = 15/s, menos 0.5 de decaimento
    tickHeat(state, 1);
    expect(state.heat).toBeCloseTo(14.5);
    state.businesses.casino.count = 0;
    tickHeat(state, 1000);
    expect(state.heat).toBe(0);
  });

  it('calor 100 encerra a partida', () => {
    state.crew = 0;
    state.heat = 99.9;
    state.businesses.casino.count = 20;
    tickHeat(state, 1);
    expect(state.gameOver).toBe(true);
    expect(state.gameOverReason).toMatch(/polícia/);
  });

  it('suborno reduz calor e cobra o valor', () => {
    state.heat = 50;
    state.money = 300;
    expect(bribePolice(state, 200, 20)).toBe(true);
    expect(state.heat).toBe(30);
    expect(state.money).toBe(100);
    expect(bribePolice(state, 200, 20)).toBe(false);
  });
});

describe('LoyaltySystem', () => {
  it('cai sem dinheiro para a folha e com calor alto', () => {
    state.crew = 2;
    state.money = 0; // < 2 × 5
    state.heat = 80;
    tickLoyalty(state, 1);
    expect(state.loyalty).toBe(100 - 3);
  });

  it('lealdade 0 encerra a partida', () => {
    state.loyalty = 1;
    state.money = 0;
    tickLoyalty(state, 1);
    expect(state.gameOver).toBe(true);
    expect(state.gameOverReason).toMatch(/traiu/);
  });

  it('pagar a família dá +10 até o limite de 100', () => {
    state.loyalty = 95;
    state.money = 100;
    expect(payCrew(state, 100)).toBe(true);
    expect(state.loyalty).toBe(100);
    expect(payCrew(state, 100)).toBe(false);
  });
});

describe('CrewSystem', () => {
  it('custo de recrutamento cresce 1.8x por capanga', () => {
    state.crew = 2;
    expect(getCrewRecruitCost(state)).toBe(Math.floor(500 * 1.8 ** 2));
  });

  it('recrutar cobra e adiciona um capanga', () => {
    state.money = 1000;
    expect(recruitCrew(state)).toBe(true);
    expect(state.crew).toBe(2);
    expect(state.money).toBe(100);
    expect(recruitCrew(state)).toBe(false);
  });

  it('salário não deixa o dinheiro negativo e derruba a lealdade', () => {
    state.crew = 4;
    state.money = 1;
    tickCrewUpkeep(state, 1);
    expect(state.money).toBe(0);
    expect(state.loyalty).toBe(98);
  });
});
