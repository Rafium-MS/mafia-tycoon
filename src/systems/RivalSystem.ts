// src/systems/RivalSystem.ts
import type { GameState, TerritoryId, FactionId, Battle } from '../types/game';
import { bus } from '../core/EventBus';
import { FACTION_DEFS } from '../data/territories';

const RIVAL_TICK_INTERVAL = 5;   // IA age a cada 5s
const RIVAL_POWER_CAP_MULTIPLIER = 2; // teto de poder = 2x o poder inicial da facção

/** Poder máximo que uma facção pode acumular crescendo sozinha. */
export function getFactionPowerCap(faction: FactionId): number {
  return FACTION_DEFS[faction].power * RIVAL_POWER_CAP_MULTIPLIER;
}

// Timer da IA (fora do estado serializável)
let rivalTimer = 0;

/**
 * Cada facção ganha poder passivamente e, se agressiva, ataca territórios.
 */
export function tickRivals(state: GameState, deltaSec: number): void {
  rivalTimer += deltaSec;
  if (rivalTimer < RIVAL_TICK_INTERVAL) return;
  rivalTimer = 0;

  // 1. Facções crescem até o teto; sem território, não há de onde tirar força
  for (const faction of Object.values(state.factions)) {
    if (faction.id === 'player' || faction.id === 'police') continue;
    const cap = getFactionPowerCap(faction.id);
    const hasTerritory = Object.values(state.territories).some(t => t.owner === faction.id);
    if (hasTerritory) faction.power += faction.aggression * 2;
    // O clamp também corrige saves antigos que cresceram sem limite
    faction.power = Math.min(faction.power, cap);
  }

  // 2. Facções decidem atacar
  for (const faction of Object.values(state.factions)) {
    if (faction.id === 'player' || faction.id === 'police') continue;

    // Chance de agir baseada em agressão
    if (Math.random() > faction.aggression * 0.3) continue;

    // Se ainda não está ciente do jogador, ataca rivais
    // Se está ciente, prioriza territórios dele vizinhos aos seus
    const targets = pickTargets(state, faction.id);

    if (targets.length === 0) continue;

    const targetId = targets[Math.floor(Math.random() * targets.length)];
    initiateRivalAttack(state, faction.id, targetId);
  }
}

function pickTargets(state: GameState, faction: FactionId): TerritoryId[] {
  const factionTerritories = Object.values(state.territories)
    .filter(t => t.owner === faction);

  if (factionTerritories.length === 0) return [];

  const candidates = new Set<TerritoryId>();
  const factionState = state.factions[faction];

  for (const ft of factionTerritories) {
    for (const neighborId of ft.neighbors) {
      const neighbor = state.territories[neighborId];
      // Não ataca a si mesmo
      if (neighbor.owner === faction) continue;

      // Se está ciente do jogador, prioriza territórios dele
      if (factionState.awareOfPlayer && neighbor.owner === 'player') {
        candidates.add(neighborId);
      } else if (!factionState.awareOfPlayer && neighbor.owner !== 'player') {
        // Antes de estar ciente, ataca outros rivais
        candidates.add(neighborId);
      }
    }
  }

  return Array.from(candidates);
}

function initiateRivalAttack(state: GameState, attacker: FactionId, targetId: TerritoryId): void {
  const territory = state.territories[targetId];
  const attackerFaction = state.factions[attacker];

  // Se já existe batalha nesse território, ignora
  if (state.activeBattles.some(b => b.territoryId === targetId)) return;

  const battle: Battle = {
    territoryId: targetId,
    attacker,
    defender: territory.owner,
    attackerPower: attackerFaction.power,
    defenderPower: territory.defense,
    startedAt: performance.now(),
  };

  state.activeBattles.push(battle);

  if (territory.owner === 'player') {
    bus.emit('log', { message: `🚨 ${attackerFaction.name} está atacando ${territory.name}!` });
    bus.emit('rival_attack', { message: `${attackerFaction.name} ataca ${territory.name}`, faction: attacker });
  }
  bus.emit('map:dirty', {});
}

/**
 * Reduz calor quando jogador mantém territórios em paz (incentiva equilíbrio).
 */
export function getPassiveHeatReduction(state: GameState): number {
  const controlled = Object.values(state.territories).filter(t => t.owner === 'player').length;
  return controlled * 0.1; // cada território reduz um pouco o calor passivo
}
