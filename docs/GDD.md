# Mafia Tycoon — Game Design Document

**Versão:** 0.3.0
**Última atualização:** 2026-10-13
**Status:** Protótipo jogável
**Gênero:** Tycoon / Estratégia / Gestão de Recursos
**Plataforma:** Web (Navegador)
**Público:** Fãs de AdVenture Capitalist, Godfather, Empire Building

---

## 1. Visão Geral

### 1.1 Pitch
Um tycoon onde você constrói um império criminoso do zero. Começa como
agiota de bairro e termina como Don de uma família que controla
territórios, esquemas e sobrevive a guerras contra facções rivais — tudo
enquanto equilibra **calor policial**, **lealdade da crew** e **ambição
das famílias inimigas**.

### 1.2 Diferencial
Tycoon clássico é "números sobem". Aqui, **números sobem com risco**:
- Cada esquema gera dinheiro **e calor**
- Cada território amplifica um tipo de negócio — conquista é estratégica
- Facções rivais **crescem sozinhas** e atacam
- Três formas de perder: **prisão**, **traição**, **falência militar**

### 1.3 Pilares de Design
1. **Escolhas com trade-off** — nenhuma ação é "só boa"
2. **Pressão constante** — sempre há algo a defender ou conquistar
3. **Histórias emergentes** — cada partida gera uma narrativa diferente
4. **Legibilidade** — o jogador entende por que perdeu

---

## 2. Loop Principal
┌──────────────────────────────────────────────────┐
│ │
│ PRODUZIR → INVESTIR │
│ (esquemas) (negócios, capangas) │
│ ↑ ↓ │
│ │ EXPANDIR │
│ │ (territórios) │
│ │ ↓ │
│ RECOMPOR ← DEFENDER │
│ (subornar, (facções rivais) │
│ pagar crew) │
│ │
└──────────────────────────────────────────────────┘

**Tick:** 10 vezes por segundo (0.1s).
**Sessão alvo:** 15-30 minutos por partida.
**Vitória:** controlar todos os 5 territórios.
**Derrota:** calor = 100, lealdade = 0, ou falência prolongada: 60s seguidos com renda líquida ≤ 0 e dinheiro abaixo do esquema mais barato.

---

## 3. Recursos

| Recurso | Tipo | Fonte | Uso |
|---|---|---|---|
| **Dinheiro** | Acumulativo | Esquemas | Comprar tudo |
| **Respeito** | Progressivo | Esquemas ativos, conquista de territórios | Desbloqueia esquemas |
| **Calor** | 0-100 | Esquemas ativos | Se chega a 100 = derrota |
| **Lealdade** | 0-100 | Pagar crew | Se chega a 0 = derrota |
| **Capangas** | Inteiro | Recrutamento | Poder militar + redução de calor |

### 3.1 Fórmulas
- **Renda por segundo** = `Σ (baseIncome × count × territoryMultiplier)`
- **Calor por segundo** = `Σ (baseHeat × count × 0.05) - decay - crewCooling + bônusTerritórios`
- **Respeito por segundo** = `Σ (baseRespect × count)`
- **Ataque do jogador** = `(crew - crewEmBatalha) × 2 + floor(respeito / 10)`
- **Custo de esquema N** = `baseCost × 1.15^count`
- **Custo de capanga N** = `500 × 1.8^crew`

---

## 4. Esquemas (Businesses)

| ID | Nome | Custo Base | Renda/s | Calor/s | Respeito/s | Respeito p/ Desbloquear |
|---|---|---|---|---|---|---|
| `loan_shark` | Agiotagem | 15 | 1 | 0.2 | 0.005 | 0 |
| `protection` | Esquema de Proteção | 100 | 8 | 0.8 | 0.02 | 10 |
| `numbers` | Jogo do Bicho | 800 | 50 | 3 | 0.1 | 50 |
| `smuggling` | Contrabando | 5000 | 300 | 8 | 0.4 | 200 |
| `casino` | Cassino Clandestino | 50000 | 2500 | 15 | 1 | 1000 |

