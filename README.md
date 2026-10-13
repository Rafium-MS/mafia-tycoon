# 🔫 Máfia Tycoon

Jogo incremental (tycoon) de máfia feito com **Vite + TypeScript**, sem dependências externas.

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # tsc + build de produção
npm run preview  # servir o build
```

## Arquitetura

```
src/
├── types/game.ts        # Tipos centralizados (GameState, Business, Territory, Faction, Battle)
├── data/                # Definições estáticas e números de balanceamento
│   ├── businesses.ts
│   └── territories.ts
├── core/
│   ├── EventBus.ts      # Pub/sub para desacoplar sistemas → UI/log
│   ├── GameState.ts     # Estado inicial + regras de custo
│   └── GameLoop.ts      # Loop fixo a 10 ticks/s via requestAnimationFrame
├── systems/             # Lógica pura do jogo (sem DOM)
│   ├── EconomySystem.ts   # Renda, compras, desbloqueio por respeito
│   ├── HeatSystem.ts      # Calor policial, suborno, game over por prisão
│   ├── LoyaltySystem.ts   # Lealdade, pagamento à família, traição
│   ├── CrewSystem.ts      # Recrutamento e manutenção de capangas
│   ├── TerritorySystem.ts # Bônus por território, adjacência, custos de conquista
│   ├── BattleSystem.ts    # Resolução de batalhas (jogador e IA)
│   └── RivalSystem.ts     # IA das facções rivais
├── ui/
│   ├── renderer.ts      # Funções puras de renderização (DOM)
│   └── styles.css       # Estilos (importados pelo main.ts)
└── main.ts              # Composição: estado, loop, eventos de UI, save/load
```

### Regras principais
- **Esquemas** geram renda e calor; respeito extra desbloqueia esquemas melhores.
- **Territórios** dão bônus % a um esquema específico; só se ataca vizinhos de áreas suas.
- **Batalhas** resolvem a cada 2s; defender territórios custa capangas e gera calor.
- **Calor ≥ 100** = prisão; **lealdade ≤ 0** = traição. Suborne e pague a família para sobreviver.
- O progresso é salvo automaticamente no `localStorage` a cada 5s.

## Próximos passos sugeridos
- Testes unitários com Vitest (cálculo de custos, resolução de batalhas).
- ESLint + Prettier.
- Balanceamento: curva de dificuldade da IA e economia early-game.
- Sanitizar mensagens de log antes de injetar HTML (hoje são apenas strings internas).
