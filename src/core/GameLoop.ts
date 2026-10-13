// src/core/GameLoop.ts
import type { GameState } from '../types/game';
import { tickEconomy } from '../systems/EconomySystem';
import { tickHeat } from '../systems/HeatSystem';
import { tickLoyalty } from '../systems/LoyaltySystem';
import { tickBattles } from '../systems/BattleSystem';
import { tickRivals, getPassiveHeatReduction } from '../systems/RivalSystem';
import { tickCrewUpkeep } from '../systems/CrewSystem';

export class GameLoop {
  private accumulator = 0;
  private readonly TICK_RATE = 1 / 10;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private state: GameState;
  private onTick: () => void;

  constructor(state: GameState, onTick: () => void) {
    this.state = state;
    this.onTick = onTick;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number): void => {
    const deltaSec = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.accumulator += deltaSec;

    while (this.accumulator >= this.TICK_RATE) {
      this.tick(this.TICK_RATE);
      this.accumulator -= this.TICK_RATE;
    }

    this.onTick();
    // onTick pode ter chamado stop() — não agenda o próximo frame nesse caso
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
  };

  private tick(dt: number): void {
    if (this.state.gameOver) return;

    // Atualiza o tempo de vida do estado para persistência
    this.state.lastTick = performance.now();

    tickEconomy(this.state, dt);
    tickHeat(this.state, dt);
    tickLoyalty(this.state, dt);
    tickCrewUpkeep(this.state, dt);
    tickBattles(this.state, dt);
    tickRivals(this.state, dt);

    // Bônus passivo: territórios controlados reduzem calor
    this.state.heat = Math.max(0, this.state.heat - getPassiveHeatReduction(this.state) * dt);
  }
}