**Filosofia:** cada esquema é ~7x mais lucrativo que o anterior, mas
gera calor proporcionalmente maior. Escalar exige **mais subornos**.

---

## 5. Territórios

| ID | Nome | Bônus | Facção Inicial | Defesa | Custo Conquista |
|---|---|---|---|---|---|
| `little_italy` | Little Italy | +50% Agiotagem | Jogador | 10 | — |
| `docks` | Porto | +60% Contrabando | Marcone | 40 | 8000 |
| `downtown` | Centro | +40% Proteção | Polícia | 25 | 3000 |
| `chinatown` | Chinatown | +50% Jogo do Bicho | Tong | 55 | 12000 |
| `red_light` | Red Light | +70% Cassino | Bratva | 90 | 60000 |

### 5.1 Adjacências
Docks ─────── Red Light
│ │
│ │
Little Italy ── Downtown ── Chinatown
│
└──────────┘

### 5.2 Regras
- Só é possível **atacar** territórios **vizinhos** de algum que você controla
- **Conquista** requer dinheiro + poder de ataque > defesa
- Batalhas resolvem em **ticks de 2 segundos**, com aleatoriedade (±20%)
- Cada tick de batalha aumenta **calor +0.5**
- Durante batalhas, há **15% de chance de perder um capanga** por tick
- Conquistar território dá **+25 de respeito**
- Cada território controlado reduz **calor passivo em 0.1/s**
- O jogador pode **reforçar** a defesa dos próprios territórios, inclusive em batalha: **+20** por `100 + 10 × defesa atual` em dinheiro, até **3× o máximo** do território
- Fora de batalha, a defesa se **recupera sozinha** até o máximo do território (a defesa original, no mínimo 30) em **30 segundos**; conquistar deixa a defesa em 30

---

## 6. Facções

| Facção | Cor | Poder Inicial | Agressão | Comportamento |
|---|---|---|---|---|
| Jogador | Dourado `#d4a574` | 0 | — | Controlado pelo jogador |
| Família Marcone | Azul `#4a6fa5` | 30 | 0.3 | Agressiva moderada |
| Tong | Roxo `#8b2f9e` | 45 | 0.4 | Agressiva média |
| Bratva | Vermelho `#b8232b` | 70 | 0.6 | Muito agressiva |
| Polícia | Azul-escuro `#2c5aa0` | 20 | 0 | Nunca ataca, só defende |

### 6.1 IA
- Facções ganham **+aggression × 2 de poder** a cada 5 segundos, até o teto de **2× o poder inicial** (Marcone 60, Tong 90, Bratva 140)
- Facções sem nenhum território param de crescer
- A cada 5s, cada facção tem **chance `aggression × 0.3`** de agir
- Se **não ciente** do jogador: ataca outras facções
- Se **ciente** (após perder território pro jogador): prioriza atacar territórios vizinhos do jogador
- Facções **nunca se aliando** ao jogador (v1)

---

## 7. Fórmulas de Balanceamento

### 7.1 Progressão esperada
| Tempo | Dinheiro | Esquemas ativos | Territórios |
|---|---|---|---|
| 0-2 min | R$ 20-200 | 1-2 | 1 (Little Italy) |
| 2-5 min | R$ 200-3000 | 2-3 | 2 |
| 5-10 min | R$ 3000-50000 | 3-4 | 3 |
| 10-20 min | R$ 50000-500000 | 4-5 | 4 |
| 20+ min | R$ 500000+ | 5 | 5 (vitória) |

### 7.2 Calor esperado por estágio
- Início (1 esquema): ~+0.01/s → irrelevante
- Meio (3 esquemas): ~+0.3/s → suborno a cada ~2 min
- Final (5 esquemas): ~+1.5/s → suborno constante

---

## 8. UI / UX

