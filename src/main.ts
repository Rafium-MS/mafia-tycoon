// src/main.ts
import './ui/styles.css';
import { createInitialState } from './core/GameState';
import { GameLoop } from './core/GameLoop';
import { bus } from './core/EventBus';
import { buyBusiness } from './systems/EconomySystem';
import { bribePolice } from './systems/HeatSystem';
import { payCrew } from './systems/LoyaltySystem';
import { recruitCrew } from './systems/CrewSystem';
import { startPlayerAttack } from './systems/BattleSystem';
import { MapRenderer } from './ui/MapRenderer';
import type { BusinessId, TerritoryId, GameState } from './types/game';
import {
  renderStats,
  renderBusinesses,
  renderCrew,
  renderBattles,
  renderLog,
  renderGameOver,
  BRIBE_COST,
  BRIBE_HEAT_REDUCTION,
  PAY_CREW_COST,
} from './ui/renderer';

const SAVE_KEY = 'mafia-tycoon-save';
const LOG_LIMIT = 50;

let state: GameState = loadGame() ?? createInitialState();
const loop = new GameLoop(state, render);

// Cria o mapa UMA VEZ (ele se auto-renderiza)
const mapContainer = document.getElementById('map')!;
const mapRenderer = new MapRenderer(mapContainer, state);

// >>> MAPA: re-renderiza apenas quando marcado como sujo (bus.emit('map:dirty'))
let mapDirty = true;
bus.on('map:dirty', () => { mapDirty = true; });

/** Render completo da interface. */
function render(): void {
  if (state.gameOver) {
    renderGameOver(state);
    loop.stop();
    localStorage.removeItem(SAVE_KEY);
    return;
  }
  renderStats(state);
  renderBusinesses(state);
  if (mapDirty) {
    mapRenderer.render();
    mapDirty = false;
  }
  renderCrew(state);
  renderBattles(state);
  renderLog(state);
}

// ---------- EventBus -> log do jogo ----------
bus.on('log', ({ message }) => {
  state.log.push(message);
  if (state.log.length > LOG_LIMIT) state.log.shift();
});

bus.on('gameover', () => {
  saveGame();
});

// ---------- Persistência ----------
function saveGame(): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* armazenamento indisponível — segue sem salvar */
  }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    // Sanidade mínima: só carrega saves com a estrutura esperada
    if (typeof parsed.money !== 'number' || !parsed.businesses || !parsed.territories) return null;
    parsed.lastTick = performance.now();
    return parsed;
  } catch {
    return null;
  }
}

setInterval(saveGame, 5000);
window.addEventListener('beforeunload', saveGame);

// ---------- Eventos de UI (delegação única) ----------
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;

  if (target.dataset.id) {
    buyBusiness(state, target.dataset.id as BusinessId);
  } else if (target.dataset.attack) {
    startPlayerAttack(state, target.dataset.attack as TerritoryId);
  } else if (target.id === 'recruit') {
    recruitCrew(state);
  } else if (target.id === 'bribe') {
    bribePolice(state, BRIBE_COST, BRIBE_HEAT_REDUCTION);
  } else if (target.id === 'pay') {
    payCrew(state, PAY_CREW_COST);
  } else if (target.id === 'restart') {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
});

loop.start();
