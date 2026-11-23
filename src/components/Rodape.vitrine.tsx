import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { capas } from '../data/capas'
import { Rodape } from './Rodape'

export default function VitrineRodape() {
  return (
    <Rodape
      areas={[...areasDoNavio, ...lugaresBuzios]}
      creditosExtras={[capas.navio.credito, capas.buzios.credito]}
    />
  )
}