### 8.1 Layout
┌────────────────────────────────────────────┐
│ 🔫 MÁFIA TYCOON │
├────────────────────────────────────────────┤
│ [Dinheiro] [Respeito] [Calor] [Lealdade] │
│ ▓▓▓▓▓▓░░░░░░░░░░░ (barra de calor) │
├────────────────────────────────────────────┤
│ │
│ MAPA SVG DE TERRITÓRIOS │
│ │
├────────────────────────────────────────────┤
│ [Subornar] [Pagar Família] [Recrutar] │
├────────────────────────────────────────────┤
│ ⚔️ Batalhas Ativas │
│ 🏴 Esquemas │
│ 📜 Registro │
└────────────────────────────────────────────┘

### 8.2 Paleta de Cores
- Fundo: `#0d0d0d` (preto sujo)
- Painéis: `#1a1a1a`
- Texto principal: `#f5e6d3` (creme)
- Destaque dourado: `#d4a574`
- Perigo: `#b8232b`
- Sucesso: `#7ec850`

### 8.3 Fonte
`Courier New` (monospace) — dá cara de "máquina de escrever / arquivo policial".

---

## 9. Estrutura Técnica

### 9.1 Stack
- **TypeScript** (strict mode)
- **Vite** (bundler e dev server)
- **DOM/SVG puro** (sem frameworks)
- **Sem backend** — single player

### 9.2 Arquitetura
src/
├── types/ # Interfaces e tipos globais
├── core/ # Estado, loop, event bus
├── systems/ # Lógica isolada por domínio
├── data/ # Dados "de design" (balanceáveis)
├── ui/ # Renderização
└── main.ts # Ponto de entrada

**Regras de ouro:**
1. Sistemas **não conhecem a UI** — só emitem eventos via EventBus
2. UI **não contém lógica** — só reage a estado e eventos
3. Dados em `data/` são **fáceis de editar sem tocar em código**
4. Loop principal usa **tick fixo** (0.1s) — economia não quebra com FPS

### 9.3 Event Bus
Eventos atuais:
- `income` — dinheiro recebido por tick
- `heat` — mudança relevante no calor
- `loyalty` — mudança de lealdade
- `gameover` — fim de jogo
- `log` — mensagens para o registro
- `territory:click` — clique em território no mapa
- `map:dirty` — (futuro) marcar mapa para re-render

---

## 10. Roadmap

### ✅ v0.1 — Protótipo básico
- Loop de produção/venda
- Esquemas com custo crescente
- UI simples

### ✅ v0.2 — Sistemas de risco
- Calor policial
- Lealdade da crew
- Recrutamento de capangas

### ✅ v0.3 — Territórios + Rival
- 5 territórios com bônus únicos
- Sistema de batalhas em ticks
- IA de facções rivais
- Mapa SVG interativo

### 🔲 v0.4 — Persistência
- Save/Load em localStorage
- Múltiplos slots

### 🔲 v0.5 — Profundidade
- Defesa ativa (reforçar territórios)
- Tréguas e negociações
- Eventos narrativos com escolhas

### 🔲 v0.6 — Polimento
- Animações de conquista
- Sons (ambiente + efeitos)
- Tela inicial e game over refinados

### 🔲 v1.0 — Publicação
- Balanceamento final
- Deploy em itch.io
- Conquistas

---

## 11. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Jogador "trava" sem entender por quê | Alto | Log detalhado + tooltips |
| Batalhas muito longas = tedioso | Médio | Cap de duração; resolução mais rápida |
| Facções muito agressivas = frustrante | Alto | Ajustar `aggression` e delays |
| Calor impossível de controlar | Alto | Playtest iterativo; reduzir ganho |
| Save quebrado ao atualizar versão | Médio | Versão no save + migrações |

---

## 12. Referências

- **Jogos:** AdVenture Capitalist, Universal Paperclips, Godfather, Empire: Total War, Reigns
- **Livros:** "The Art of Game Design" (Jesse Schell)
- **Artigos:** "The Chemistry of Game Design" (Daniel Cook), posts do Gamasutra sobre tycoon games