// Uso: npm run imagens
// Também gera public/img/640/<nome>.webp (640px de largura, até 70 KB) a partir de public/img/*.webp.
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

// Retorna 'ok', 'acima' (passou do limite) ou 'ignorado' (nome vazio ou colisão).
async function otimizar(arquivo, tipo, config, gravados) {
  const base = path.basename(arquivo, path.extname(arquivo))
  const kebab = paraKebab(base)
  if (!kebab) {
    console.warn(`AVISO: ${tipo}/${arquivo} ignorado: o nome não tem letras nem números`)
    return 'ignorado'
  }
  const nome = `${kebab}.webp`
  const destino = path.join(SAIDA, tipo, nome)
  if (gravados.has(destino)) {
    console.warn(`AVISO: ${tipo}/${arquivo} ignorado: gera ${nome}, que já veio de ${tipo}/${gravados.get(destino)}`)
    return 'ignorado'
  }
  gravados.set(destino, arquivo)
  const original = path.join(ENTRADA, tipo, arquivo)

  let melhor
  let qualidade = 80
  for (; qualidade >= 50; qualidade -= 5) {
    melhor = await config.redimensionar(sharp(original).rotate()).webp({ quality: qualidade }).toBuffer()
    if (melhor.length <= config.limite) break
  }
  if (qualidade < 50) qualidade = 50
  const existia = existsSync(destino)
  await writeFile(destino, melhor)

  const kb = (melhor.length / 1024).toFixed(0)
  console.log(`${tipo}/${nome}  ${kb} KB  qualidade ${qualidade}${existia ? '  (sobrescreveu)' : ''}`)
  if (melhor.length > config.limite) {
    console.warn(`AVISO: ${tipo}/${nome} ficou com ${kb} KB, acima do limite de ${(config.limite / 1024).toFixed(0)} KB`)
    return 'acima'
  }
  return 'ok'
}

const LARGURA_MINI = 640
const LIMITE_MINI = 70 * 1024

// Variante de 640px para cartões pequenos: public/img/640/<nome>.webp, a partir de public/img/*.webp.
async function gerarVariantes640() {
  const origem = path.join(SAIDA, 'img')
  if (!existsSync(origem)) return
  const destinoPasta = path.join(origem, String(LARGURA_MINI))
  await mkdir(destinoPasta, { recursive: true })
  for (const arquivo of (await readdir(origem)).filter((f) => /\.webp$/i.test(f)).sort()) {
    let melhor
    for (let qualidade = 80; qualidade >= 40; qualidade -= 5) {
      melhor = await sharp(path.join(origem, arquivo))
        .resize({ width: LARGURA_MINI, withoutEnlargement: true })
        .webp({ quality: qualidade })
        .toBuffer()
      if (melhor.length <= LIMITE_MINI) break
    }
    await writeFile(path.join(destinoPasta, arquivo), melhor)
    const kb = (melhor.length / 1024).toFixed(0)
    console.log(`img/${LARGURA_MINI}/${arquivo}  ${kb} KB`)
    if (melhor.length > LIMITE_MINI) console.warn(`AVISO: img/${LARGURA_MINI}/${arquivo} ficou com ${kb} KB, acima de 70 KB`)
  }
}

async function main() {
  await gerarVariantes640()
  if (!existsSync(ENTRADA)) {
    console.log('Pasta fotos-originais/ não existe. Crie fotos-originais/img e fotos-originais/pano e coloque as fotos lá.')
    return
  }
  let total = 0
  let acima = 0
  let ignorados = 0
  const gravados = new Map()
  let erros = 0
  for (const [tipo, config] of Object.entries(TIPOS)) {
    const pasta = path.join(ENTRADA, tipo)
    if (!existsSync(pasta)) continue
    await mkdir(path.join(SAIDA, tipo), { recursive: true })
    for (const arquivo of (await readdir(pasta)).filter((f) => EXTENSOES.test(f)).sort()) {
      try {
        total++
        const r = await otimizar(arquivo, tipo, config, gravados)
        if (r === 'acima') acima++
        if (r === 'ignorado') ignorados++
      } catch (e) {
        erros++
        console.warn(`AVISO: não consegui processar ${tipo}/${arquivo}: ${e.message}`)
        if (/\.heic$/i.test(arquivo)) {
          console.warn('  Dica: o sharp costuma não ler HEIC. Exporte a foto como JPG e rode de novo.')
        }
      }
    }
  }
  console.log(`\n${total} arquivo(s): ${total - acima - erros - ignorados} dentro do limite, ${acima} acima, ${ignorados} ignorado(s), ${erros} com erro.`)
}

main()
