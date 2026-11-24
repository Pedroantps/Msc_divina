import { useEffect, useRef, useState } from 'react'
import { areasDoNavio } from '../data/areas'
import type { ControlePalco } from '../lib/camera/tipos'
import { PalcoPanorama } from './PalcoPanorama'

// Três áreas seguidas: Recepção, Teatro Pantheon e Galeria e Lojas (La Boutique).
const areas = areasDoNavio.slice(0, 3)
const panoramas = areas.map((a) => a.panorama!)
const posteres = areas.map((a) => a.imagem)

interface Controle {
  chave: 'yaw' | 'pitch' | 'fov' | 'mistura' | 'cena'
  rotulo: string
  min: number
  max: number
  passo: number
}

const controles: Controle[] = [
  { chave: 'yaw', rotulo: 'Yaw', min: -180, max: 180, passo: 1 },
  { chave: 'pitch', rotulo: 'Pitch', min: -60, max: 60, passo: 1 },
  { chave: 'fov', rotulo: 'FOV', min: 55, max: 110, passo: 1 },
  { chave: 'mistura', rotulo: 'Mistura', min: 0, max: 1, passo: 0.01 },
  { chave: 'cena', rotulo: 'Cena', min: 0, max: areas.length - 1, passo: 1 },
]

export default function VitrinePalcoPanorama() {
  const palco = useRef<ControlePalco>(null)
  const [valores, setValores] = useState({ yaw: 0, pitch: 0, fov: 95, mistura: 0, cena: 0 })
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    const { yaw, pitch, fov, mistura, cena } = valores
    const proxima = cena + 1 < areas.length ? cena + 1 : null
    palco.current?.definirEstado({
      a: { cena, yaw, pitch, fov },
      // A próxima cena chega com FOV aberto (110° → 95°), olhando para a mesma direção.
      b: proxima === null ? null : { cena: proxima, yaw, pitch, fov: 110 - 15 * mistura },
      mistura: proxima === null ? 0 : mistura,
    })
  }, [valores])

  return (
    <main data-tema="escuro" style={{ position: 'relative', height: '100svh' }}>
      <PalcoPanorama
        ref={palco}
        panoramas={panoramas}
        posteres={posteres}
        dpr={Math.min(window.devicePixelRatio, 2)}
        aoFalhar={() => setFalhou(true)}
      />
      <form
        onSubmit={(e) => e.preventDefault()}
        style={{
          position: 'absolute', left: 16, bottom: 16, padding: '12px 16px', display: 'grid', gap: 6,
          background: 'rgba(0,0,0,.6)', color: '#fff', borderRadius: 8, font: '14px system-ui',
        }}
      >
        {falhou && <strong>WebGL falhou: palco de fotos</strong>}
        <span>{areas[valores.cena].nome}</span>
        {controles.map((c) => (
          <label key={c.chave} style={{ display: 'grid', gridTemplateColumns: '64px 200px 48px', gap: 8, alignItems: 'center' }}>
            {c.rotulo}
            <input
              type="range"
              name={c.chave}
              min={c.min}
              max={c.max}
              step={c.passo}
              value={valores[c.chave]}
              onChange={(e) => setValores((v) => ({ ...v, [c.chave]: Number(e.target.value) }))}
            />
            <output>{valores[c.chave]}</output>
          </label>
        ))}
      </form>
    </main>
  )
}
