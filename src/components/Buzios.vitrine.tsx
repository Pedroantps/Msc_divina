import { capas } from '../data/capas'
import { lugaresBuzios } from '../data/buzios'
import { Buzios } from './Buzios'

export default function VitrineBuzios() {
  return <Buzios lugares={lugaresBuzios} capa={capas.buzios} />
}
