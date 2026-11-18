# Site MSC Divina — Fase 1 (site visual) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um site de scroll que sai da foto externa do MSC Divina, entra no navio, percorre as áreas (algumas em 360°), passa por Búzios e termina numa seleção de áreas favoritas salva no navegador.

**Architecture:** SPA estática em Vite + React. O conteúdo vive em arquivos de dados tipados (`src/data/`), separados dos componentes. Cada seção é um componente que monta suas próprias animações com `useGSAP`; um hook `useReducedMotion` decide se há animação. A seleção de favoritos é um hook com persistência em `localStorage`, que a Fase 2 (roteiro) vai reaproveitar.

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), GSAP 3 + ScrollTrigger + `@gsap/react`, `@photo-sphere-viewer/core` 5, Vitest + Testing Library + jsdom, `sharp` (script de imagens), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-17-site-msc-divina-design.md`

## Global Constraints

- Mobile primeiro: tudo testado em 375×812 antes de desktop.
- Imagens WebP, máx. 1920px de largura, ≤ 200 KB; panoramas ≤ 1,5 MB, 4096×2048.
- `prefers-reduced-motion: reduce` → sem pin, zoom ou crossfade.
- Alturas de seção em `100svh`.
- Nenhum arquivo copiado do site da MSC; o tour oficial entra só como link.
- Todo `localStorage` dentro de `try/catch`; o site funciona sem ele.
- Textos da interface em português.
- Cores e fontes só via variáveis CSS em `src/styles/tokens.css`.
- Commits sem linha de coautoria do Claude.

## Review Focus

1. **Foto ou panorama faltando/404** (comum enquanto o conteúdo é montado) → a seção mostra um fundo de cor sólida com o nome da área, nunca um ícone de imagem quebrada. Teste na Task 4 e na Task 5.
2. **Celular sem WebGL ou com WebGL que falha ao iniciar** → o 360° vira a foto comum. Teste na Task 5.
3. **`localStorage` bloqueado (aba anônima, Safari)** → favoritos funcionam na sessão sem erro. Teste na Task 7.
4. **`prefers-reduced-motion`** → conteúdo inteiro visível e legível sem animação. Teste nas Tasks 3 e 4.
5. **Girar o celular / barra do navegador aparecendo** → o pin não fica desalinhado. Verificação manual na Task 8 (`ScrollTrigger.refresh` no `resize`, alturas em `svh`).

---

## File Structure

```
index.html
vite.config.ts                 # Vite + Vitest (jsdom)
src/main.tsx
src/App.tsx                    # ordem das seções
src/styles/tokens.css          # cores, fontes, espaçamentos
src/styles/global.css
src/lib/gsap.ts                # registra ScrollTrigger uma vez
src/hooks/useReducedMotion.ts
src/hooks/useFavoritos.ts
src/data/tipos.ts              # Area, Categoria
src/data/areas.ts              # áreas do navio
src/data/buzios.ts             # lugares de Búzios
src/data/validar.ts            # validarAreas
src/components/Hero.tsx
src/components/AreaSection.tsx
src/components/ImagemComFallback.tsx
src/components/Panorama360.tsx
src/components/AreasDoNavio.tsx
src/components/Buzios.tsx
src/components/SelecaoFavoritos.tsx
src/components/Rodape.tsx
public/img/                    # .webp otimizados
public/pano/                   # panoramas 360°
fotos-originais/               # fora do git (.gitignore)
scripts/otimizar-imagens.mjs
src/**/*.test.ts(x)            # testes ao lado do arquivo
```

---

### Task 1: Projeto base, tokens visuais e testes rodando

**Files:**
- Create: projeto Vite em `C:\Estudos\Msc_divina`, `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/gsap.ts`, `src/App.tsx`, `src/App.test.tsx`, `.gitignore`

**Interfaces:**
- Produces: `src/lib/gsap.ts` exporta `gsap` e `ScrollTrigger` já registrados (`gsap.registerPlugin(ScrollTrigger, useGSAP)`); todo componente importa daqui, nunca de `gsap` direto.
- Produces: variáveis CSS `--cor-fundo: #0b1a2e`, `--cor-texto: #f4ecdc`, `--cor-destaque: #c9a24a`, `--cor-sombra: rgb(5 12 22 / 0.85)`, `--fonte-titulo: 'Fraunces', serif`, `--fonte-texto: 'Inter', sans-serif`.

