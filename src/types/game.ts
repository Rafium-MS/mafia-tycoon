// src/types/game.ts

export type BusinessId = 'loan_shark' | 'protection' | 'numbers' | 'smuggling' | 'casino';
export type FactionId = 'police' | 'rival_marcone' | 'rival_tongs' | 'rival_bratva';

export interface Business {
  id: BusinessId;
  name: string;
  description: string;
  baseCost: number;
  baseIncome: number;      // $ por segundo por unidade
  baseHeat: number;        // calor por segundo por unidade
  count: number;           // quantos você possui
  unlocked: boolean;
  requiresRespect: number; // respeito mínimo para desbloquear
}

export interface GameState {
  money: number;
  respect: number;         // desbloqueia coisas
  heat: number;            // 0-100; ao chegar em 100 = prisão
  loyalty: number;         // 0-100; baixa = traição
  businesses: Record<BusinessId, Business>;
  territory: TerritoryId[]; // territórios controlados
  crew: number;            // número de capangas
  gameOver: boolean;
  gameOverReason?: string;
  lastTick: number;
}

// src/types/game.ts (adicionar/atualizar)

export type TerritoryId = 'little_italy' | 'docks' | 'downtown' | 'chinatown' | 'red_light';

export type FactionId = 'player' | 'marcone' | 'tongs' | 'bratva' | 'police';

export interface Territory {
  id: TerritoryId;
  name: string;
  description: string;
  owner: FactionId;
  // Bônus percentual para um tipo de negócio (0.5 = +50%)
  bonus: { business: BusinessId; multiplier: number };
  // Custo base para tentar tomar
  conquestCost: number;
  // Resistência: quanto mais, mais difícil tomar
  defense: number;
  // Facção que controla originalmente (para IA querer retomar)
  originalOwner: FactionId;
  // Adjacências - só pode atacar territórios vizinhos de algum que você já controla
  neighbors: TerritoryId[];
}

export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  power: number;              // força militar (usada em batalhas)
  aggression: number;         // 0-1, quanto ataca por tick
  // IA só age se o jogador estiver "no radar" dela
  awareOfPlayer: boolean;
}

export interface Battle {
  territoryId: TerritoryId;
  attacker: FactionId;
  defender: FactionId;
  attackerPower: number;
  defenderPower: number;
  startedAt: number;
}

export interface GameState {
  // ...campos anteriores
  territories: Record<TerritoryId, Territory>;
  factions: Record<FactionId, Faction>;
  activeBattles: Battle[];
  crew: number;               // capangas (poder militar do jogador)
  crewInBattle: number;       // capangas comprometidos em batalha
  log: string[];              // histórico de eventos
}

export interface GameEvent {
  type: 'income' | 'heat' | 'loyalty' | 'unlock' | 'gameover' | 'rival_attack';
  message: string;
  timestamp: number;
}
