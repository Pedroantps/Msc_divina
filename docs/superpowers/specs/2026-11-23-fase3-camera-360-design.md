# Fase 3: percurso do navio como câmera 360° na rolagem (design)

Data: 23/11/2026. Base: `main` em `f48ea71` (Fase 2 entregue).

## 1. Intenção

O capítulo "O navio" (`Percurso`) hoje mostra, em cada parada, uma faixa plana tirada do
panorama e a desliza para o lado com a rolagem. O resultado, nas palavras da família: imagem
"muito ruim", rolagem "não está suave" e movimento que "só joga a visualização pro lado".
O objetivo é a sensação de **estar andando dentro do navio**: a rolagem vira a câmera, e a
passagem de uma área para a outra parece um deslocamento, não um corte.

## 2. Diagnóstico (o que está errado hoje)

| Sintoma | Causa no código |
|---|---|
| Imagem borrada | `scripts/gerar-faixas.mjs` projeta ~150° de um panorama 4096×2048 (≈1700 px úteis) numa faixa de 3240 px: estica ~1,9×. Depois ainda tem `scale: 1.08` e WebP forçado a ≤ 250 KB. |
| Panoramas abaixo do original | `otimizar-imagens.mjs` comprime os panos até 1,5 MB (ex.: `4d-cinema` 1047 KB JPG → 378 KB WebP). |
| Rolagem dura | Rolagem nativa sem suavização; `scrub: true` sem amortecimento; transform em imagens de 3240 px com 14 camadas empilhadas. |
| Movimento pobre | `Percurso.tsx` anima só `x` e um zoom de 8%: não há câmera, perspectiva nem profundidade. |

Teto físico: os panoramas originais têm 4096×2048 (≈11 px por grau). Com campo de visão de
~100° numa tela de 1440 px a imagem fica perto de 1:1; abaixo de ~75° ela amolece. A
coreografia respeita esse limite (ver 5.3).

## 3. Metas, não-metas, antimetas

**Metas**
- Palco WebGL único e fixo que mostra o panorama real em perspectiva correta (sem faixa esticada).
- A rolagem controla yaw, pitch e campo de visão; a passagem entre áreas é um "avanço" da câmera
  (aproxima para o ponto de saída, dissolve no panorama seguinte que chega aberto).
- Rolagem suave no site todo (Lenis ligado ao ScrollTrigger).
- 60 fps em notebook comum e celular médio; sem engasgo ao trocar de área.

**Não-metas**
- Não muda Hero, Búzios, Favoritos, Créditos e Rodapé além da troca de `scrollIntoView` para a
  rolagem suave.
- O modal `TourArea` continua como está (exploração livre com arrastar). Explorar no próprio
  palco, sem modal, fica para depois.
- Sem modelos 3D: só os panoramas que já existem.

**Antimetas (falhou mesmo se "funcionar")**
- A roda do mouse gira o 360 de forma solta, como num visualizador, e o usuário perde o controle da página.
- Enjoo: giros rápidos demais ou zoom brusco.
- A página trava, esquenta ou cai no celular por falta de memória de GPU.
- Quem tem reduced motion ou não tem WebGL fica sem conteúdo.

## 4. Abordagens consideradas

| Abordagem | Troca | Decisão |
|---|---|---|
| **A. Câmera 360° na rolagem** (WebGL, panorama real) | Mais imersiva e mais nítida; custo de GPU e um fallback a manter | **Escolhida pela família** |
| B. Cinema com fotos nítidas (parallax, máscaras, Lenis) | Leve e segura, mas continua sendo "foto passando" | Descartada; vira o fallback de A |
| C. Híbrido (foto que abre para o 360 ao parar) | Meio-termo; duas linguagens visuais no mesmo capítulo | Descartada |

## 5. Design

### 5.1 Peças

1. **`PalcoPanorama`** (novo): um `<canvas>` sticky de 100svh com three.js (já instalado como
   dependência do Photo Sphere Viewer, então o bundle não cresce com outra biblioteca 3D).
   Uma esfera invertida por panorama carregado, com câmera perspectiva no centro. Um shader de
   transição mistura dois panoramas: a cena atual avança (FOV fecha + leve desfoque radial) e a
   próxima chega com FOV aberto. API imperativa e sem React no laço de quadro:
   `definirEstado({ cenaA, cenaB, mistura, yaw, pitch, fov })`. Só renderiza quando o estado muda.