- [ ] **Step 1: Criar o projeto e instalar dependências**

```bash
npm create vite@latest . -- --template react-ts
npm i gsap @gsap/react @photo-sphere-viewer/core
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event sharp
git init
```

Adicionar `fotos-originais/` ao `.gitignore`. Configurar Vitest em `vite.config.ts` com `environment: 'jsdom'`, `globals: true`, `setupFiles: './src/test-setup.ts'` (importa `@testing-library/jest-dom/vitest`). Script `"test": "vitest"` no `package.json`.

- [ ] **Step 2: Escrever o teste que falha**

```tsx
// src/App.test.tsx
it('mostra o título do navio', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (o template do Vite não tem esse título)

- [ ] **Step 4: Substituir o template**

`App.tsx` renderiza só `<main><h1>MSC Divina</h1></main>` por enquanto. Apagar CSS e assets do template. Carregar Fraunces (600) e Inter (400, 600) do Google Fonts no `index.html`. `global.css`: reset mínimo, `body { background: var(--cor-fundo); color: var(--cor-texto); font-family: var(--fonte-texto) }`.

- [ ] **Step 5: Rodar o teste e o dev server**

Run: `npx vitest run` → PASS. Run: `npm run dev` → página azul-marinho com o título em Fraunces.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: projeto Vite + React com tokens visuais e Vitest"
```

---

### Task 2: Modelo de dados das áreas

**Files:**
- Create: `src/data/tipos.ts`, `src/data/areas.ts`, `src/data/buzios.ts`, `src/data/validar.ts`
- Test: `src/data/validar.test.ts`, `src/data/areas.test.ts`

**Interfaces:**
- Produces:

```ts
export type Categoria = 'navio' | 'buzios'
export interface Area {
  id: string            // kebab-case, único entre navio e Búzios
  nome: string
  categoria: Categoria
  deck?: number         // só para 'navio'
  descricao: string     // até 160 caracteres
  imagem: string        // caminho em /img/..., .webp
  panorama?: string     // caminho em /pano/..., .webp
  credito: string       // "Foto: Família" ou "Foto: Autor, CC BY-SA 4.0"
}
export function validarAreas(areas: Area[]): string[]   // lista de erros; [] = ok
export const areasDoNavio: Area[]
export const lugaresBuzios: Area[]
```

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/data/validar.test.ts
const base: Area = { id: 'teatro', nome: 'Teatro', categoria: 'navio', deck: 6,
  descricao: 'Shows toda noite.', imagem: '/img/teatro.webp', credito: 'Foto: Família' }

it('aceita uma lista válida', () => expect(validarAreas([base])).toEqual([]))
it('acusa id repetido', () =>
  expect(validarAreas([base, { ...base }])).toContain('id repetido: teatro'))
it('acusa id fora de kebab-case', () =>
  expect(validarAreas([{ ...base, id: 'Teatro Pantheon' }])).toContain('id inválido: Teatro Pantheon'))
it('acusa descrição longa', () =>
  expect(validarAreas([{ ...base, descricao: 'x'.repeat(161) }])).toContain('descrição longa: teatro'))
it('acusa imagem que não é webp em /img/', () =>
  expect(validarAreas([{ ...base, imagem: 'teatro.jpg' }])).toContain('imagem inválida: teatro'))
it('acusa área do navio sem deck', () =>
  expect(validarAreas([{ ...base, deck: undefined }])).toContain('deck faltando: teatro'))
it('acusa crédito vazio', () =>
  expect(validarAreas([{ ...base, credito: '' }])).toContain('crédito faltando: teatro'))

