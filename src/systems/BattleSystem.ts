// src/systems/BattleSystem.ts
import type { GameState, TerritoryId, Battle } from '../types/game';
import { bus } from '../core/EventBus';
import { getPlayerAttackPower, getConquestCost, CONQUERED_DEFENSE } from './TerritorySystem';

const BATTLE_TICK_INTERVAL = 2; // batalhas resolvem a cada 2s
const CREW_LOSS_CHANCE = 0.15; // chance de perder 1 capanga por resolução

// Timer de resolução de batalhas (fora do estado serializável)
let battleTimer = 0;

/**
 * Jogador inicia ataque a um território.
 */
export function startPlayerAttack(state: GameState, id: TerritoryId): boolean {
  const target = state.territories[id];
  if (!target || target.owner === 'player') return false;

  // Já existe batalha neste território?
  if (state.activeBattles.some((b) => b.territoryId === id)) return false;

  const cost = getConquestCost(state, id);
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
  // Capangas ficam comprometidos durante a batalha
  state.crewInBattle += Math.min(state.crew - state.crewInBattle, Math.ceil(attackPower / 2));
  bus.emit('log', { message: `⚔️ Ataque iniciado a ${target.name}!` });
  bus.emit('map:dirty', {});
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
  let mapChanged = false;

  for (const battle of state.activeBattles) {
    const territory = state.territories[battle.territoryId];

    // Território já mudou de dono — batalha obsoleta
    if (territory.owner !== battle.defender) {
      mapChanged = true;
      continue;
    }

    // Aplica dano do atacante na defesa (com variância ±20%)
    const attackRoll = battle.attackerPower * (0.8 + Math.random() * 0.4);
    territory.defense = Math.max(0, territory.defense - attackRoll * 0.5);

    // Defensor causa baixas no atacante jogador
    if (battle.attacker === 'player') {
      if (Math.random() < CREW_LOSS_CHANCE) {
        state.crew = Math.max(0, state.crew - 1);
        state.crewInBattle = Math.min(state.crewInBattle, state.crew);
        bus.emit('log', { message: `💀 Você perdeu um capanga na guerra.` });
      }
    } else {
      // IA atacando: defensor (incluindo territórios do jogador) revida
      // e reduz o poder da facção atacante a cada resolução
      const defenseRoll = territory.defense * (0.8 + Math.random() * 0.4);
      const attackerFaction = state.factions[battle.attacker];
      attackerFaction.power = Math.max(5, attackerFaction.power - defenseRoll * 0.3);
    }

    // Aumenta calor durante batalhas
    state.heat = Math.min(100, state.heat + 0.5);
    mapChanged = true; // defesa mudou — mapas com barra de defesa precisam refletir

    // Verifica resolução
    if (territory.defense <= 0) {
      const previousOwner = territory.owner;
      territory.owner = battle.attacker;
      territory.defense = CONQUERED_DEFENSE; // re-fortifica após conquista

      if (battle.attacker === 'player') {
        state.respect += 25;
        const prevName = state.factions[previousOwner].name;
        bus.emit('log', { message: `🏆 Você tomou ${territory.name} de ${prevName}!` });
        // Facção derrotada fica ciente do jogador e quer retomar
        state.factions[previousOwner].awareOfPlayer = true;
      } else if (previousOwner === 'player') {
        // Só penaliza quando o território perdido era do jogador (rival x rival não afeta)
        const attackerName = state.factions[battle.attacker].name;
        bus.emit('log', { message: `💥 Você perdeu ${territory.name} para ${attackerName}!` });
        // Perder território derruba respeito e lealdade
        state.respect = Math.max(0, state.respect - 10);
        state.loyalty = Math.max(0, state.loyalty - 5);
      }
      continue;
    }

    // Ainda em batalha, mantém
    remaining.push(battle);
  }

  state.activeBattles = remaining;
  // Só depois de atualizar a lista dá para saber se o jogador ainda luta
  releasePlayerCrew(state);

  // Notifica o mapa que algo relevante mudou (donos/defesas/batalhas)
  if (mapChanged) {
    bus.emit('map:dirty', {});
  }
}

/** Libera os capangas quando as batalhas do jogador terminam. */
function releasePlayerCrew(state: GameState): void {
  const playerStillFighting = state.activeBattles.some((b) => b.attacker === 'player');
  if (!playerStillFighting) state.crewInBattle = 0;
}
