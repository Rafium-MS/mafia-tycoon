// src/ui/MapRenderer.ts
import type { GameState, TerritoryId } from '../types/game';
import { TERRITORY_POSITIONS, TERRITORY_SHORT_NAMES } from '../data/territories';
import {
  canAttack,
  getConquestCost,
  canReinforce,
  getReinforceCost,
} from '../systems/TerritorySystem';
import { startPlayerAttack } from '../systems/BattleSystem';
import { bus } from '../core/EventBus';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class MapRenderer {
  private svg: SVGSVGElement;
  private connectionsGroup: SVGGElement;
  private nodesGroup: SVGGElement;
  private readonly state: GameState;
  /** Território sob o ponteiro no pointerdown (os nós são recriados a cada render). */
  private pressedId: TerritoryId | null = null;

  constructor(container: HTMLElement, state: GameState) {
    this.state = state;
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('viewBox', '0 0 800 500');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.classList.add('map-svg');

    this.connectionsGroup = document.createElementNS(SVG_NS, 'g');
    this.connectionsGroup.classList.add('connections');
    this.svg.appendChild(this.connectionsGroup);

    this.nodesGroup = document.createElementNS(SVG_NS, 'g');
    this.nodesGroup.classList.add('nodes');
    this.svg.appendChild(this.nodesGroup);

    container.appendChild(this.svg);

    // O mapa é redesenhado com frequência (ex.: recuperação de defesa). Um clique
    // comum se perde se o nó for recriado entre pressionar e soltar, então o
    // clique é reconhecido pelo território, não pelo elemento.
    this.svg.addEventListener('pointerdown', (e) => {
      this.pressedId = e.button === 0 ? territoryIdAt(e.target) : null;
    });
    this.svg.addEventListener('pointerup', (e) => {
      const id = territoryIdAt(e.target);
      if (e.button === 0 && id && id === this.pressedId) {
        bus.emit('territory:click', { id });
      }
      this.pressedId = null;
    });

    // Delegação de eventos via EventBus
    bus.on('territory:click', ({ id }) => {
      this.onTerritoryClick(id);
    });

    this.render();
  }

  render(): void {
    this.renderConnections();
    this.renderNodes();
  }

  private renderConnections(): void {
    this.connectionsGroup.innerHTML = '';
    const drawn = new Set<string>();

    for (const territory of Object.values(this.state.territories)) {
      const from = TERRITORY_POSITIONS[territory.id];

      for (const neighborId of territory.neighbors) {
        // Evita desenhar duas vezes (A→B e B→A)
        const key = [territory.id, neighborId].sort().join('--');
        if (drawn.has(key)) continue;
        drawn.add(key);

        const to = TERRITORY_POSITIONS[neighborId];
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', String(from.x));
        line.setAttribute('y1', String(from.y));
        line.setAttribute('x2', String(to.x));
        line.setAttribute('y2', String(to.y));
        line.classList.add('connection-line');

        // Se AMBOS os lados são do jogador, a linha fica dourada (rota segura)
        const a = this.state.territories[territory.id];
        const b = this.state.territories[neighborId];
        if (a.owner === 'player' && b.owner === 'player') {
          line.classList.add('connection-safe');
        }

        this.connectionsGroup.appendChild(line);
      }
    }
  }

  private renderNodes(): void {
    this.nodesGroup.innerHTML = '';

    for (const territory of Object.values(this.state.territories)) {
      const pos = TERRITORY_POSITIONS[territory.id];
      const faction = this.state.factions[territory.owner];
      const isPlayer = territory.owner === 'player';
      const attackable = canAttack(this.state, territory.id);
      const inBattle = this.state.activeBattles.some((b) => b.territoryId === territory.id);

      const group = document.createElementNS(SVG_NS, 'g');
      group.classList.add('territory-node');
      group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);

      if (isPlayer) group.classList.add('territory-player');
      if (attackable && !isPlayer) group.classList.add('territory-attackable');
      if (inBattle) group.classList.add('territory-battle');

      // Halo (círculo externo com cor da facção)
      const halo = document.createElementNS(SVG_NS, 'circle');
      halo.setAttribute('r', String(pos.radius + 6));
      halo.classList.add('territory-halo');
      halo.setAttribute('fill', faction.color);
      halo.setAttribute('opacity', '0.15');
      group.appendChild(halo);

      // Corpo principal
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('r', String(pos.radius));
      circle.setAttribute('fill', '#1a1a1a');
      circle.setAttribute('stroke', faction.color);
      circle.setAttribute('stroke-width', isPlayer ? '4' : '3');
      group.appendChild(circle);

      // Nome
      const name = document.createElementNS(SVG_NS, 'text');
      name.setAttribute('y', '-8');
      name.setAttribute('text-anchor', 'middle');
      name.classList.add('territory-name');
      name.textContent = TERRITORY_SHORT_NAMES[territory.id];
      group.appendChild(name);

      // Dono
      const ownerText = document.createElementNS(SVG_NS, 'text');
      ownerText.setAttribute('y', '12');
      ownerText.setAttribute('text-anchor', 'middle');
      ownerText.classList.add('territory-owner');
      ownerText.setAttribute('fill', faction.color);
      ownerText.textContent = isPlayer ? 'SUA' : (faction.name.split(' ')[1] ?? faction.name);
      group.appendChild(ownerText);

      // Defesa (quando em batalha ou relevante)
      if (inBattle || isPlayer || attackable) {
        const defenseText = document.createElementNS(SVG_NS, 'text');
        defenseText.setAttribute('y', '32');
        defenseText.setAttribute('text-anchor', 'middle');
        defenseText.classList.add('territory-defense');
        defenseText.textContent = `🛡 ${territory.defense.toFixed(0)}`;
        group.appendChild(defenseText);
      }

      // Indicador de batalha
      if (inBattle) {
        const battleIcon = document.createElementNS(SVG_NS, 'text');
        battleIcon.setAttribute('y', String(-pos.radius - 12));
        battleIcon.setAttribute('text-anchor', 'middle');
        battleIcon.classList.add('territory-battle-icon');
        battleIcon.textContent = '⚔️';
        group.appendChild(battleIcon);
      }

      // Cursor e clique
      if (attackable && !isPlayer) {
        group.style.cursor = 'pointer';
      } else {
        group.style.cursor = 'default';
      }

      group.dataset.territory = territory.id;

      // Tooltip nativo do SVG
      const tooltip = document.createElementNS(SVG_NS, 'title');
      tooltip.textContent = this.buildTooltip(territory.id);
      group.appendChild(tooltip);

      this.nodesGroup.appendChild(group);
    }
  }

  private buildTooltip(id: TerritoryId): string {
    const t = this.state.territories[id];
    const business = this.state.businesses[t.bonus.business];
    const bonusPct = Math.round(t.bonus.multiplier * 100);
    const lines = [
      t.name,
      `Dono: ${this.state.factions[t.owner].name}`,
      `Bônus: +${bonusPct}% em ${business.name}`,
      `Defesa: ${t.defense.toFixed(0)}`,
    ];

    if (canAttack(this.state, id)) {
      const cost = getConquestCost(this.state, id);
      lines.push(`---`, `Custo de ataque: R$ ${cost}`);
    } else if (canReinforce(this.state, id)) {
      lines.push(`---`, `Reforço: R$ ${getReinforceCost(this.state, id)}`);
    }
    return lines.join('\n');
  }

  private onTerritoryClick(id: TerritoryId): void {
    const t = this.state.territories[id];
    if (t.owner === 'player') return;
    if (!canAttack(this.state, id)) {
      bus.emit('log', { message: `Você não tem um território vizinho a ${t.name}.` });
      return;
    }
    startPlayerAttack(this.state, id);
  }
}

/** Id do território sob o alvo de um evento de ponteiro, se houver. */
function territoryIdAt(target: EventTarget | null): TerritoryId | null {
  if (!(target instanceof Element)) return null;
  const node = target.closest<SVGGElement>('[data-territory]');
  return (node?.dataset.territory as TerritoryId | undefined) ?? null;
}
