# Site MSC Divina — Design (Fase 1: site visual)

**Data:** 2026-11-17
**Objetivo:** site pessoal, para estudo e para animar a família, que conta o cruzeiro MSC Divina (Santos → Búzios → Santos, 3 noites) por scroll.
**Fora desta fase:** gerador de roteiro/plano de dias (Fase 2). A Fase 1 só deixa pronta a lista de áreas favoritas que a Fase 2 vai consumir.

## Público e restrições

- Uso privado: link enviado à família. Sem SEO, sem login, sem backend.
- Celular é o dispositivo principal. Tudo precisa funcionar bem em tela de 375px.
- Material: fotos próprias, Wikimedia Commons (licença conferida, crédito exibido) ou link/iframe para o tour oficial da MSC. Não copiar arquivos do site da MSC.
- O código é escrito pelo próprio usuário para aprender; o plano define decisões, não corpo de função.

## Experiência (de cima para baixo)

1. **Hero:** foto do navio por fora, em tela cheia, com o título "MSC Divina". Ao rolar, a imagem fica presa (pin) e escala de 1x para 3x em direção a um ponto do casco; no fim do zoom ela some em fade e revela a primeira área.
2. **Áreas do navio (8 a 10):** cada área ocupa uma tela, com foto em tela cheia, nome, deck e duas linhas de descrição. A passagem de uma área para a próxima é um crossfade ligado ao scroll.
3. **360° (2 ou 3 áreas):** nessas áreas a foto dá lugar a um panorama navegável (arrastar/giroscópio). Se o aparelho não suportar WebGL, mostra a foto comum.
4. **Búzios:** seção com 3 a 5 lugares (praias, Rua das Pedras, Orla Bardot) no mesmo formato das áreas, com o aviso "volta ao navio antes das 16h (confirme no seu bilhete)".
5. **Favoritos:** grade com miniaturas de todas as áreas e lugares de Búzios; tocar marca/desmarca. A seleção fica salva no navegador e é a entrada da Fase 2.
6. **Rodapé:** créditos das fotos e link para o tour virtual oficial da MSC.

## Estética

Tema "noite no mar": fundo azul-marinho escuro, texto creme, um dourado de destaque. Títulos em serifada de exibição (Fraunces), texto em sans legível (Inter). Fotos ocupam a tela inteira; o texto fica sobre um degradê escuro na parte de baixo. Sem cards com sombra, sem ícones decorativos.

## Requisitos técnicos

- Vite + React 18 + TypeScript (strict).
- GSAP 3 + ScrollTrigger + `@gsap/react`.
- Photo Sphere Viewer 5 (`@photo-sphere-viewer/core`) para 360°, carregado só quando a seção entra na tela.
- Imagens WebP, largura máx. 1920px, até 200 KB cada; panoramas até 1,5 MB (4096×2048).
- `prefers-reduced-motion: reduce` desliga pin, zoom e crossfade; o conteúdo vira uma sequência estática.
- Alturas em `svh` para não pular quando a barra do navegador do celular aparece/some.
- Deploy na Vercel (estático).
- Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 95.
