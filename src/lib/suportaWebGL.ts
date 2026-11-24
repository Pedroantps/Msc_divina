export interface SondagemWebGL {
  webgl: boolean
  maxTextura: number
}

/**
 * Sonda o WebGL com um único canvas: lê o que precisa e solta o contexto na hora, para não gastar
 * um dos poucos contextos que o navegador permite por página (o palco e o tour 360° precisam deles).
 */
export function sondarWebGL(): SondagemWebGL {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return { webgl: false, maxTextura: 0 }
    const maxTextura = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { webgl: true, maxTextura }
  } catch {
    return { webgl: false, maxTextura: 0 }
  }
}

export function suportaWebGL(): boolean {
  return sondarWebGL().webgl
}
