import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { SelecaoFavoritos } from './SelecaoFavoritos'

export default function VitrineSelecaoFavoritos() {
  return <SelecaoFavoritos areas={[...areasDoNavio, ...lugaresBuzios]} />
}
