// Projeções a partir de um panorama equirretangular (largura = 2 × altura).
// yaw 0 é o centro da imagem; yaw positivo gira para a direita. Ângulos em graus.

const RAD = Math.PI / 180

/** Ponto (lon, lat) em radianos → posição em pixels no equirretangular. */
export function lonLatParaPixel(lon, lat, largura, altura) {
  let x = ((lon + Math.PI) / (2 * Math.PI)) * largura - 0.5
  x = ((x % largura) + largura) % largura
  const y = ((Math.PI / 2 - lat) / Math.PI) * altura - 0.5
  return [x, Math.min(altura - 1, Math.max(0, y))]
}

/**
 * Faixa cilíndrica: o eixo x anda em ângulo de forma linear (sem esticar as bordas
 * como a perspectiva faz), o eixo y segue a tangente da latitude.
 * Devolve, para o pixel (px, py) da saída, a posição na origem.
 */
export function cilindrica({ yaw, campo, largura, altura }) {
  const f = largura / (campo * RAD)
  return (px, py) => {
    const lon = yaw * RAD + (px + 0.5 - largura / 2) / f
    const lat = Math.atan((altura / 2 - (py + 0.5)) / f)
    return [lon, lat]
  }
}

/** Recorte em perspectiva (como uma foto normal) com campo horizontal `campo`. */
export function perspectiva({ yaw, campo, largura, altura }) {
  const f = largura / 2 / Math.tan((campo * RAD) / 2)
  const y0 = yaw * RAD
  return (px, py) => {
    const dx = px + 0.5 - largura / 2
    const dy = altura / 2 - (py + 0.5)
    const lonLocal = Math.atan2(dx, f)
    const lat = Math.atan2(dy, Math.hypot(dx, f))
    return [y0 + lonLocal, lat]
  }
}

/** Amostra bilinear de RGB com repetição horizontal (o 360° fecha nas bordas). */
export function renderizar(origem, larguraOrigem, alturaOrigem, mapa, largura, altura) {
  const saida = Buffer.alloc(largura * altura * 3)
  for (let py = 0; py < altura; py++) {
    for (let px = 0; px < largura; px++) {
      const [lon, lat] = mapa(px, py)
      const [x, y] = lonLatParaPixel(lon, lat, larguraOrigem, alturaOrigem)
      const x0 = Math.floor(x)
      const y0 = Math.floor(y)
      const x1 = (x0 + 1) % larguraOrigem
      const y1 = Math.min(alturaOrigem - 1, y0 + 1)
      const fx = x - x0
      const fy = y - y0
      const d = (py * largura + px) * 3
      for (let c = 0; c < 3; c++) {
        const a = origem[(y0 * larguraOrigem + x0) * 3 + c]
        const b = origem[(y0 * larguraOrigem + x1) * 3 + c]
        const e = origem[(y1 * larguraOrigem + x0) * 3 + c]
        const g = origem[(y1 * larguraOrigem + x1) * 3 + c]
        saida[d + c] = Math.round((a * (1 - fx) + b * fx) * (1 - fy) + (e * (1 - fx) + g * fx) * fy)
      }
    }
  }
  return saida
}
