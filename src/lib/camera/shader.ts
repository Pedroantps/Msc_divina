import {
  BackSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three'
import type { Carregador } from './texturas'
import { FOV_LEITURA, FOV_MIN } from './tipos'

/*
 * Material do panorama: desenha a textura equirretangular numa esfera vista por dentro.
 * As coordenadas da textura saem da direção de cada pixel (não da malha), com a convenção do
 * Photo Sphere Viewer: yaw 0 olha o centro da imagem (-Z), yaw positivo gira para a direita.
 * No avanço, um desfoque radial (zoom blur) puxa as amostras para o centro da vista.
 */

const vertice = /* glsl */ `
varying vec3 vDir;
varying vec2 vUv;
void main() {
  vDir = (modelMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmento = /* glsl */ `
uniform sampler2D uTextura;
uniform float uOpacidade;
uniform float uAvanco;
uniform vec3 uFrente;
varying vec3 vDir;
varying vec2 vUv;

const float PI = 3.141592653589793;
const int AMOSTRAS = 12;

vec2 uvDe(vec3 d) {
  float lon = atan(d.x, -d.z);
  float lat = asin(clamp(d.y, -1.0, 1.0));
  return vec2(0.5 + lon / (2.0 * PI), 0.5 + lat / PI);
}

void main() {
  vec3 d = normalize(vDir);
  // Os gradientes vêm do uv da malha, que é contínuo na emenda (a esfera duplica os vértices):
  // assim o mipmap e a anisotropia não falham na costura de 0/1 do atan.
  vec2 gx = dFdx(vUv);
  vec2 gy = dFdy(vUv);
  vec4 cor;
  if (uAvanco <= 0.0) {
    cor = textureGrad(uTextura, uvDe(d), gx, gy);
  } else {
    float forca = 0.14 * uAvanco;
    cor = vec4(0.0);
    for (int i = 0; i < AMOSTRAS; i++) {
      float t = float(i) / float(AMOSTRAS - 1);
      vec3 di = normalize(mix(d, uFrente, forca * t));
      cor += textureGrad(uTextura, uvDe(di), gx, gy);
    }
    cor /= float(AMOSTRAS);
  }
  gl_FragColor = vec4(cor.rgb, uOpacidade);
  #include <colorspace_fragment>
}
`

export function criarMaterialPanorama(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTextura: { value: null },
      uOpacidade: { value: 1 },
      uAvanco: { value: 0 },
      uFrente: { value: new Vector3(0, 0, -1) },
    },
    vertexShader: vertice,
    fragmentShader: fragmento,
    side: BackSide,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  })
}

/** Força do desfoque: 0 em FOV ≥ 85° (leitura), 1 em 55° (fim do avanço). */
export function avancoDoFov(fov: number): number {
  return Math.min(1, Math.max(0, (FOV_LEITURA - fov) / (FOV_LEITURA - FOV_MIN)))
}

/**
 * Carregador real: `fetch` + `createImageBitmap` (decodifica fora da thread principal).
 * A imagem já chega invertida (`flipY`), porque o WebGL ignora `flipY` em ImageBitmap.
 */
export function criarCarregadorTextura(anisotropia: number): Carregador<Texture> {
  return async (url, sinal) => {
    const resposta = await fetch(url, { signal: sinal })
    if (!resposta.ok) throw new Error(`Panorama ${url}: HTTP ${resposta.status}`)
    const blob = await resposta.blob()
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY' })
    if (sinal.aborted) {
      bitmap.close()
      throw new DOMException('Abortado', 'AbortError')
    }
    const textura = new Texture(bitmap)
    textura.flipY = false
    textura.colorSpace = SRGBColorSpace
    textura.wrapS = RepeatWrapping
    textura.generateMipmaps = true
    textura.minFilter = LinearMipmapLinearFilter
    textura.magFilter = LinearFilter
    textura.anisotropy = anisotropia
    textura.needsUpdate = true
    return textura
  }
}

/** Solta a textura da GPU e o bitmap, se ainda existir (depois do upload o motor já o fechou). */
export function descartarTextura(textura: Texture): void {
  const imagem = textura.image as ImageBitmap | null | undefined
  textura.dispose()
  if (imagem && typeof imagem.close === 'function') imagem.close()
}
