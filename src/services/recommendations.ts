import { workflow } from './donationWorkflow'

export type Suggestion = {
  id_family: string
  family_name: string
  id_beneficiary: string | null
  beneficiary_name: string | null
  id_need: string
  need_label: string
  classification: 'COMPATIBLE' | 'REVIEW'
  type_name: string
  reason: 'MEASUREMENT_MATCH' | 'TYPE_MATCH'
  attribute: 'seat_width_cm' | 'shoe_size_br' | null
  offered: number | null
  checks: string[]
  remaining_quantity: number | null
  max_separable_quantity: number | null
}

type Recommendations = {
  status: 'OK' | 'NO_STOCK' | 'TYPE_UNRESOLVED' | 'NO_MATCHES'
  unit: string | null
  suggestions: Suggestion[]
}

export function getRecommendations(donationId: string) {
  return workflow<Recommendations>('/donations/' + donationId + '/recommendations')
}

export const emptyRecommendations = {
  OK: '',
  NO_STOCK: 'Esta doação está sem estoque disponível.',
  TYPE_UNRESOLVED: 'O tipo do item pode ser preenchido nos detalhes da doação.',
  NO_MATCHES: 'Nenhum pedido em aberto combina com este item neste momento.',
}

export function suggestionDetails(item: Suggestion) {
  const attribute = item.attribute === 'seat_width_cm' ? 'largura do assento' : 'numeração'
  const reason =
    item.reason === 'MEASUREMENT_MATCH'
      ? `Coincidência de ${attribute}: ${item.offered}${item.attribute === 'seat_width_cm' ? ' cm' : ''}.`
      : `Tipo de item: ${item.type_name}.`
  const checks: Record<string, string> = {
    DONATION_TYPE_INFERRED: 'Confira o tipo sugerido pelo nome da doação.',
    NEED_TYPE_INFERRED: 'Confira o tipo sugerido pela descrição do pedido.',
    DONATION_MEASUREMENT_MISSING: `Confira a ${attribute} da doação.`,
    NEED_MEASUREMENT_MISSING: `Confira a ${attribute} do pedido.`,
    QUANTITY_UNKNOWN: 'Quantidade do pedido a confirmar.',
    GENERIC_ITEM_CONFIRMATION: 'Confira se o produto atende ao pedido.',
  }
  return [reason, ...item.checks.map((code) => checks[code]).filter(Boolean)]
}
