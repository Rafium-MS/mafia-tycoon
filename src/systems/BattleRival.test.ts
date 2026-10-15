import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { GameState, Battle } from '../types/game';
import { createInitialState } from '../core/GameState';
import { startPlayerAttack, tickBattles } from './BattleSystem';
import { tickRivals, getFactionPowerCap } from './RivalSystem';

// As batalhas resolvem a cada 2s e a IA age a cada 5s; os timers ficam no módulo,
// então cada tick abaixo usa o intervalo inteiro para forçar uma resolução.
const BATTLE_TICK = 2;
const RIVAL_TICK = 5;

let state: GameState;
beforeEach(() => {
  state = createInitialState();
  vi.spyOn(Math, 'random').mockReturnValue(0.5); // rolagens no meio (sem variância, sem perda de capanga)
});
afterEach(() => {
  vi.restoreAllMocks();
});

const rivalBattle = (
  territoryId: Battle['territoryId'],
  attacker: Battle['attacker'],
  defender: Battle['defender'],
  attackerPower: number,
): Battle => ({ territoryId, attacker, defender, attackerPower, defenderPower: 0, startedAt: 0 });

describe('startPlayerAttack', () => {
  it('cobra o custo, cria a batalha e compromete capangas', () => {
    state.money = 5000;
    state.crew = 3;
    expect(startPlayerAttack(state, 'downtown')).toBe(true);
    expect(state.money).toBe(5000 - 2700);
    expect(state.activeBattles).toHaveLength(1);
    expect(state.crewInBattle).toBe(3);
  });

  it('recusa sem dinheiro, sem capangas ou com batalha já ativa', () => {
    state.money = 100;
    expect(startPlayerAttack(state, 'downtown')).toBe(false);
    state.money = 10_000;
    state.crew = 0;
    expect(startPlayerAttack(state, 'downtown')).toBe(false);
    state.crew = 3;
    expect(startPlayerAttack(state, 'downtown')).toBe(true);
    expect(startPlayerAttack(state, 'downtown')).toBe(false);
  });
});

describe('tickBattles', () => {
  it('conquista do jogador: troca o dono, dá respeito e libera os capangas', () => {
    state.money = 10_000;
    state.crew = 3;
    state.territories.downtown.defense = 1;
    startPlayerAttack(state, 'downtown');
    tickBattles(state, BATTLE_TICK);
    expect(state.territories.downtown.owner).toBe('player');
    expect(state.territories.downtown.defense).toBe(30);
    expect(state.respect).toBe(25);
    expect(state.crewInBattle).toBe(0);
    expect(state.activeBattles).toHaveLength(0);
  });

  it('rival tomando território de outro rival não penaliza o jogador', () => {
    state.respect = 50;
    state.territories.docks.defense = 1;
    state.activeBattles = [rivalBattle('docks', 'bratva', 'marcone', 70)];
    tickBattles(state, BATTLE_TICK);
    expect(state.territories.docks.owner).toBe('bratva');
    expect(state.respect).toBe(50);
    expect(state.loyalty).toBe(100);
  });

  it('rival tomando território do jogador tira respeito e lealdade', () => {
    state.respect = 50;
    state.territories.downtown.owner = 'player';
    state.territories.downtown.defense = 1;
    state.activeBattles = [rivalBattle('downtown', 'tongs', 'player', 45)];
    tickBattles(state, BATTLE_TICK);
    expect(state.territories.downtown.owner).toBe('tongs');
    expect(state.respect).toBe(40);
    expect(state.loyalty).toBe(95);
  });
});

describe('tickRivals', () => {
  it('poder das facções para no teto de 2× o inicial', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // nenhuma facção decide atacar
    state.factions.bratva.power = 900; // save antigo sem limite
    state.factions.tongs.power = 89.5;
    tickRivals(state, RIVAL_TICK);
    expect(getFactionPowerCap('bratva')).toBe(140);
    expect(state.factions.bratva.power).toBe(140);
    expect(state.factions.tongs.power).toBe(90);
  });

  it('facção sem território não cresce', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    state.territories.docks.owner = 'player';
    tickRivals(state, RIVAL_TICK);
    expect(state.factions.marcone.power).toBe(30);
  });
});
