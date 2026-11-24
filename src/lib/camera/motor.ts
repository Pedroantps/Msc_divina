import { MathUtils, Mesh, PerspectiveCamera, Scene, SphereGeometry, Texture, Vector3, WebGLRenderer } from 'three'
import type { ShaderMaterial } from 'three'
import { avancoDoFov, criarCarregadorTextura, criarMaterialPanorama, descartarTextura } from './shader'
import { GerenteTexturas } from './texturas'
import type { Carregador } from './texturas'
import type { EstadoCamera, Vista } from './tipos'

export interface Motor {
  definirEstado(e: EstadoCamera): void
  redimensionar(l: number, a: number): void
  /** Troca a densidade de pixels (ex.: janela levada para outro monitor) sem recriar o contexto. */
  definirDpr(dpr: number): void
  /** Solta as texturas (capítulo fora da tela); o próximo definirEstado recarrega. */
  liberar(): void
  destruir(): void
}

export interface OpcoesMotor {
  dpr: number
  /** Contexto WebGL perdido: quem usa o motor troca para o palco de fotos. */
  aoFalhar: () => void
  /**
   * Avisa se há panorama na tela (`a`, ou `b` com mistura > 0): é o que mostra o canvas.
   * `aPronta` diz se a cena `a` está desenhada; só então o pôster pode sair (com `b` em
   * mistura baixa a tela ficaria quase vazia sem ele).
   */
  aoPronto?: (pronto: boolean, detalhe: { aPronta: boolean }) => void
  /** Carregador das texturas; o padrão é `fetch` + `createImageBitmap` (injetável nos testes). */
  carregador?: Carregador<Texture>
}

/** Uma vista desenhável: câmera própria e esfera com o material do panorama. */
interface Camada {
  camera: PerspectiveCamera
  cena: Scene
  material: ShaderMaterial
}

function criarCamada(geometria: SphereGeometry): Camada {
  const material = criarMaterialPanorama()
  const cena = new Scene()
  cena.add(new Mesh(geometria, material))
  const camera = new PerspectiveCamera(90, 1, 0.1, 100)
  camera.rotation.order = 'YXZ'
  return { camera, cena, material }
}

const frente = new Vector3()

/** Em retrato o FOV vertical da coreografia abre por este fator (85° → 100°), até FOV_RETRATO_MAX. */
const FATOR_RETRATO = 100 / 85
const FOV_RETRATO_MAX = 115

/**
 * O FOV da coreografia vale como vertical e foi aprovado em paisagem. Em retrato (aspect < 1)
 * a vista ficaria estreita demais na horizontal, então ele abre um pouco.
 */
function fovDaCamera(fov: number, aspect: number): number {
  return aspect < 1 ? Math.min(FOV_RETRATO_MAX, fov * FATOR_RETRATO) : fov
}

/** Aponta a câmera da camada para a vista e prepara os uniforms. */
function prepararCamada(c: Camada, vista: Vista, textura: Texture, opacidade: number, desfocar: boolean): void {
  c.camera.rotation.y = -MathUtils.degToRad(vista.yaw)
  c.camera.rotation.x = MathUtils.degToRad(vista.pitch)
  const fov = fovDaCamera(vista.fov, c.camera.aspect)
  if (c.camera.fov !== fov) {
    c.camera.fov = fov
    c.camera.updateProjectionMatrix()
  }
  c.camera.updateMatrixWorld()
  c.camera.getWorldDirection(frente)
  const u = c.material.uniforms
  u.uTextura.value = textura
  u.uOpacidade.value = opacidade
  u.uAvanco.value = desfocar ? avancoDoFov(vista.fov) : 0
  ;(u.uFrente.value as Vector3).copy(frente)
}

/** Prazo do upload ocioso: numa rolagem sem pausa a textura sobe mesmo assim. */
const PRAZO_OCIOSO = 500

/** Roda `fn` quando a thread principal estiver ociosa (ou no próximo ciclo). Devolve o cancelamento. */
function quandoOcioso(fn: () => void): () => void {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(() => fn(), { timeout: PRAZO_OCIOSO })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 0)
  return () => clearTimeout(id)
}

/** Depois do upload a GPU tem a cópia: o bitmap decodificado (~32 MB em 4096 px) pode sair da memória. */
function soltarImagem(textura: Texture): void {
  const imagem = textura.image as ImageBitmap | null
  if (imagem && typeof imagem.close === 'function') imagem.close()
  textura.image = null
}

/** Tempo que a cena precisa ficar estável antes de trocar a janela de texturas (salto por âncora). */
const ESPERA_FOCO = 120

function iguais(x: Vista | null, y: Vista | null): boolean {
  if (x === null || y === null) return x === y
  return x.cena === y.cena && x.yaw === y.yaw && x.pitch === y.pitch && x.fov === y.fov
}

/**
 * Motor WebGL do palco: duas camadas (vista `a` e vista `b`, cada uma com sua câmera) desenhadas
 * uma sobre a outra, com `b` na opacidade da mistura. Só desenha quando o estado muda ou chega
 * uma textura, num único requestAnimationFrame. O gerente mantém no máximo 3 texturas vivas.
 */
