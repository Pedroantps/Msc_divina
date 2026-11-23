# Fase 2: site MSC Divina no estilo cinematográfico (plano multiagente)

Referência: gravação de tela de 17/11/2026 (44 s) navegando em msport-raptor.com.
Quadros-chave em `docs/superpowers/referencia/ref-*.jpg`. Os agentes não assistem ao vídeo,
então leem esses quadros antes de começar.

Objetivo: dar ao site atual (React 18 + Vite + GSAP ScrollTrigger + Photo Sphere Viewer)
a linguagem visual e de rolagem da referência, mantendo o conteúdo da família (áreas do navio,
360°, Búzios, favoritos, créditos) e todos os cuidados já feitos (reduced motion, carga
preguiçosa do palco, fallback do WebGL).

---

## 1. O que o vídeo mostra

### 1.1 Estrutura (dois capítulos e fechamento)

| Tempo | Bloco | O que acontece |
|---|---|---|
| 0–3 s | Hero | Palavra gigante "Raptor" em fonte geométrica fina, branca, sobre o carro num hangar claro. Selo pequeno "T1+" à direita. Quadrado vermelho com seta + "SCROLL DOWN" no canto inferior esquerdo. |
| 4–24 s | Percurso de câmera | A rolagem controla um voo de câmera contínuo (vídeo pré-renderizado "scrubbed"): capô de cima, para-brisa, roda em close, volta para 3/4, suspensão sobre fundo branco, lateral escura, traseira com luz vermelha, roda, cockpit. A cada parada aparece um título curto ("Endurance engineered", "Every tenth matters") + quadrado vermelho + chamada em caixa alta ("EXPLORE T1'S CHASSIS") que abre um popup de detalhe. |
| 25–27 s | Abertura do capítulo 2 | Vídeo do deserto em tela cheia, palavra gigante "Dakar" vazada sobre ele, subtítulo "2026 – Rally's greatest test". Depois "A DOUBLE PODIUM" + "FULL STORY". |
| 28–29 s | Números + texto | Fundo cinza-claro, linha de 4 números grandes com legenda, depois duas colunas: frase grande à esquerda, foto à direita, parágrafo pequeno. |
| 30–36 s | Pilotos | Palavra-marca d'água gigante "Drivers" em cinza-claro, cartões-retrato em posições alternadas rolando em velocidades diferentes (parallax), linha vermelha fina desenhada conforme a rolagem, cartão com quadrado vermelho + nome + legenda. |
| 38 s | Legado | Parágrafo curto centralizado + colagem assimétrica (foto pequena + vídeo grande). |
| 39–44 s | Parceiros + rodapé | "Partners and sponsors" com fileira de logos; rodapé preto com logo, redes, links externos com seta vermelha, "Made by". |

### 1.2 Elementos fixos (sempre na tela)

- Logo no canto superior esquerdo (branco sobre escuro, preto sobre claro).
- Ícone pequeno de onda no canto superior direito (liga/desliga som).
- **Barra de capítulos no canto inferior direito**: retângulo branco com "Raptor T1+ | Dakar 2026 | ☰".
  Uma linha vermelha embaixo cresce com o progresso da rolagem dentro do capítulo.
- Controles discretos de vídeo (tela cheia / pausa) no topo central quando há vídeo.

### 1.3 Sistema visual

- **Tipografia de exibição**: geométrica, larga, traço fino, cantos arredondados, em tamanho de
  ~25 vw. Usada só para 1 palavra por capítulo. Substituto livre: **Unbounded 200/300**
  (Google Fonts). Alternativa: Lexend Zetta 200.
- **Títulos de seção**: grotesca média, sentence case, 40–56 px ("Endurance engineered").
  Texto e rótulos: grotesca neutra (Inter Tight / Inter, que já está no projeto).
  Rótulos de ação: caixa alta, 11–12 px, peso 600, espaçamento largo.
