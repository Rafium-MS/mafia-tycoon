# Arquitetura Técnica — Mafia Tycoon

## Princípios

1. **Separação estado/lógica/render** — o `GameState` é um POJO (plain
   old JavaScript object), os sistemas são funções puras que o mutam,
   a UI apenas lê.
2. **Tick fixo determinístico** — mesmo rodando em 30 FPS ou 144 FPS, a
   economia se comporta igual.
3. **Dados fora do código** — balanceamento em `src/data/`.
4. **Event-driven** — sistemas não chamam UI; emitem eventos.

## Fluxo de Dados
┌────────────┐
│ GameState │ ← mutado por sistemas
└─────┬──────┘
│
┌─────▼──────┐
│ GameLoop │ chama sistemas em ordem
└─────┬──────┘
│
┌─────▼──────┐
│ Sistemas │ economia, calor, batalha, IA
└─────┬──────┘
│ emitem eventos
┌─────▼──────┐
│ EventBus │
└─────┬──────┘
│
┌─────▼──────┐
│ UI │ render() a cada frame
└────────────┘

## Ordem de Execução (por tick)

1. `tickEconomy` — adiciona dinheiro
2. `tickHeat` — recalcula calor
3. `tickLoyalty` — recalcula lealdade
4. `tickCrewUpkeep` — deduz salário dos capangas
5. `tickBattles` — resolve batalhas ativas
6. `tickTerritoryDefense` — territórios fora de batalha recuperam defesa
7. `tickRivals` — IA das facções
8. Aplicar redução passiva de calor (bônus de territórios)
9. Checar condições de derrota (calor/lealdade/falência, dentro de cada sistema; `tickBankruptcy` roda logo após `tickCrewUpkeep`)
10. Checar vitória (`checkVictory`) — só se a derrota não ocorreu no mesmo tick

Ordem importa: batalhas antes de IA, porque a IA pode atacar um
território que acabou de ser conquistado.

## Convenções de Código

- **Nomes de arquivo:** `PascalCase.ts` para classes/módulos, `camelCase.ts` para utilitários
- **Exports:** nomeados (evitar `default` exceto onde faz sentido)
- **Tipos:** prefixo `I` não é usado; apenas nomes diretos (`GameState`, `Battle`)
- **Imutabilidade:** preferimos mutar o `GameState` central (performance + simplicidade)
- **Funções puras** quando possível (ex: `getCost`, `canAttack`)

## Performance

- Loop a 10 Hz para lógica; render a 60 Hz via `requestAnimationFrame`
- Mapa SVG re-renderizado a cada frame (custo baixo, ~7 elementos)
- Se escalar (mais territórios), migrar para renderização só em mudança via `map:dirty`