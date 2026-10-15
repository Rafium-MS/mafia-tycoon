# 🔫 Mafia Tycoon

Jogo tycoon com temática de máfia, construído em TypeScript + Vite.
Construa um império criminoso equilibrando dinheiro, calor policial,
lealdade e guerras de território.

## 📖 Documentação
- **[Game Design Document](docs/GDD.md)** — visão, mecânicas, balanceamento
- **[Arquitetura](docs/ARCHITECTURE.md)** — como o código está organizado
- **[Balanceamento](docs/BALANCE.md)** — números e ajustes
- **[Roadmap](docs/ROADMAP.md)** — o que vem por aí
- **[Changelog](docs/CHANGELOG.md)** — histórico de versões

## Como rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # tsc + build de produção
npm run preview  # servir o build
npm test         # testes dos sistemas (Vitest)
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
- ESLint + Prettier.
- Balanceamento: curva de dificuldade da IA e economia early-game.
- Sanitizar mensagens de log antes de injetar HTML (hoje são apenas strings internas).

Acesse http://localhost:5173.

🎮 Como jogar
Produza dinheiro com Agiotagem

Compre novos esquemas quando tiver respeito suficiente

Recrute capangas para poder atacar territórios

Conquiste territórios vizinhos clicando no mapa

Suborne a polícia quando o calor passar de 60

Pague sua família para manter a lealdade alta

Vitória: controlar todos os 5 territórios.
Derrota: calor = 100, lealdade = 0, ou falência prolongada (60s sem renda líquida e sem dinheiro para comprar nenhum esquema).

🛠️ Stack
TypeScript (strict)

Vite

SVG + DOM puro

---

## Como Manter Isso Vivo

Algumas regras para o GDD não virar documento morto:

1. **Toda mudança de número vai para `BALANCE.md` com o porquê**
2. **Toda feature nova entra no `CHANGELOG.md` no dia que entra no código**
3. **Toda feature concluída sai de `ROADMAP.md` e entra no `GDD.md`**
4. **Revisar o GDD a cada milestone** (v0.4, v0.5...) — apagar o que morreu

## Ferramentas Úteis (opcionais)

- **[Obsidian](https://obsidian.md)** — escrever GDD com links entre docs
- **[Mermaid](https://mermaid.js.org)** — diagramas como código dentro do Markdown
- **[Excalidraw](https://excalidraw.com)** — esboçar layouts e fluxos
- **[Trello / GitHub Projects](https://github.com/features/issues)** — backlog visual

---

## Próximo Passo

Temos agora:

- ✅ Código funcionando (v0.3)
- ✅ Documentação estruturada (este passo)

Qual seguimos?

- **A) v0.4 — Save/Load em localStorage** (persistência, permite sessões longas)
- **B) v0.5 — Defesa ativa + Tréguas** (profundidade estratégica)
- **C) Polir visual do mapa** (animações, transições, feedback de conquista)
- **D) Balanceamento sério** (playtest estruturado + ajuste de números)

Recomendo **A** — sem persistência, qualquer teste de partida longa é perdido. E o código para save/load é reutilizável e abre caminho pra outras features (múltiplos slots, telemetria).