import { MathUtils, Mesh, PerspectiveCamera, Scene, SphereGeometry, Texture, Vector3, WebGLRenderer } from 'three'
import type { ShaderMaterial } from 'three'
import { avancoDoFov, criarCarregadorTextura, criarMaterialPanorama, descartarTextura } from './shader'
import { GerenteTexturas } from './texturas'
import type { Carregador } from './texturas'
import type { EstadoCamera, Vista } from './tipos'

export interface Motor {
  definirEstado(e: EstadoCamera): void
  redimensionar(l: number, a: number): void
  destruir(): void
}

export interface OpcoesMotor {
  dpr: number
  /** Contexto WebGL perdido: quem usa o motor troca para o palco de fotos. */
  aoFalhar: () => void
  /** Avisa se a textura da cena atual (`a`) está na tela; enquanto não estiver, vale o pôster. */
  aoPronto?: (pronto: boolean) => void
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

/** Aponta a câmera da camada para a vista e prepara os uniforms. */
function prepararCamada(c: Camada, vista: Vista, textura: Texture, opacidade: number): void {
  c.camera.rotation.y = -MathUtils.degToRad(vista.yaw)
  c.camera.rotation.x = MathUtils.degToRad(vista.pitch)
  if (c.camera.fov !== vista.fov) {
    c.camera.fov = vista.fov
    c.camera.updateProjectionMatrix()
  }
  c.camera.updateMatrixWorld()
  c.camera.getWorldDirection(frente)
  const u = c.material.uniforms
  u.uTextura.value = textura
  u.uOpacidade.value = opacidade
  u.uAvanco.value = avancoDoFov(vista.fov)
  ;(u.uFrente.value as Vector3).copy(frente)
}

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
  renderer.setPixelRatio(opcoes.dpr)
  renderer.setClearColor(0x000000, 0)
  renderer.autoClear = false

  const geometria = new SphereGeometry(10, 64, 32)
  const camadaA = criarCamada(geometria)
  const camadaB = criarCamada(geometria)

  const gerente = new GerenteTexturas<Texture>(
    urls,
    opcoes.carregador ?? criarCarregadorTextura(renderer.capabilities.getMaxAnisotropy()),
    descartarTextura,
  )

  let estado: EstadoCamera | null = null
  let quadro = 0
  let pronto: boolean | null = null
  let perdido = false

  function desenhar() {
    quadro = 0
    if (!estado || perdido) return
    const { a, b, mistura } = estado
    const texA = gerente.obter(a.cena)
    const texB = b ? gerente.obter(b.cena) : undefined
    renderer.clear()
    if (texA && mistura < 1) {
      prepararCamada(camadaA, a, texA, 1)
      renderer.render(camadaA.cena, camadaA.camera)
    }
    if (b && texB && mistura > 0) {
      prepararCamada(camadaB, b, texB, mistura)
      renderer.render(camadaB.cena, camadaB.camera)
    }
    const agora = texA !== undefined
    if (agora !== pronto) {
      pronto = agora
      opcoes.aoPronto?.(agora)
    }
  }

  function agendar() {
    if (quadro === 0) quadro = requestAnimationFrame(desenhar)
  }

  const pararAviso = gerente.aoMudar(agendar)

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
      gerente.focar(e.a.cena)
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
    destruir() {
      if (quadro) cancelAnimationFrame(quadro)
      quadro = 0
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
