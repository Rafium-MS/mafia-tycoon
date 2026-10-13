# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).
Versionamento semântico: MAJOR.MINOR.PATCH.

## [0.3.0] — 2026-10-13

### Adicionado
- 5 territórios com bônus únicos por tipo de negócio
- Sistema de batalhas em ticks (2s por resolução)
- IA de 4 facções rivais com crescimento e ataques
- Mapa SVG interativo com conexões, cores por dono e animações
- Sistema de capangas (recrutamento + upkeep + poder militar)
- Redução passiva de calor por territórios controlados
- Documentação de design (GDD, ARCHITECTURE, BALANCE, ROADMAP)

### Mudado
- `EconomySystem.tickEconomy` agora aplica multiplicador de território
- `GameLoop.tick` inclui os novos sistemas na ordem correta
- `GameState` expandido com `territories`, `factions`, `activeBattles`, `crew`

### Corrigido
- (n/a)

## [0.2.0] — 2026-10-12

### Adicionado
- Sistema de calor policial com suborno
- Sistema de lealdade com pagamento à crew
- Condições de derrota (calor 100, lealdade 0)

## [0.1.0] — 2026-10-12

### Adicionado
- Protótipo inicial: 3 esquemas, loop de venda, melhorias com custo crescente