- **Cor**: neutros (branco, cinza #f4f4f4, quase-preto #0e0e10) + **um único acento** usado em
  pouquíssimos pontos: quadrado do CTA, linha de progresso, linha da rota, setas do rodapé.
- **Assinatura de CTA**: quadrado sólido de 28 px na cor de acento com um ícone de canto (⌐)
  branco, seguido do rótulo em caixa alta. É o mesmo componente em todo o site.
- **Ritmo**: alternância clara/escura entre blocos; muito espaço vazio; um assunto por tela.
- **Movimento**: tudo amarrado à rolagem (scrub), nada em loop solto. Títulos entram com fade
  curto quando a câmera "para". Parallax só nos cartões.

---

## 2. Tradução para o site MSC Divina

| Referência | No site da Divina | Componente hoje |
|---|---|---|
| Hero "Raptor" + T1+ | Palavra gigante **"Divina"** sobre a foto externa do navio; selo "MSC" pequeno; "role para embarcar" com quadrado de acento | `Hero` (refazer) |
| Voo de câmera com paradas | **Percurso pelo navio**: cada uma das 14 áreas é uma parada, na ordem dos decks (5 → 16). Em cada parada a rolagem gira a câmera pelo ambiente, deslizando uma faixa panorâmica gerada do 360° (Decisão 1). Título curto + "DECK 14" + CTA | `AreasDoNavio` + `AreaSection` (refazer) |
| CTA que abre popup | CTA **"VER EM 360°"** abre o **tour da área** num modal em tela cheia, no estilo do tour virtual da MSC: panorama + faixa de miniaturas das cenas da área (ex.: Aurea Spa tem 5), anterior/próxima, nome e deck da cena, giroscópio no celular. Isto também resolve de vez o conflito roda/360. | `Panorama360` (passa a viver no modal) + novo `TourArea` |
| Abertura "Dakar" sobre vídeo | Palavra gigante **"Búzios"** sobre a foto panorâmica de Búzios, subtítulo com a data da escala | `Buzios` (refazer) |
| Linha de 4 números | Números tirados do próprio conteúdo, verdadeiros por construção: **14 áreas**, **35 ambientes em 360°**, **deck 18** (o mais alto do tour), **4 lugares em Búzios**. Calculados dos dados, não digitados | novo `Numeros` |
| Duas colunas texto + foto | Lugares de Búzios em blocos alternados (frase grande + foto + parágrafo) | `Buzios` |
| "Drivers" + cartões + linha vermelha | Marca d'água **"Favoritos"**, cartões dos favoritos em posições alternadas com parallax e a **linha da rota do cruzeiro** desenhada pela rolagem | `SelecaoFavoritos` (refazer a apresentação, manter `useFavoritos`) |
| Partners and sponsors | **"Fotos e créditos"**: fileira limpa com autores/licenças | `Rodape` (separar) |
| Rodapé preto | Rodapé preto com logo, links (MSC, Búzios, Wikimedia) com seta de acento | `Rodape` |
| Barra de capítulos fixa | Barra fixa **"O navio · Búzios · ☰"** com linha de progresso por capítulo; o ☰ abre um índice das áreas | novo `NavCapitulos` |

Fica fora: som ambiente (o ícone de onda) e vídeos.

---

## 3. Decisões tomadas

Estado de partida (commit `78ee4ea` em `main`): 14 áreas do navio, todas com foto e 360°.
Os 35 panoramas (4096×2048, equirretangulares) foram montados a partir das cenas do tour virtual
oficial (`virtual-tours.msccruises.com/MSC-Divina`, krpano, cubo em blocos), e a foto plana de
cada área é um recorte do enquadramento inicial do tour. Decks vêm do menu desse tour.
Cada área tem `cenas[] {id, nome, deck, panorama, yaw}`; o `yaw` reproduz o ângulo inicial do tour.

1. **Movimento de câmera: "giro de câmera" a partir dos panoramas.** Como temos o 360° de cada
   área, a Fase 0 gera para cada parada uma **faixa cilíndrica larga** (≈3:1, 3240×1080, ~150° de
   campo, centrada no `yaw`) com o mesmo script de recorte. No Percurso, a rolagem desliza essa
   faixa na horizontal com leve zoom: parece a câmera girando dentro do ambiente, como no vídeo,
   sem WebGL e sem vídeo. Entre paradas: corte com fade curto. Ponto de extensão
   `midia: 'faixa' | 'sequencia'` fica para um vídeo filmado a bordo no futuro.
2. **Cor de acento: vermelho-coral `#e63b2e`.** Ecoa a referência e contrasta com o azul do mar e o
   dourado dos interiores. Usado só em CTA, progresso, rota e setas. Nenhum outro acento.
3. **Base: alterna claro/escuro.** Capítulo do navio escuro (`#0e0e10`, texto `#f4f4f2`),
   capítulo Búzios claro (`#f4f4f2`, texto `#0e0e10`), rodapé preto puro. O dourado atual sai.
4. **Números: derivados dos dados** (ver tabela acima), então não precisam de checagem externa.
5. **Tipografia: Unbounded 200/300** para a palavra gigante e **Inter Tight 400/500/600** para o
   resto, auto-hospedadas em woff2. A Fraunces sai.
6. **360°: tour próprio no estilo MSC, não iframe.** O tour oficial bloqueia acesso fora do
   navegador e não aceita abrir numa cena pela URL, então o iframe só abriria na recepção.
   O site usa os panoramas locais com Photo Sphere Viewer (já no projeto) + `GyroscopePlugin`,
   e o modal tem um link discreto "abrir o tour oficial da MSC".
7. **Publicação privada.** As imagens da MSC não são licenciadas para reuso, então o deploy
   (decisão separada, fora desta fase) vai com proteção de acesso da Vercel e
   `<meta name="robots" content="noindex">`, que entra já na Fase 0.
8. **Peso.** Os 35 panoramas somam ~33 MB, mas só carregam quando o modal abre (um por vez).
   As faixas do Percurso ficam abaixo de 250 KB cada; a primeira tem `fetchpriority="high"`.

---

## 4. Organização multiagente

### 4.1 Papéis

| Papel | Quem | Modelo | Faz |
|---|---|---|---|
| Orquestrador | sessão principal | Opus | Fase 0, distribui tarefas, integra `App.tsx`, roda verificação no navegador, decide nas revisões |
| Implementadores | subagentes, um por tarefa | Sonnet | Cada um é dono de um conjunto fechado de arquivos, com TDD (Vitest) |
| Revisor de tarefa | subagente por tarefa | Sonnet | Lê o diff da tarefa contra este plano e os quadros de referência |
| Revisor final | subagente | Opus | Revisão do ramo inteiro (código + design) |
| Revisor de design | `impeccable:impeccable-finish-reviewer` | — | Compara capturas do site com os quadros de referência |
| Verificador de navegador | orquestrador | — | Playwright/painel do navegador: rolagem, reduced motion, mobile, console |

Fluxo por tarefa: implementar → testes + build verdes → revisor de tarefa → correção (máx. 1 rodada)
→ commit. Skill de execução: `superpowers:subagent-driven-development`; ondas paralelas com
`superpowers:dispatching-parallel-agents`.

### 4.2 Regras de isolamento

- Ramo `fase2-estilo-cinematografico` a partir de `main` (já com o commit das fotos).
- Cada implementador da Onda 1 roda com `isolation: worktree` e só toca nos arquivos listados
  na sua tarefa. `App.tsx`, `tokens.css` e `global.css` são do orquestrador.
- Contratos compartilhados (tipos, tokens, componente `CtaAcento`, `useProgressoCapitulo`)
  saem prontos da Fase 0, então ninguém na Onda 1 precisa esperar outro agente.
- Cada agente entrega: arquivos, testes, uma captura da sua seção isolada (página de teste
  `?secao=<id>` montada pelo orquestrador na Fase 0).

### 4.3 Grafo

```
Fase 0 (orquestrador, serial)
   │
   ├── Onda 1 (5 agentes em paralelo, worktrees separados)
   │     T1 Cromo fixo + NavCapitulos
   │     T2 Hero tipográfico
   │     T3 Percurso do navio + tour 360° por área
   │     T4 Capítulo Búzios + Números
   │     T5 Favoritos com rota + Créditos + Rodapé preto
   │
   ├── Fase 2 (orquestrador): merge dos 5 ramos, App.tsx, transições entre capítulos
   │
   ├── Onda 3 (3 revisores em paralelo, só leitura)
   │     R1 código (Opus)   R2 design vs referência   R3 acessibilidade + desempenho
   │
   └── Fase 4: uma onda de correções → verificação no navegador → merge em main
```

---

## 5. Tarefas

### Fase 0: fundação (orquestrador)

Arquivos: `src/styles/tokens.css`, `src/styles/global.css`, `index.html`, `src/data/tipos.ts`,
`src/data/areas.ts`, `scripts/gerar-faixas.mjs`, `public/faixa/*.webp`,
`src/components/CtaAcento.{tsx,css,test.tsx}`, `src/hooks/useProgressoCapitulo.{ts,test.ts}`,
`src/dev/Vitrine.tsx` (página `?secao=`).

1. Tokens: `--cor-base-escura: #0e0e10`, `--cor-base-clara: #f4f4f2`, `--cor-texto-escuro`,
   `--cor-texto-claro`, `--cor-acento: #e63b2e`, `--fonte-exibicao: 'Unbounded'`,
   `--fonte-titulo: 'Inter Tight'`, escala (`--t-gigante: clamp(6rem, 24vw, 22rem)`,
   `--t-titulo: clamp(2rem, 4vw, 3.5rem)`, `--t-rotulo: 0.75rem`). Remove o dourado e a Fraunces.
2. Fontes auto-hospedadas (woff2 em `public/fonts`, `font-display: swap`, preload só da Unbounded).
3. `index.html`: `<meta name="robots" content="noindex, nofollow">`.
4. **Faixas do Percurso**: `scripts/gerar-faixas.mjs` (sharp, sem Python) lê `public/pano/*.webp`
   e grava `public/faixa/<area>.webp` em projeção cilíndrica, 3240×1080, ~150° centrados no `yaw`
   da primeira cena, ≤ 250 KB. Comando `npm run faixas`. Teste do mapeamento de coordenadas.
5. Tipos: `Area` ganha `titulo` (frase curta da parada, ex. "Onde a noite começa") e `faixa`
   (`/faixa/<id>.webp`); novo tipo `Capitulo = { id, nome, ancora }`. Preencher os 14 títulos.
6. `CtaAcento`: quadrado de acento + ícone de canto + rótulo; vira `<button>` ou `<a>`;
   foco visível; testes de papel e rótulo.
7. `useProgressoCapitulo(ref)`: devolve 0–1 do progresso de rolagem de um elemento (ScrollTrigger),
   com valor fixo 1 em reduced motion.
8. Vitrine `?secao=` só em `import.meta.env.DEV`.
9. Commit "chore(fase2): fundação do estilo cinematográfico".

### T1: cromo fixo e barra de capítulos

Arquivos: `src/components/Cromo.{tsx,css,test.tsx}`, `src/components/NavCapitulos.{tsx,css,test.tsx}`.

- Logo fixo no topo esquerdo; troca preto/branco conforme o fundo do capítulo (atributo
  `data-tema` no `<section>` lido por IntersectionObserver).
- Indicador "role" no canto inferior esquerdo (CtaAcento com seta) que some após 10% de rolagem.
- `NavCapitulos`: barra branca fixa no canto inferior direito, botões por capítulo, linha de
  progresso de acento (usa `useProgressoCapitulo`), ☰ abre índice das áreas como `<dialog>`.
- Mobile: barra ocupa a largura toda, rótulos curtos.
- Testes: clique leva à âncora; capítulo ativo tem `aria-current`; índice fecha com Esc.

### T2: Hero tipográfico

Arquivos: `src/components/Hero.{tsx,css,test.tsx}`.

- Palavra "Divina" em `--t-gigante`, branca, ancorada na base da tela, atrás/na frente do navio
  conforme recorte (sem recorte: texto na frente com `mix-blend-mode` apenas se legível).
- Selo pequeno à direita da palavra.
- Rolagem: a palavra sobe e some; a foto externa aproxima (zoom no casco) e corta com fade
  escuro para a primeira parada (Recepção).
- Mantém `loading="eager"`, `fetchpriority="high"` e o comportamento de reduced motion.

### T3: Percurso do navio e tour 360° por área

Arquivos: `src/components/Percurso.{tsx,css,test.tsx}` (substitui `AreasDoNavio` e `AreaSection`),
`src/components/TourArea.{tsx,css,test.tsx}`, ajuste em `Panorama360.tsx` (troca de cena sem
recriar o viewer, `GyroscopePlugin` no celular).

- Palco fixo com a faixa da área (montagem preguiçosa como hoje); cada parada ocupa ~150 svh.
  Dentro da parada a rolagem desliza a faixa de 0% a 100% da largura excedente com leve zoom
  (1 → 1,08). Entre paradas: fade de 0,15 do trecho.
- Na parada: `titulo` (entra com fade de 0,3 s), nome da área, "DECK 14", contagem
  "5 AMBIENTES EM 360°" e `CtaAcento` "VER EM 360°".
- Posição do texto alterna (esquerda, centro-topo, direita) como na referência.
- `TourArea`: `<dialog>` em tela cheia, foco preso, Esc fecha, bloqueia a rolagem do fundo.
  Panorama da cena ativa abrindo no `yaw`; faixa inferior com miniaturas das cenas (a foto
  plana da área para a primeira; recorte 320×180 das demais, gerado pelo script de faixas);
  setas anterior/próxima e teclas ←/→; nome e deck da cena; link "tour oficial da MSC".
  O viewer só existe com o modal aberto e é destruído ao fechar (mantém o fallback do WebGL).
- Reduced motion: lista vertical estática, cada área com foto e CTA; o modal funciona igual.
- Testes: as paradas renderizam na ordem; o CTA abre o tour da área certa; trocar de cena
  muda o panorama; o 360 não monta antes de abrir; Esc fecha e devolve o foco ao CTA.

### T4: capítulo Búzios e números

Arquivos: `src/components/Buzios.{tsx,css,test.tsx}`, `src/components/Numeros.{tsx,css,test.tsx}`,
`src/data/buzios.ts` (texto curto por lugar), `src/data/numeros.ts`.

- Abertura: foto panorâmica em tela cheia, "Búzios" em `--t-gigante` vazado sobre ela, subtítulo.
- `Numeros`: fileira de 4 números grandes com legenda; os números contam até o valor quando
  entram na tela (desligado em reduced motion). `numeros.ts` calcula os valores a partir de
  `areasDoNavio` e `lugaresBuzios` (áreas, cenas 360°, deck mais alto, lugares), com teste.
- Lugares: blocos de duas colunas alternadas (frase grande, parágrafo, foto), fundo claro.

### T5: favoritos com rota, créditos e rodapé

Arquivos: `src/components/SelecaoFavoritos.{tsx,css,test.tsx}` (mantém `useFavoritos`),
`src/components/RotaSvg.{tsx,test.tsx}`, `src/components/Creditos.{tsx,css,test.tsx}`,
`src/components/Rodape.{tsx,css,test.tsx}`.

- "Favoritos" como marca d'água gigante em cinza-claro; cartões das áreas em duas colunas
  desencontradas, com velocidades de parallax diferentes; cartão = foto + quadrado de acento
  (marca/desmarca favorito) + nome + legenda (deck ou praia).
- `RotaSvg`: linha fina de acento desenhada com `stroke-dashoffset` amarrado à rolagem
  (traço estilizado Santos → Búzios, sem pretensão cartográfica).
- `Creditos`: título "Fotos e créditos" + lista em linha, tipografia pequena e limpa.
- `Rodape`: fundo preto, logo, links externos com seta de acento, linha "Feito pela família".

### Fase 2: integração (orquestrador)

- Merge dos ramos T1–T5 em `fase2-estilo-cinematografico`.
- `App.tsx`: ordem Hero → Percurso → Búzios (abertura, números, lugares) → Favoritos → Créditos
  → Rodapé, com `Cromo` e `NavCapitulos` por cima; `data-tema` em cada seção.
- Costuras: Hero → primeira parada, último deck → abertura de Búzios (corte para claro).
- Remover `AreasDoNavio`/`AreaSection` e testes órfãos.
- `npm test`, `npm run build`, `npm run lint` verdes.

### Onda 3: revisões (paralelas, só leitura)

- **R1 código (Opus)**: diff do ramo inteiro; ScrollTriggers limpos no desmonte, sem vazamento
  de listeners, tipos, testes que testam comportamento.
- **R2 design**: capturas desktop (1440×900) e mobile (390×844) nos mesmos momentos dos quadros
  de referência; nota por item da seção 1.3.
- **R3 acessibilidade e desempenho**: reduced motion, foco visível, ordem de tabulação, contraste
  do texto sobre foto, modal acessível, LCP do Hero, peso total de imagens e fontes, CLS das fontes.

### Fase 4: correções e entrega

- Uma onda de correções agrupando os achados Importantes de R1–R3 (um agente Sonnet).
- Verificação no navegador pelo orquestrador (rolagem completa, modal 360, mobile, console limpo).
- `superpowers:finishing-a-development-branch`: merge em `main` com aprovação. Deploy na Vercel
  fica para decisão separada.

---

## 6. Critérios de pronto

- Rolando do topo ao fim, cada tela tem um único assunto, e o movimento só acontece com a rolagem.
- Uma só cor de acento, usada apenas em CTA, progresso, rota e setas.
- O CTA de cada área abre o tour 360° dela num modal, com troca de cena; a roda do mouse nunca gira o 360 fora do modal.
- Reduced motion mostra tudo sem animação e sem perder conteúdo.
- Mobile 390 px sem rolagem horizontal; barra de capítulos não cobre texto.
- Testes, build e lint verdes; console sem erros novos.
- Nenhum logo, nome, texto ou imagem da referência no site: só o estilo.
