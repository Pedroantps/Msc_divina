// Uso: npm run imagens
// Lê fotos-originais/{img,pano}/*.{jpg,jpeg,png,heic} e grava public/{img,pano}/<nome-kebab>.webp
import { existsSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const RAIZ = path.resolve(import.meta.dirname, '..')
const ENTRADA = path.join(RAIZ, 'fotos-originais')
const SAIDA = path.join(RAIZ, 'public')

const TIPOS = {
  img: { limite: 200 * 1024, redimensionar: (s) => s.resize({ width: 1920, withoutEnlargement: true }) },
  // 'fill': o panorama equirretangular precisa ser exatamente 2:1 e inteiro.
  // 'cover' cortaria parte dos 360 graus; 'fill' só distorce se a origem não for 2:1.
  pano: { limite: 1.5 * 1024 * 1024, redimensionar: (s) => s.resize(4096, 2048, { fit: 'fill' }) },
}

const EXTENSOES = /\.(jpe?g|png|heic)$/i

export function paraKebab(base) {
  return base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function otimizar(arquivo, tipo, config) {
  const base = path.basename(arquivo, path.extname(arquivo))
  const nome = `${paraKebab(base)}.webp`
  const destino = path.join(SAIDA, tipo, nome)
  const original = path.join(ENTRADA, tipo, arquivo)

  let melhor
  let qualidade = 80
  for (; qualidade >= 50; qualidade -= 5) {
    melhor = await config.redimensionar(sharp(original).rotate()).webp({ quality: qualidade }).toBuffer()
    if (melhor.length <= config.limite) break
  }
  if (qualidade < 50) qualidade = 50
  await writeFile(destino, melhor)

  const kb = (melhor.length / 1024).toFixed(0)
  console.log(`${tipo}/${nome}  ${kb} KB  qualidade ${qualidade}`)
  if (melhor.length > config.limite) {
    console.warn(`AVISO: ${tipo}/${nome} ficou com ${kb} KB, acima do limite de ${(config.limite / 1024).toFixed(0)} KB`)
    return false
  }
  return true
}

async function main() {
  if (!existsSync(ENTRADA)) {
    console.log('Pasta fotos-originais/ não existe. Crie fotos-originais/img e fotos-originais/pano e coloque as fotos lá.')
    return
  }
  let total = 0
  let acima = 0
  let erros = 0
  for (const [tipo, config] of Object.entries(TIPOS)) {
    const pasta = path.join(ENTRADA, tipo)
    if (!existsSync(pasta)) continue
    await mkdir(path.join(SAIDA, tipo), { recursive: true })
    for (const arquivo of (await readdir(pasta)).filter((f) => EXTENSOES.test(f))) {
      try {
        total++
        if (!(await otimizar(arquivo, tipo, config))) acima++
      } catch (e) {
        erros++
        console.warn(`AVISO: não consegui processar ${tipo}/${arquivo}: ${e.message}`)
      }
    }
  }
  console.log(`\n${total} arquivo(s): ${total - acima - erros} dentro do limite, ${acima} acima, ${erros} com erro.`)
}

main()
