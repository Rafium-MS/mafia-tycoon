// src/main.ts
import { createInitialState, getCost } from './core/GameState';
import { GameLoop } from './core/GameLoop';
import { buyBusiness } from './systems/EconomySystem';
import { bribePolice } from './systems/HeatSystem';
import { payCrew } from './systems/LoyaltySystem';
import { bus } from './core/EventBus';
import type { BusinessId } from './types/game';

const state = createInitialState();
const loop = new GameLoop(state, render);
loop.start();

const $ = (id: string) => document.getElementById(id)!;
// src/main.ts (adicionar ao render)

import { getCrewRecruitCost, recruitCrew } from './systems/CrewSystem';
import { getConquestCost, canAttack, getPlayerAttackPower } from './systems/TerritorySystem';
import { startPlayerAttack } from './systems/BattleSystem';

function renderTerritories(): void {
  const container = $('territories');
  container.innerHTML = '';

  for (const t of Object.values(state.territories)) {
    const owner = state.factions[t.owner];
    const attackable = canAttack(state, t.id);
    const cost = getConquestCost(state, t.id);
    const battle = state.activeBattles.find(b => b.territoryId === t.id);

    let actionHtml = '';
    if (battle) {
      actionHtml = `<span class="battle">⚔️ EM BATALHA</span>`;
    } else if (attackable) {
      actionHtml = `<button data-attack="${t.id}" ${state.money >= cost ? '' : 'disabled'}>Atacar (R$ ${cost})</button>`;
    }

    container.innerHTML += `
      <div class="territory" style="border-left: 4px solid ${owner.color}">
        <div class="terr-header">
          <strong>${t.name}</strong>
          <span class="owner" style="color: ${owner.color}">${owner.name}</span>
        </div>
        <div class="desc">${t.description}</div>
        <div class="bonus">Bônus: +${Math.round(t.bonus.multiplier * 100)}% em ${state.businesses[t.bonus.business].name}</div>
        <div class="defense">Defesa: ${t.defense.toFixed(0)}</div>
        ${actionHtml}
      </div>
    `;
  }
}

function renderBattles(): void {
  const container = $('battles');
  if (state.activeBattles.length === 0) {
    container.innerHTML = '<div class="desc">Nenhuma batalha em andamento.</div>';
    return;
  }
  container.innerHTML = state.activeBattles.map(b => {
    const t = state.territories[b.territoryId];
    const attacker = state.factions[b.attacker];
    return `<div class="battle-row">
      ${attacker.name} atacando ${t.name} — Defesa restante: ${t.defense.toFixed(0)}
    </div>`;
  }).join('');
}

// Dentro do render(), adicionar:
renderTerritories();
renderBattles();
$('crew').textContent = String(state.crew);
$('recruit-cost').textContent = String(getCrewRecruitCost(state));
($('recruit') as HTMLButtonElement).disabled = state.money < getCrewRecruitCost(state);

// E no handler de cliques:
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'BUTTON') {
    if (target.dataset.id) buyBusiness(state, target.dataset.id as BusinessId);
    if (target.dataset.attack) startPlayerAttack(state, target.dataset.attack as TerritoryId);
    if (target.id === 'recruit') recruitCrew(state);
    // ... resto
  }
});
function render(): void {
  if (state.gameOver) {
    $('app').innerHTML = `
      <h1>💀 FIM DE JOGO</h1>
      <p>${state.gameOverReason}</p>
      <p>Dinheiro final: R$ ${state.money.toFixed(0)}</p>
      <p>Respeito: ${state.respect}</p>
    `;
    loop.stop();
    return;
  }

  $('money').textContent = state.money.toFixed(0);
  $('respect').textContent = state.respect.toFixed(0);
  $('heat').textContent = state.heat.toFixed(1);
  $('loyalty').textContent = state.loyalty.toFixed(0);

  // Barra de calor
  ($('heat-bar') as HTMLElement).style.width = `${state.heat}%`;

  // Lista de negócios
  const list = $('businesses');
  list.innerHTML = '';
  for (const [id, b] of Object.entries(state.businesses)) {
    if (!b.unlocked) {
      list.innerHTML += `<div class="biz locked">🔒 ${b.name} (Requer ${b.requiresRespect} respeito)</div>`;
      continue;
    }
    const cost = getCost(b);
    const canBuy = state.money >= cost;
    list.innerHTML += `
      <div class="biz">
        <div>
          <strong>${b.name}</strong> x${b.count}
          <div class="desc">${b.description} • +R$${b.baseIncome}/s • 🔥+${b.baseHeat}/s</div>
        </div>
        <button data-id="${id}" ${canBuy ? '' : 'disabled'}>Comprar (R$ ${cost})</button>
      </div>
    `;
  }

  // Ações
  ($('bribe') as HTMLButtonElement).textContent = `💸 Subornar Polícia (-20 calor) — R$ 200`;
  ($('pay') as HTMLButtonElement).textContent = `🤝 Pagar Família (+10 lealdade) — R$ 100`;
}

// Eventos de UI
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'BUTTON' && target.dataset.id) {
    buyBusiness(state, target.dataset.id as BusinessId);
  }
  if (target.id === 'bribe') bribePolice(state, 200, 20);
  if (target.id === 'pay') payCrew(state, 100);
});

// Desbloqueio por respeito
bus.on('income', () => {
  // a cada tick checa unlocks
  for (const b of Object.values(state.businesses)) {
    if (!b.unlocked && state.respect >= b.requiresRespect) {
      b.unlocked = true;
    }
  }
});