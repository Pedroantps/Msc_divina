import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Viewer } from '@photo-sphere-viewer/core'
import { suportaWebGL } from '../lib/suportaWebGL'
import { areasDoNavio } from '../data/areas'
import { TourArea } from './TourArea'

vi.mock('../lib/suportaWebGL', () => ({ suportaWebGL: vi.fn(() => true) }))
vi.mock('@photo-sphere-viewer/core', () => ({ Viewer: vi.fn() }))
vi.mock('@photo-sphere-viewer/core/index.css', () => ({}))
vi.mock('@photo-sphere-viewer/gyroscope-plugin', () => ({ GyroscopePlugin: class GyroscopePlugin {} }))

const ViewerMock = vi.mocked(Viewer) as unknown as ReturnType<typeof vi.fn>
const destroy = vi.fn()
const setPanorama = vi.fn(() => Promise.resolve(true))

const spa = areasDoNavio.find((a) => a.id === 'aurea-spa')!
const recepcao = areasDoNavio.find((a) => a.id === 'recepcao')!
const cenas = spa.cenas!

beforeEach(() => {
  destroy.mockClear()
  setPanorama.mockClear()
  ViewerMock.mockReset()
  ViewerMock.mockImplementation(function (config: { container: HTMLElement }) {
    config.container.appendChild(document.createElement('canvas'))
    return { destroy, setPanorama, addEventListener: () => {} }
  })
  vi.mocked(suportaWebGL).mockReturnValue(true)
  // jsdom não implementa showModal/close.
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
})

afterEach(() => {
  document.body.removeAttribute('style')
})

function Casa({ area = spa, inicial = false, cenaInicial }: { area?: typeof spa; inicial?: boolean; cenaInicial?: string }) {
  const [aberto, setAberto] = useState(inicial)
  const botao = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={botao} onClick={() => setAberto(true)}>
        Abrir
      </button>
      <TourArea area={area} aberto={aberto} aoFechar={() => setAberto(false)} cenaInicial={cenaInicial} retornoFoco={botao} />
    </>
  )
}

const abrir = async (props: Parameters<typeof Casa>[0] = {}) => {
  const usuario = userEvent.setup()
  render(<Casa {...props} />)
  await usuario.click(screen.getByRole('button', { name: 'Abrir' }))
  await waitFor(() => expect(ViewerMock).toHaveBeenCalled())
  return usuario
}

