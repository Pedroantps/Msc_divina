// Uso: npm run faixas   (precisa de Node 22.18+, que importa .ts direto)
// Lê public/pano/*.webp e grava:
// (A faixa cilíndrica em public/faixa não é mais gerada: a câmera 360° usa os panoramas direto.
//  Os arquivos antigos ficam até o Percurso novo ser integrado.)
//   public/miniatura/<cena>.webp    recorte 320×180 em perspectiva, no yaw de cada cena
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { perspectiva, renderizar } from './projecao.mjs'

const RAIZ = path.resolve(import.meta.dirname, '..')
const PUBLICO = path.join(RAIZ, 'public')
const { areasDoNavio } = await import(pathToFileURL(path.join(RAIZ, 'src/data/areas.ts')).href)

const MINI = { largura: 320, altura: 180, campo: 90 }

const cache = new Map()
async function lerPanorama(arquivoPublico) {
  if (!cache.has(arquivoPublico)) {
    const { data, info } = await sharp(path.join(PUBLICO, arquivoPublico))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    cache.set(arquivoPublico, { data, largura: info.width, altura: info.height })
  }
  return cache.get(arquivoPublico)
}

async function gravarWebp(pixels, largura, altura, destino, limite) {
  let buffer
  let qualidade = 82
  for (let q = 82; q >= 50; q -= 4) {
    qualidade = q
    buffer = await sharp(pixels, { raw: { width: largura, height: altura, channels: 3 } })
      .webp({ quality: q })
      .toBuffer()
    if (!limite || buffer.length <= limite) break
  }
  await writeFile(destino, buffer)
  return { kb: Math.round(buffer.length / 1024), qualidade }
}

await mkdir(path.join(PUBLICO, 'miniatura'), { recursive: true })

for (const area of areasDoNavio) {
  for (const cena of area.cenas) {
    const p = await lerPanorama(cena.panorama)
    const m = perspectiva({ yaw: cena.yaw, ...MINI })
    const px = renderizar(p.data, p.largura, p.altura, m, MINI.largura, MINI.altura)
    await gravarWebp(px, MINI.largura, MINI.altura, path.join(PUBLICO, 'miniatura', `${cena.id}.webp`))
  }
  console.log(`  ${area.cenas.length} miniatura(s)`)
  cache.clear()
}
