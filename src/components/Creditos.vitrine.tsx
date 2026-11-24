import { areasDoNavio } from '../data/areas'
import { lugaresBuzios } from '../data/buzios'
import { Creditos } from './Creditos'

export default function VitrineCreditos() {
  return <Creditos creditos={[...lugaresBuzios, ...areasDoNavio].map((a) => a.credito)} />
}
