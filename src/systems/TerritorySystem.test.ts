import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, Battle } from '../types/game';
import { createInitialState } from '../core/GameState';
import {
  getBusinessMultiplier,
  canAttack,
  getPlayerAttackPower,
  getConquestCost,
  checkVictory,
  getMaxDefense,
  tickTerritoryDefense,
  getReinforceCap,
  getReinforceCost,
  canReinforce,
  reinforceTerritory,
} from './TerritorySystem';

let state: GameState;
beforeEach(() => {
  state = createInitialState();
});

const battle = (
  territoryId: Battle['territoryId'],
  attacker: Battle['attacker'],
  defender: Battle['defender'],
): Battle => ({
  territoryId,
  attacker,
  defender,
  attackerPower: 0,
  defenderPower: 0,
  startedAt: 0,
});

describe('bônus e ataque', () => {
  it('multiplicador soma os bônus dos territórios do jogador', () => {
    expect(getBusinessMultiplier(state, 'loan_shark')).toBe(1.5);
    expect(getBusinessMultiplier(state, 'smuggling')).toBe(1);
    state.territories.docks.owner = 'player';
    expect(getBusinessMultiplier(state, 'smuggling')).toBe(1.6);
  });

  it('só ataca vizinhos de territórios do jogador', () => {
    expect(canAttack(state, 'downtown')).toBe(true);
    expect(canAttack(state, 'chinatown')).toBe(false);
    expect(canAttack(state, 'little_italy')).toBe(false); // já é do jogador
  });

  it('poder de ataque = capangas livres × 2 + respeito / 10', () => {
    state.crew = 3;
    state.crewInBattle = 1;
    state.respect = 25;
    expect(getPlayerAttackPower(state)).toBe(2 * 2 + 2);
  });

  it('custo de conquista tem desconto por vizinho aliado e mínimo de 100', () => {
    expect(getConquestCost(state, 'downtown')).toBe(2700); // 1 vizinho: -10%
    state.territories.docks.owner = 'player';
    expect(getConquestCost(state, 'downtown')).toBe(2400); // 2 vizinhos: -20%
  });
});

describe('checkVictory', () => {
  it('vence ao controlar todos os territórios', () => {
    for (const t of Object.values(state.territories)) t.owner = 'player';
    checkVictory(state);
    expect(state.gameOver).toBe(true);
    expect(state.won).toBe(true);
  });

  it('não vence faltando um território', () => {
    for (const t of Object.values(state.territories)) t.owner = 'player';
    state.territories.red_light.owner = 'bratva';
    checkVictory(state);
    expect(state.gameOver).toBe(false);
  });
});

describe('recuperação de defesa', () => {
  it('máximo é a defesa original, nunca abaixo de 30', () => {
    expect(getMaxDefense('little_italy')).toBe(30); // original 10
    expect(getMaxDefense('red_light')).toBe(90);
  });

  it('recupera do zero ao máximo em 30s e para no máximo', () => {
    state.territories.red_light.defense = 0;
    tickTerritoryDefense(state, 10);
    expect(state.territories.red_light.defense).toBeCloseTo(30);
    tickTerritoryDefense(state, 100);
    expect(state.territories.red_light.defense).toBe(90);
  });

  it('não recupera durante batalha', () => {
    state.territories.docks.defense = 5;
    state.activeBattles = [battle('docks', 'bratva', 'marcone')];
    tickTerritoryDefense(state, 10);
    expect(state.territories.docks.defense).toBe(5);
  });

  it('não reduz defesa acima do máximo (reforçada)', () => {
    state.territories.little_italy.defense = 80;
    tickTerritoryDefense(state, 10);
    expect(state.territories.little_italy.defense).toBe(80);
  });
});

describe('reforço', () => {
  it('+20 de defesa por 100 + 10 × defesa atual', () => {
    state.money = 10_000;
    state.territories.little_italy.defense = 30;
    expect(getReinforceCost(state, 'little_italy')).toBe(400);
    expect(reinforceTerritory(state, 'little_italy')).toBe(true);
    expect(state.territories.little_italy.defense).toBe(50);
    expect(state.money).toBe(9600);
  });

  it('para no teto de 3× o máximo', () => {
    state.money = 100_000;
    state.territories.little_italy.defense = 85;
    expect(getReinforceCap('little_italy')).toBe(90);
    reinforceTerritory(state, 'little_italy');
    expect(state.territories.little_italy.defense).toBe(90);
    expect(canReinforce(state, 'little_italy')).toBe(false);
    expect(reinforceTerritory(state, 'little_italy')).toBe(false);
  });

  it('só territórios do jogador, e só com dinheiro', () => {
    state.money = 100_000;
    expect(reinforceTerritory(state, 'docks')).toBe(false);
    state.money = 50;
    expect(reinforceTerritory(state, 'little_italy')).toBe(false);
  });

  it('funciona durante batalha', () => {
    state.money = 10_000;
    state.territories.little_italy.defense = 30;
    state.activeBattles = [battle('little_italy', 'marcone', 'player')];
    expect(reinforceTerritory(state, 'little_italy')).toBe(true);
    expect(state.territories.little_italy.defense).toBe(50);
  });
});