export function criarMotor(canvas: HTMLCanvasElement, urls: string[], opcoes: OpcoesMotor): Motor {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
  })
  let dpr = opcoes.dpr
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  const geometria = new SphereGeometry(10, 64, 32)
  const camadaA = criarCamada(geometria)
  const camadaB = criarCamada(geometria)

  // Upload à GPU fora da transição: a textura que chega espera o tempo ocioso para subir
  // (initTexture), uma por vez, e só entra no desenho depois disso.
  const enviadas = new Set<Texture>()
  const pendentes = new Map<Texture, number>()
  let cancelarEnvio: (() => void) | null = null

  const gerente = new GerenteTexturas<Texture>(
    urls,
    opcoes.carregador ?? criarCarregadorTextura(renderer.capabilities.getMaxAnisotropy()),
    (textura) => {
      pendentes.delete(textura)
      enviadas.delete(textura)
      descartarTextura(textura)
    },
  )

  /** A textura da cena, só se já estiver na GPU. */
  function pronta(cena: number): Texture | undefined {
    const textura = gerente.obter(cena)
    return textura && enviadas.has(textura) ? textura : undefined
  }

  let estado: EstadoCamera | null = null
  let quadro = 0
  let pronto: boolean | null = null
  let aPronta: boolean | null = null

  function avisarPronto(agora: boolean, aAgora: boolean) {
    if (agora === pronto && aAgora === aPronta) return
    pronto = agora
    aPronta = aAgora
    opcoes.aoPronto?.(agora, { aPronta: aAgora })
  }
  let perdido = false
  /** Cena cuja janela o gerente mantém (null: nada focado ainda, ou liberado). */
  let focada: number | null = null
  let timerFoco: ReturnType<typeof setTimeout> | undefined
  /** Cena que o timer vai focar; estados da mesma cena (yaw, fov, mistura) não reiniciam a espera. */
  let alvoPendente: number | null = null

  /** Foca na hora no primeiro estado; depois, só quando a cena para de mudar por ESPERA_FOCO. */
  function focar(cena: number) {
    if (cena === alvoPendente && timerFoco !== undefined) return
    clearTimeout(timerFoco)
    timerFoco = undefined
    alvoPendente = null
    if (cena === focada) return
    if (focada === null) {
      focada = cena
      gerente.focar(cena)
      return
    }
    alvoPendente = cena
    timerFoco = setTimeout(() => {
      timerFoco = undefined
      alvoPendente = null
      focada = cena
      gerente.focar(cena)
    }, ESPERA_FOCO)
  }

  function desenhar() {
    quadro = 0
    if (!estado || perdido) return
    const { a, b, mistura } = estado
    const texA = pronta(a.cena)
    const texB = b ? pronta(b.cena) : undefined
    renderer.clear()
    if (texA && mistura < 1) {
      prepararCamada(camadaA, a, texA, 1, true)
      renderer.render(camadaA.cena, camadaA.camera)
    }
    if (b && texB && mistura > 0) {
      // A cena que chega fica nítida: o desfoque é só da que sai.
      prepararCamada(camadaB, b, texB, mistura, false)
      renderer.render(camadaB.cena, camadaB.camera)
    }
    // Visível se alguma camada desenhou algo: `a`, ou `b` durante o avanço.
    const aAgora = texA !== undefined
    avisarPronto(aAgora || (texB !== undefined && mistura > 0), aAgora)
  }

  function agendar() {
    if (quadro === 0) quadro = requestAnimationFrame(desenhar)
  }

  function enviarProxima() {
    cancelarEnvio = null
    if (perdido || pendentes.size === 0) return
    // A cena atual primeiro, depois a próxima; o resto na ordem de chegada.
    const prioridade = [estado?.a.cena, estado?.b?.cena]
    let escolhida = pendentes.keys().next().value!
    for (const [textura, cena] of pendentes) {
      if (prioridade.includes(cena)) {
        escolhida = textura
        if (cena === prioridade[0]) break
      }
    }
    pendentes.delete(escolhida)
    renderer.initTexture(escolhida)
    enviadas.add(escolhida)
    soltarImagem(escolhida)
    agendar()
    agendarEnvio()
  }

  function agendarEnvio() {
    if (cancelarEnvio === null && pendentes.size > 0) cancelarEnvio = quandoOcioso(enviarProxima)
  }

  /** Uma textura chegou (ou falhou): põe as novas na fila de upload. */
  function aoMudarTexturas() {
    for (let i = 0; i < urls.length; i++) {
      const textura = gerente.obter(i)
      if (textura && !enviadas.has(textura) && !pendentes.has(textura)) pendentes.set(textura, i)
    }
    agendarEnvio()
  }

  const pararAviso = gerente.aoMudar(aoMudarTexturas)

  function aoPerder(e: Event) {
    e.preventDefault()
    if (perdido) return
    perdido = true
    opcoes.aoFalhar()
  }
  canvas.addEventListener('webglcontextlost', aoPerder)

  return {
    definirEstado(e) {
      if (estado && estado.mistura === e.mistura && iguais(estado.a, e.a) && iguais(estado.b, e.b)) return
      // Cópia: quem chama pode reaproveitar o objeto a cada quadro de rolagem.
      estado = { a: { ...e.a }, b: e.b ? { ...e.b } : null, mistura: e.mistura }
      focar(e.a.cena)
      agendar()
    },
    redimensionar(l, a) {
      if (l <= 0 || a <= 0) return
      renderer.setSize(l, a, false)
      for (const c of [camadaA, camadaB]) {
        c.camera.aspect = l / a
        c.camera.updateProjectionMatrix()
      }
      agendar()
    },
    definirDpr(novo) {
      if (novo === dpr) return
      dpr = novo
      renderer.setPixelRatio(dpr)
      agendar()
    },
    liberar() {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = 0
      clearTimeout(timerFoco)
      timerFoco = undefined
      alvoPendente = null
      focada = null
      estado = null
      gerente.liberar()
      avisarPronto(false, false)
    },
    destruir() {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = 0
      clearTimeout(timerFoco)
      cancelarEnvio?.()
      cancelarEnvio = null
      canvas.removeEventListener('webglcontextlost', aoPerder)
      pararAviso()
      gerente.destruir()
      camadaA.material.dispose()
      camadaB.material.dispose()
      geometria.dispose()
      renderer.dispose()
    },
  }
}