describe('TourArea', () => {
  it('fechado, não monta o viewer nem as miniaturas', () => {
    render(<Casa />)
    expect(ViewerMock).not.toHaveBeenCalled()
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled()
    expect(document.querySelector('img')).toBeNull()
  })

  it('abre como modal e cria o viewer na primeira cena, no yaw dela', async () => {
    await abrir()
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1)
    expect(ViewerMock).toHaveBeenCalledTimes(1)
    expect(ViewerMock).toHaveBeenCalledWith(
      expect.objectContaining({ panorama: cenas[0].panorama, defaultYaw: `${cenas[0].yaw}deg`, mousewheel: true }),
    )
    expect(screen.getByRole('dialog', { name: /Aurea Spa/ })).toBeInTheDocument()
  })

  it('mostra nome da área, nome da cena e deck', async () => {
    await abrir()
    const topo = screen.getByRole('banner')
    expect(within(topo).getByText('Aurea Spa')).toBeInTheDocument()
    expect(within(topo).getByRole('heading', { name: cenas[0].nome })).toBeInTheDocument()
    expect(within(topo).getByText(`Deck ${cenas[0].deck}`)).toBeInTheDocument()
  })

  it('não repete o nome quando a área tem uma cena só', async () => {
    await abrir({ area: recepcao })
    expect(screen.getAllByText('Recepção')).toHaveLength(1)
    expect(screen.queryByRole('list', { name: /Ambientes/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Próxima cena' })).not.toBeInTheDocument()
  })

  it('lista as miniaturas das cenas e marca a ativa', async () => {
    await abrir()
    const lista = screen.getByRole('list', { name: /Ambientes/ })
    const botoes = within(lista).getAllByRole('button')
    expect(botoes).toHaveLength(cenas.length)
    cenas.forEach((c, i) => {
      expect(botoes[i]).toHaveAccessibleName(c.nome)
      expect(botoes[i].querySelector('img')).toHaveAttribute('src', `/miniatura/${c.id}.webp`)
    })
    expect(botoes[0]).toHaveAttribute('aria-current', 'true')
    expect(botoes[1]).not.toHaveAttribute('aria-current')
  })

  it('clicar numa miniatura troca o panorama sem recriar o viewer', async () => {
    const usuario = await abrir()
    await usuario.click(screen.getByRole('button', { name: cenas[2].nome }))
    await waitFor(() =>
      expect(setPanorama).toHaveBeenCalledWith(
        cenas[2].panorama,
        expect.objectContaining({ position: { yaw: `${cenas[2].yaw}deg`, pitch: 0 } }),
      ),
    )
    expect(ViewerMock).toHaveBeenCalledTimes(1)
    expect(destroy).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: cenas[2].nome })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('heading', { name: cenas[2].nome })).toBeInTheDocument()
  })

  it('a tecla → vai para a próxima cena e ← volta (com volta ao redor)', async () => {
    const usuario = await abrir()
    await usuario.keyboard('{ArrowRight}')
    await waitFor(() =>
      expect(setPanorama).toHaveBeenLastCalledWith(
        cenas[1].panorama,
        expect.objectContaining({ position: { yaw: `${cenas[1].yaw}deg`, pitch: 0 } }),
      ),
    )
    await usuario.keyboard('{ArrowLeft}{ArrowLeft}')
    await waitFor(() => expect(setPanorama).toHaveBeenLastCalledWith(cenas[cenas.length - 1].panorama, expect.anything()))
    expect(ViewerMock).toHaveBeenCalledTimes(1)
  })

  it('os botões anterior e próxima trocam de cena', async () => {
    const usuario = await abrir()
    await usuario.click(screen.getByRole('button', { name: 'Próxima cena' }))
    await waitFor(() => expect(setPanorama).toHaveBeenLastCalledWith(cenas[1].panorama, expect.anything()))
    await usuario.click(screen.getByRole('button', { name: 'Cena anterior' }))
    await waitFor(() => expect(setPanorama).toHaveBeenLastCalledWith(cenas[0].panorama, expect.anything()))
    expect(ViewerMock).toHaveBeenCalledTimes(1)
  })

  it('abre na cena pedida em cenaInicial', async () => {
    await abrir({ cenaInicial: cenas[3].id })
    expect(ViewerMock).toHaveBeenCalledWith(
      expect.objectContaining({ panorama: cenas[3].panorama, defaultYaw: `${cenas[3].yaw}deg` }),
    )
    expect(screen.getByRole('button', { name: cenas[3].nome })).toHaveAttribute('aria-current', 'true')
  })

  it('tem o link do tour oficial da MSC, externo', async () => {
    await abrir()
    const link = screen.getByRole('link', { name: 'Tour oficial da MSC' })
    expect(link).toHaveAttribute('href', 'https://virtual-tours.msccruises.com/MSC-Divina/en-gb/index.html')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('o botão Fechar chama aoFechar, destrói o viewer e devolve o foco ao botão que abriu', async () => {
    const usuario = await abrir()
    await usuario.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })

  it('Esc fecha e devolve o foco', async () => {
    const usuario = await abrir()
    await usuario.keyboard('{Escape}')
    expect(destroy).toHaveBeenCalled()
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })

  it('o evento cancel do diálogo (Esc nativo, botão voltar) também fecha', async () => {
    await abrir()
    const evento = new Event('cancel', { cancelable: true })
    act(() => {
      screen.getByRole('dialog').dispatchEvent(evento)
    })
    expect(evento.defaultPrevented).toBe(true)
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled()
  })

  it('bloqueia a rolagem do fundo enquanto aberto e libera ao fechar', async () => {
    const usuario = await abrir()
    expect(document.body.style.overflow).toBe('hidden')
    await usuario.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(document.body.style.overflow).toBe('')
  })

  it('libera a rolagem se for desmontado aberto', () => {
    const { unmount } = render(<Casa inicial />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('reabre do zero: viewer novo e primeira cena', async () => {
    const usuario = await abrir()
    await usuario.keyboard('{ArrowRight}')
    await usuario.click(screen.getByRole('button', { name: 'Fechar' }))
    await usuario.click(screen.getByRole('button', { name: 'Abrir' }))
    await waitFor(() => expect(ViewerMock).toHaveBeenCalledTimes(2))
    expect(ViewerMock).toHaveBeenLastCalledWith(expect.objectContaining({ panorama: cenas[0].panorama }))
  })

  it('sem WebGL mostra a foto plana da área com um aviso', async () => {
    vi.mocked(suportaWebGL).mockReturnValue(false)
    const usuario = userEvent.setup()
    render(<Casa />)
    await usuario.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(ViewerMock).not.toHaveBeenCalled()
    expect(await screen.findByRole('status')).toHaveTextContent(/360°/)
    expect(screen.getByRole('img', { name: cenas[0].nome })).toHaveAttribute('src', spa.imagem)
  })

  it('sem WebGL, nas cenas seguintes mostra a miniatura ampliada', async () => {
    vi.mocked(suportaWebGL).mockReturnValue(false)
    const usuario = userEvent.setup()
    render(<Casa />)
    await usuario.click(screen.getByRole('button', { name: 'Abrir' }))
    await usuario.click(screen.getByRole('button', { name: cenas[1].nome }))
    expect(screen.getByRole('img', { name: cenas[1].nome })).toHaveAttribute('src', `/miniatura/${cenas[1].id}.webp`)
  })
})
