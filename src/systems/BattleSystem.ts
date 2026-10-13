// src/systems/BattleSystem.ts
import type { GameState, TerritoryId, FactionId, Battle } from '../types/game';
import { bus } from '../core/EventBus';
import { getPlayerAttackPower } from './TerritorySystem';

const BATTLE_TICK_INTERVAL = 2;   // batalhas resolvem a cada 2s
const BATTLE_COST_CREW_LOSS = 0.15; // 15% de chance de perder 1 capanga por tick

let battleTimer = 0;

/**
 * Jogador inicia ataque a um território.
 */
export function startPlayerAttack(state: GameState, id: TerritoryId): boolean {
  const target = state.territories[id];
  if (target.owner === 'player') return false;

  const cost = target.conquestCost;
  const attackPower = getPlayerAttackPower(state);

  if (state.money < cost) {
    bus.emit('log', { message: `Dinheiro insuficiente para atacar ${target.name}.` });
    return false;
  }
  if (attackPower <= 0) {
    bus.emit('log', { message: `Sem capangas disponíveis para o ataque.` });
    return false;
  }

  state.money -= cost;

  const battle: Battle = {
    territoryId: id,
    attacker: 'player',
    defender: target.owner,
    attackerPower: attackPower,
    defenderPower: target.defense,
    startedAt: performance.now(),
  };

  state.activeBattles.push(battle);
  bus.emit('log', { message: `⚔️ Ataque iniciado a ${target.name}!` });
  return true;
}

/**
 * Tick principal de batalhas. Resolve combates em andamento.
 */
export function tickBattles(state: GameState, deltaSec: number): void {
  battleTimer += deltaSec;
  if (battleTimer < BATTLE_TICK_INTERVAL) return;
  battleTimer = 0;

  const remaining: Battle[] = [];

  for (const battle of state.activeBattles) {
    const territory = state.territories[battle.territoryId];

    // IA defende se ainda possui
    if (territory.owner !== battle.defender) {
      // Território já foi tomado por outro - batalha obsoleta
      continue;
    }

    // Aplica dano de ambos os lados
    const attackRoll = battle.attackerPower * (0.8 + Math.random() * 0.4);
    const defenseRoll = battle.defenderPower * (0.8 + Math.random() * 0.4);

    // Atacante causa dano na defesa
    territory.defense = Math.max(0, territory.defense - attackRoll * 0.5);

    // Defensor causa baixas no atacante
    if (battle.attacker === 'player') {
      if (Math.random() < BATTLE_COST_CREW_LOSS) {
        state.crew = Math.max(0, state.crew - 1);
        bus.emit('log', { message: `💀 Você perdeu um capanga na guerra.` });
      }
    } else {
      // IA atacando o jogador
      territory.defense = Math.max(0, territory.defense - attackRoll * 0.5);
    }

    // Aumenta calor durante batalhas
    state.heat = Math.min(100, state.heat + 0.5);

    // Verifica resolução
    if (territory.defense <= 0) {
      const previousOwner = territory.owner;
      territory.owner = battle.attacker;
      territory.defense = battle.attacker === 'player' ? 30 : territory.defense; // re-fortifica

      // Recompensa de respeito por conquistar
      if (battle.attacker === 'player') {
        state.respect += 25;
        bus.emit('log', { message: `🏆 Você tomou ${territory.name} de ${previousOwner}!` });
      } else {
        bus.emit('log', { message: `💥 Você perdeu ${territory.name} para ${battle.attacker}!` });
      }

      // IA retalia - fica ciente do jogador
      const attackerFaction = state.factions[battle.attacker];
      if (battle.attacker === 'player') {
        state.factions[previousOwner].awareOfPlayer = true;
      }
      continue;
    }

    // Ainda em batalha, mantém
    remaining.push(battle);
  }

  state.activeBattles = remaining;
}