2. **Gerente de texturas**: mantém no máximo 3 panoramas na GPU (anterior, atual, próxima);
   pré-carrega a próxima por `fetch` + `createImageBitmap` fora da thread principal; chama
   `dispose()` ao sair da janela. Mipmaps, anisotropia máxima, `SRGBColorSpace`.
3. **Roteiro** (dados): para cada área, quadros-chave de câmera em função do progresso da parada
   (0–1): `{ p, yaw, pitch, fov }`, e `saida.yaw`, a direção para onde a câmera "anda" ao sair.
   Um padrão calculado a partir do `yaw` da cena serve para todas; uma área pode sobrescrever.
4. **`estadoNaRolagem(progressoGlobal, roteiro)`**: função pura que devolve o estado da câmera.
   É testável sem WebGL e é o coração da coreografia.
5. **Rolagem suave**: Lenis ligado ao `gsap.ticker`, `ScrollTrigger.update` a cada quadro; os
   `scrollIntoView` do Cromo, da NavCapitulos e dos Favoritos passam a usar `lenis.scrollTo`.
   Desligado em reduced motion e no modal (o `<dialog>` trava a rolagem do fundo).
6. **Capacidade** (`useCapacidade3D`): WebGL2/1 disponível, `prefers-reduced-motion`,
   `navigator.saveData`, `deviceMemory`, tamanho máximo de textura. Escolhe entre
   `alta` (panos 4096), `media` (panos 2048, DPR ≤ 1,5) e `sem3d` (fallback).
7. **Fallback `sem3d`**: as fotos 1920 px de `public/img` em tela cheia, com aproximação lenta e
   dissolve entre áreas. Reduced motion continua com a lista estática que já existe.

### 5.2 Coreografia por parada (altura ~200svh)

| Progresso | Câmera | Texto |
|---|---|---|
| 0,00–0,15 | chega: FOV 110° → 95°, mistura da cena anterior termina | — |
| 0,15–0,70 | giro lento de ~70° (yaw), pitch oscila ±4°, FOV 95° → 85° | título entra, CTA "Ver em 360°" |
| 0,70–0,85 | vira para `saida.yaw` | texto sai |
| 0,85–1,00 | avanço: FOV 85° → 55° + desfoque radial; mistura → próxima cena | — |

Velocidade máxima de giro: 90° por tela rolada (contra enjoo). A posição do texto alterna
esquerda/centro/direita como hoje, com o véu de contraste.

### 5.3 Nitidez

- Panoramas regenerados do original com WebP qualidade ≥ 88, sem teto de 1,5 MB (variante 4096),
  mais uma variante 2048 para a capacidade `media`.
- FOV nunca abaixo de 55° e só durante o avanço (que já tem desfoque de movimento); nas fases de
  leitura o FOV fica ≥ 85°.
- DPR do canvas: `min(devicePixelRatio, 2)` na capacidade alta e 1,5 na média.
- As faixas (`public/faixa`) e `gerar-faixas.mjs` saem do Percurso. As miniaturas ficam (o modal usa).

### 5.4 Peso e carga

- O primeiro panorama (Recepção, variante conforme capacidade) é pré-carregado quando o Hero
  passa da metade; o palco mostra a foto 1920 da Recepção até a textura subir.
- Janela de 3 texturas: 4096² RGBA com mipmaps ≈ 45 MB por textura; 3 = ~135 MB na alta. Na
  média (2048) ≈ 11 MB cada.

## 6. Restrições

- React 18 + Vite + GSAP já em uso; sem trocar o framework.
- Os testes rodam em jsdom (sem WebGL): a lógica fica em funções puras e o canvas atrás de uma
  interface simulável.
- Site protegido por senha no deploy (licença das imagens); nada muda aqui.
- `areas.ts` é a fonte da verdade dos dados das áreas; o roteiro mora ao lado (`roteiro.ts`).

## 7. O que fica com o implementador

- Forma exata do shader de transição (desfoque radial vs. zoom blur), desde que respeite a tabela 5.2.
- Curvas de easing entre quadros-chave.
- Limiares exatos de `deviceMemory` e textura máxima para escolher a capacidade.