// src/data/areas.test.ts
it('o conteúdo real é válido', () =>
  expect(validarAreas([...areasDoNavio, ...lugaresBuzios])).toEqual([]))
it('tem entre 8 e 10 áreas do navio', () => {
  expect(areasDoNavio.length).toBeGreaterThanOrEqual(8)
  expect(areasDoNavio.length).toBeLessThanOrEqual(10)
})
it('tem de 2 a 3 panoramas', () => {
  const n = areasDoNavio.filter(a => a.panorama).length
  expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3)
})
it('tem de 3 a 5 lugares em Búzios', () => {
  expect(lugaresBuzios.length).toBeGreaterThanOrEqual(3)
  expect(lugaresBuzios.length).toBeLessThanOrEqual(5)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/data` → FAIL (módulos não existem)

- [ ] **Step 3: Implementar `tipos.ts`, `validar.ts` e preencher os dados**

Mensagens de erro exatamente como nos testes. Kebab-case: `/^[a-z0-9]+(-[a-z0-9]+)*$/`. Imagem válida: começa com `/img/` e termina em `.webp`.
Áreas sugeridas (o usuário ajusta conforme o deck plan): Teatro Pantheon, Piscina Infinity, Yacht Club, Aurea Spa, Cassino, Buffet, Galeria/Lojas, Kids Club, Boliche/Fórmula 1, Cabine. Búzios: Rua das Pedras, Orla Bardot, Praia de Geribá, Praia João Fernandes. Descrições e créditos provisórios; os arquivos de imagem podem ainda não existir (Review Focus 1 cobre isso).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/data` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: modelo de dados das áreas do navio e de Búzios"
```

---

### Task 3: Hero com zoom entrando no navio

**Files:**
- Create: `src/hooks/useReducedMotion.ts`, `src/components/Hero.tsx`, `src/components/Hero.css`
- Modify: `src/App.tsx`
- Test: `src/hooks/useReducedMotion.test.ts`, `src/components/Hero.test.tsx`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger` de `src/lib/gsap.ts`.
- Produces: `useReducedMotion(): boolean` (lê `matchMedia('(prefers-reduced-motion: reduce)')` e atualiza no evento `change`).
- Produces: `<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />` — `alvo` em % é o ponto do casco para onde o zoom vai (`transform-origin`).

- [ ] **Step 1: Escrever os testes que falham**

```ts
// useReducedMotion.test.ts — mockar window.matchMedia
it('retorna true quando o sistema pede menos movimento', ...)  // matches: true → true
it('atualiza quando a preferência muda', ...)                   // dispara 'change' → valor novo

// Hero.test.tsx
it('mostra o título e a foto com texto alternativo', () => {
  render(<Hero imagem="/img/divina-externa.webp" alvo={{ x: 62, y: 48 }} />)
  expect(screen.getByRole('heading', { level: 1, name: 'MSC Divina' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'O navio MSC Divina visto de fora' })).toBeInTheDocument()
})
it('com movimento reduzido marca a seção como estática', () => {
  // matchMedia mock → matches: true
  render(<Hero ... />)
  expect(screen.getByTestId('hero')).toHaveAttribute('data-estatico', 'true')
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/hooks src/components/Hero.test.tsx` → FAIL

- [ ] **Step 3: Implementar**

Estrutura: `<section data-testid="hero">` com altura `300svh`; dentro, um wrapper `position: sticky; top: 0; height: 100svh; overflow: hidden` com a `<img>` em `object-fit: cover` e o `<h1>` sobre degradê `--cor-sombra`. Em `useGSAP` (escopo no ref da seção), se não for movimento reduzido: um timeline com `scrollTrigger: { trigger: seção, start: 'top top', end: 'bottom bottom', scrub: true }` que faz `scale: 1 → 3` na imagem (com `transformOrigin` em `alvo`), o título `opacity 1 → 0` no primeiro terço e a seção `opacity → 0` no último 15%. Usar sticky do CSS em vez de `pin: true` do GSAP: é mais leve no celular. `App.tsx` renderiza `<Hero>` no lugar do `<h1>` provisório (o teste do App continua passando).

- [ ] **Step 4: Rodar e ver passar; conferir no navegador**

Run: `npx vitest run` → PASS. Run: `npm run dev`, DevTools em 375×812: rolar faz o zoom suave e sem tremer; com "Emulate prefers-reduced-motion: reduce" a foto fica parada e o título visível.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: hero com zoom ligado ao scroll"
```

---

### Task 4: Seções das áreas com crossfade

**Files:**
- Create: `src/components/ImagemComFallback.tsx`, `src/components/AreaSection.tsx`, `src/components/AreasDoNavio.tsx`, `src/components/AreaSection.css`
- Modify: `src/App.tsx`
- Test: `src/components/ImagemComFallback.test.tsx`, `src/components/AreasDoNavio.test.tsx`

**Interfaces:**
- Consumes: `Area`, `areasDoNavio` (Task 2), `useReducedMotion` (Task 3), `gsap` (Task 1).
- Produces: `<ImagemComFallback src alt className? />` — se a imagem disparar `onError`, renderiza `<div role="img" aria-label={alt} data-fallback="true">` com fundo `--cor-fundo` clareado.
- Produces: `<AreaSection area={Area} midia?: ReactNode />` — `midia` substitui a foto (usado pela Task 5 para o 360°). Renderiza `<section id={area.id} aria-labelledby=...>` com `<h2>` nome, "Deck N" quando houver, descrição.
- Produces: `<AreasDoNavio areas={Area[]} renderMidia?: (a: Area) => ReactNode />` — monta uma `AreaSection` por área e o crossfade entre elas.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
// ImagemComFallback.test.tsx
it('troca por bloco de cor quando a imagem falha', () => {
  render(<ImagemComFallback src="/img/nao-existe.webp" alt="Teatro" />)
  fireEvent.error(screen.getByRole('img', { name: 'Teatro' }))
  expect(screen.getByRole('img', { name: 'Teatro' })).toHaveAttribute('data-fallback', 'true')
})

// AreasDoNavio.test.tsx
it('renderiza uma seção por área com título e deck', () => {
  render(<AreasDoNavio areas={areasDoNavio} />)
  expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(areasDoNavio.length)
  expect(screen.getByText(`Deck ${areasDoNavio[0].deck}`)).toBeInTheDocument()
})
it('usa renderMidia quando fornecido', () => {
  render(<AreasDoNavio areas={areasDoNavio.slice(0, 1)} renderMidia={() => <p>mídia custom</p>} />)
  expect(screen.getByText('mídia custom')).toBeInTheDocument()
})
it('com movimento reduzido todas as seções ficam visíveis', () => {
  // matchMedia → matches: true
  render(<AreasDoNavio areas={areasDoNavio} />)
  screen.getAllByRole('region').forEach(s => expect(s).not.toHaveStyle({ opacity: '0' }))
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components` → FAIL

- [ ] **Step 3: Implementar**

Crossfade: cada `AreaSection` tem `100svh`; o contêiner tem altura `areas.length × 100svh`. As camadas de mídia ficam empilhadas num `sticky` de `100svh` e, para cada área `i > 0`, um `ScrollTrigger` com `scrub: true` no trecho dela anima `opacity 0 → 1` da camada `i`. O bloco de texto de cada área rola normalmente por cima (entra de baixo). Sem animação quando `useReducedMotion()` for true: as seções viram blocos normais um embaixo do outro. `App.tsx`: `<Hero/>` depois `<AreasDoNavio areas={areasDoNavio}/>`.

- [ ] **Step 4: Rodar e ver passar; conferir no navegador**

Run: `npx vitest run` → PASS. No navegador em 375px: o fim do zoom do Hero cai direto na primeira área; cada troca de área é um fade sem tela preta no meio; áreas sem foto mostram o bloco de cor com o nome.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: seções das áreas com crossfade e fallback de imagem"
```

---

### Task 5: Panorama 360° sob demanda

**Files:**
- Create: `src/components/Panorama360.tsx`, `src/lib/suportaWebGL.ts`
- Modify: `src/App.tsx` (passa `renderMidia` para `AreasDoNavio`)
- Test: `src/components/Panorama360.test.tsx`

**Interfaces:**
- Consumes: `ImagemComFallback` (Task 4), `Area` (Task 2).
- Produces: `suportaWebGL(): boolean` (tenta `canvas.getContext('webgl2') ?? getContext('webgl')`, em `try/catch`).
- Produces: `<Panorama360 panorama imagemPlana alt />` — mostra `ImagemComFallback(imagemPlana)` até a seção ficar visível (`IntersectionObserver`, `rootMargin: '200px'`); então faz `import('@photo-sphere-viewer/core')` dinâmico e cria o `Viewer` com `navbar: false`, `touchmoveTwoFingers: true` (para um dedo continuar rolando a página) e `defaultZoomLvl: 0`. Destroi o viewer no unmount.

- [ ] **Step 1: Escrever os testes que falham**

```tsx
// mock de IntersectionObserver controlável e vi.mock('@photo-sphere-viewer/core')
it('mostra a foto plana antes de entrar na tela', () => {
  render(<Panorama360 panorama="/pano/piscina.webp" imagemPlana="/img/piscina.webp" alt="Piscina" />)
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
  expect(Viewer).not.toHaveBeenCalled()
})
it('cria o viewer quando entra na tela', async () => {
  // dispara intersecção
  await waitFor(() => expect(Viewer).toHaveBeenCalledWith(expect.objectContaining({ panorama: '/pano/piscina.webp' })))
})
it('sem WebGL fica na foto plana', async () => {
  vi.mocked(suportaWebGL).mockReturnValue(false)   // vi.mock('../lib/suportaWebGL') no topo; spyOn não funciona em ESM
  // dispara intersecção
  expect(Viewer).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument()
})
it('se o viewer der erro ao iniciar, volta para a foto plana', async () => {
  Viewer.mockImplementationOnce(() => { throw new Error('webgl lost') })
  // dispara intersecção
  await waitFor(() => expect(screen.getByRole('img', { name: 'Piscina' })).toBeInTheDocument())
})
it('destrói o viewer ao desmontar', ...)  // unmount → destroy chamado
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/Panorama360.test.tsx` → FAIL

- [ ] **Step 3: Implementar e ligar no App**

Importar o CSS do viewer (`@photo-sphere-viewer/core/index.css`) dentro do componente. No `App`, `renderMidia={a => a.panorama ? <Panorama360 panorama={a.panorama} imagemPlana={a.imagem} alt={a.nome}/> : undefined}`. Uma dica de uso "Arraste para olhar em volta" aparece sobre o panorama e some no primeiro toque.

- [ ] **Step 4: Rodar e ver passar; conferir no celular real**

Run: `npx vitest run` → PASS. Run: `npm run dev -- --host` e abrir no celular pela rede local: um dedo rola a página, arrastar com dois dedos (ou o giroscópio) gira o panorama; o bundle do viewer só aparece na aba Network quando a seção chega perto.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: panorama 360 carregado sob demanda com fallback"
```

---

### Task 6: Seção Búzios

**Files:**
- Create: `src/components/Buzios.tsx`, `src/components/Buzios.css`
- Modify: `src/App.tsx`
- Test: `src/components/Buzios.test.tsx`

**Interfaces:**
- Consumes: `lugaresBuzios` (Task 2), `AreasDoNavio` (Task 4; reaproveitado para os lugares).
- Produces: `<Buzios lugares={Area[]} />`.

- [ ] **Step 1: Escrever o teste que falha**

```tsx
it('abre com título e aviso de horário de volta', () => {
  render(<Buzios lugares={lugaresBuzios} />)
  expect(screen.getByRole('heading', { level: 2, name: 'Um dia em Búzios' })).toBeInTheDocument()
  expect(screen.getByText('Volta ao navio antes das 16h (confirme no seu bilhete).')).toBeInTheDocument()
})
it('mostra todos os lugares', () => {
  render(<Buzios lugares={lugaresBuzios} />)
  lugaresBuzios.forEach(l => expect(screen.getByRole('heading', { name: l.nome })).toBeInTheDocument())
})
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/components/Buzios.test.tsx` → FAIL

- [ ] **Step 3: Implementar**

Uma tela de abertura (`100svh`) com foto ampla de Búzios, o `<h2>` e o aviso em `--cor-destaque`; depois `<AreasDoNavio areas={lugares} />`, que sem `deck` não mostra a linha de deck. Uma leve mudança de tom (`--cor-fundo` → um azul mais claro) marca que saímos do navio. Adicionar no `App` depois de `AreasDoNavio`.

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run` → PASS; conferir a transição navio → Búzios no navegador.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: seção Búzios"
```

---

### Task 7: Seleção de favoritos (entrada da Fase 2)

**Files:**
- Create: `src/hooks/useFavoritos.ts`, `src/components/SelecaoFavoritos.tsx`, `src/components/SelecaoFavoritos.css`
- Modify: `src/App.tsx`
- Test: `src/hooks/useFavoritos.test.ts`, `src/components/SelecaoFavoritos.test.tsx`

**Interfaces:**
- Consumes: `Area`, `areasDoNavio`, `lugaresBuzios` (Task 2), `ImagemComFallback` (Task 4).
- Produces (a Fase 2 depende disto, não renomear):

```ts
export const CHAVE_FAVORITOS = 'divina:favoritos'   // valor: JSON de string[] de ids
export function useFavoritos(idsValidos: string[]): {
  selecionados: string[]          // na ordem em que foram marcados
  alternar: (id: string) => void
  limpar: () => void
}
```

- Produces: `<SelecaoFavoritos areas={Area[]} />`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// useFavoritos.test.ts (renderHook)
it('começa vazio', ...)                                   // selecionados → []
it('alternar marca e desmarca', ...)                      // ['teatro'] → []
it('mantém a ordem em que foram marcados', ...)            // spa, teatro → ['spa','teatro']
it('salva em localStorage', ...)                          // getItem(CHAVE_FAVORITOS) === '["teatro"]'
it('restaura do localStorage ao montar', ...)
it('ignora ids que não existem mais e JSON corrompido', () => {
  localStorage.setItem(CHAVE_FAVORITOS, '["teatro","sumiu"]')   // → ['teatro']
  localStorage.setItem(CHAVE_FAVORITOS, '{quebrado')            // → []
})
it('funciona com localStorage bloqueado', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SecurityError') })
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError') })
  // alternar('teatro') → selecionados ['teatro'], sem exceção
})

// SelecaoFavoritos.test.tsx
it('cada área é um botão de alternar', async () => {
  render(<SelecaoFavoritos areas={[...areasDoNavio, ...lugaresBuzios]} />)
  const b = screen.getByRole('button', { name: areasDoNavio[0].nome })
  expect(b).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(b)
  expect(b).toHaveAttribute('aria-pressed', 'true')
})
it('mostra o contador', ...)          // após 2 cliques: '2 lugares escolhidos'; 1 → '1 lugar escolhido'
it('limpar desmarca tudo', ...)       // botão 'Limpar seleção'
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/hooks/useFavoritos.test.ts src/components/SelecaoFavoritos.test.tsx` → FAIL

- [ ] **Step 3: Implementar**

Grade de 2 colunas no celular, 4 no desktop, separada em "No navio" e "Em Búzios". Cada item é `<button aria-pressed>` com miniatura e nome; marcado ganha borda `--cor-destaque` e um selo ✓. Contador fixo no rodapé da seção. Um texto abaixo: "Em breve: um roteiro com esses lugares." (placeholder honesto para a Fase 2). Adicionar no `App` depois de `<Buzios/>`.

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run` → PASS; marcar, recarregar a página e ver a seleção mantida.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: seleção de áreas favoritas salva no navegador"
```

---

### Task 8: Imagens, rodapé, polimento mobile e deploy

**Files:**
- Create: `scripts/otimizar-imagens.mjs`, `src/components/Rodape.tsx`
- Modify: `package.json` (script `"imagens"`), `src/App.tsx`, `src/lib/gsap.ts`
- Test: `src/components/Rodape.test.tsx`

**Interfaces:**
- Consumes: `areasDoNavio`, `lugaresBuzios` (créditos).
- Produces: `npm run imagens` lê `fotos-originais/{img,pano}/*.{jpg,jpeg,png,heic}` e grava em `public/{img,pano}/<nome-kebab>.webp`: fotos com `resize({ width: 1920, withoutEnlargement: true })` e qualidade reduzida em passos de 5 (de 80 até 50) até ≤ 200 KB; panoramas `resize(4096, 2048)` até ≤ 1,5 MB. Imprime nome, tamanho final e um aviso para cada arquivo que não coube no limite.

- [ ] **Step 1: Teste do rodapé (falha)**

```tsx
it('lista um crédito por foto, sem repetir', ...)   // créditos únicos de navio + Búzios
it('linka o tour oficial da MSC em nova aba', () => {
  render(<Rodape areas={[...areasDoNavio, ...lugaresBuzios]} />)
  const link = screen.getByRole('link', { name: 'Tour virtual oficial da MSC' })
  expect(link).toHaveAttribute('href', 'https://virtual-tours.msccruises.com/')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})
```

- [ ] **Step 2: Implementar `Rodape` e o script; rodar** — `npx vitest run` → PASS; `npm run imagens` com 2 fotos de teste → arquivos em `public/img` ≤ 200 KB.

- [ ] **Step 3: Robustez do scroll no celular**

Em `src/lib/gsap.ts`: `ScrollTrigger.config({ ignoreMobileResize: true })` e `ScrollTrigger.refresh()` no evento `orientationchange`. Primeira imagem do Hero com `fetchpriority="high"`; demais imagens com `loading="lazy"` e `decoding="async"`.

- [ ] **Step 4: Verificação no celular real (lista)**

Run: `npm run build && npm run preview -- --host`, abrir no celular:
- zoom do Hero sem engasgos; rolar rápido para cima e para baixo não deixa imagem presa no meio do fade;
- girar o aparelho no meio de uma área e voltar: nada desalinhado;
- aba anônima: favoritos funcionam;
- modo economia de bateria / movimento reduzido do sistema: conteúdo todo legível.

- [ ] **Step 5: Lighthouse**

Run: Lighthouse (Chrome DevTools, modo Mobile) no `npm run preview`.
Expected: Performance ≥ 80, Accessibility ≥ 95. Se Performance < 80, primeiro olhar o peso das imagens no relatório.

- [ ] **Step 6: Deploy na Vercel**

```bash
npm i -g vercel
vercel --prod
```

Abrir o link no celular de alguém da família antes de mandar no grupo.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: rodapé, pipeline de imagens e ajustes mobile"
```

---

## Fase 2 (futuro, plano separado): roteiro

Não faz parte deste plano. Fica registrado o que a Fase 1 deixa pronto e o que a Fase 2 vai precisar:

- **Entrada pronta:** `useFavoritos` e a chave `divina:favoritos` (Task 7), com os ids de `Area`.
- **A definir na Fase 2:** dados do roteiro real (embarque 18h, dia no mar, Búzios 7h–16h, desembarque 8h; confirmar na data do cruzeiro), horários de cada área (`Area` ganha `horarios` e `duracaoMin` opcionais), função pura `gerarRoteiro(selecionados, roteiro)` com testes, e a seção que mostra o plano dia a dia.
- **Pergunta em aberto:** gerar por regras (recomendado) ou com IA (aí entra uma função serverless na Vercel para guardar a chave).
