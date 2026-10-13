// src/ui/renderer.ts
import type { GameState, BusinessId, TerritoryId } from '../types/game';
import { getCost } from '../core/GameState';
import { getCrewRecruitCost } from '../systems/CrewSystem';
import { getConquestCost, canAttack } from '../systems/TerritorySystem';

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento #${id} não encontrado no DOM`);
  return el;
};

// Último HTML aplicado por elemento. Recriar botões a cada frame faz o navegador
// perder cliques (mousedown e mouseup caem em elementos diferentes).
const lastHtml = new WeakMap<HTMLElement, string>();

/** Atribui innerHTML apenas quando o conteúdo mudou. */
function setHTML(el: HTMLElement, html: string): void {
  if (lastHtml.get(el) === html) return;
  el.innerHTML = html;
  lastHtml.set(el, html);
}

/** Números de balanceamento expostos na UI. */
export const BRIBE_COST = 200;
export const BRIBE_HEAT_REDUCTION = 20;
export const PAY_CREW_COST = 100;

/** Renderiza os status gerais no topo da tela. */
export function renderStats(state: GameState): void {
  $('money').textContent = state.money.toFixed(0);
  $('respect').textContent = state.respect.toFixed(0);
  $('heat').textContent = state.heat.toFixed(1);
  $('loyalty').textContent = state.loyalty.toFixed(0);
  ($('heat-bar') as HTMLElement).style.width = `${state.heat}%`;
}

/** Renderiza a lista de esquemas (negócios). */
export function renderBusinesses(state: GameState): void {
  const list = $('businesses');
  const fragments: string[] = [];

  for (const [id, b] of Object.entries(state.businesses)) {
    if (!b.unlocked) {
      fragments.push(`<div class="biz locked">🔒 ${b.name} (Requer ${b.requiresRespect} respeito)</div>`);
      continue;
    }
    const cost = getCost(b);
    const canBuy = state.money >= cost;
    fragments.push(`
      <div class="biz">
        <div>
          <strong>${b.name}</strong> x${b.count}
          <div class="desc">${b.description} • +R$${b.baseIncome}/s • 🔥+${b.baseHeat}/s • ⭐+${b.baseRespect}/s</div>
        </div>
        <button data-id="${id}" ${canBuy ? '' : 'disabled'}>Comprar (R$ ${cost})</button>
      </div>
    `);
  }

  setHTML(list, fragments.join(''));

  ($('bribe') as HTMLButtonElement).textContent = `💸 Subornar Polícia (-${BRIBE_HEAT_REDUCTION} calor) — R$ ${BRIBE_COST}`;
  ($('pay') as HTMLButtonElement).textContent = `🤝 Pagar Família (+10 lealdade) — R$ ${PAY_CREW_COST}`;
}

/** Renderiza o mapa de territórios. */
export function renderTerritories(state: GameState): void {
  const container = $('territories');
  const fragments: string[] = [];

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

    fragments.push(`
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
    `);
  }

  setHTML(container, fragments.join(''));
}

/** Renderiza a seção de capangas. */
export function renderCrew(state: GameState): void {
  $('crew').textContent = String(state.crew);
  const recruitCost = getCrewRecruitCost(state);
  $('recruit-cost').textContent = String(recruitCost);
  ($('recruit') as HTMLButtonElement).disabled = state.money < recruitCost;
}

/** Renderiza as batalhas ativas. */
export function renderBattles(state: GameState): void {
  const container = $('battles');
  if (state.activeBattles.length === 0) {
    setHTML(container, '<div class="desc">Nenhuma batalha em andamento.</div>');
    return;
  }
  setHTML(container, state.activeBattles.map(b => {
    const t = state.territories[b.territoryId];
    const attacker = state.factions[b.attacker];
    const defender = state.factions[b.defender];
    return `<div class="battle-row">
      ${attacker.name} ⚔️ ${defender.name} — ${t.name} • Defesa restante: ${t.defense.toFixed(0)}
    </div>`;
  }).join(''));
}

/** Renderiza o log de eventos (últimos 8). */
export function renderLog(state: GameState): void {
  const container = $('log');
  const recent = state.log.slice(-8).reverse();
  setHTML(container, recent.length
    ? recent.map(m => `<div class="log-entry">${m}</div>`).join('')
    : '<div class="desc">Sem novidades… por enquanto.</div>');
}

/** Tela de fim de jogo. */
export function renderGameOver(state: GameState): void {
  $('app').innerHTML = `
    <h1>💀 FIM DE JOGO</h1>
    <p>${state.gameOverReason ?? 'A família caiu.'}</p>
    <p>Dinheiro final: R$ ${state.money.toFixed(0)}</p>
    <p>Respeito: ${state.respect.toFixed(0)}</p>
    <p>Territórios conquistados: ${Object.values(state.territories).filter(t => t.owner === 'player').length}</p>
    <button id="restart">🔄 Recomeçar</button>
  `;
}

export type { BusinessId, TerritoryId };
