import { api } from './api'
import type { IDonation } from '../types/donation'

export type Mode = 'PICKUP' | 'DELIVERY'
export type Recipient = { id_beneficiary?: string; id_need?: string; delivery_mode?: Mode }
export type ItemDetails = {
  item_type_id?: string | null
  condition?: 'NEW' | 'USED_GOOD' | 'REQUIRES_REVIEW' | null
  specifications?: { shoe_size_br?: number; seat_width_cm?: number } | null
}
export type ItemType = { id: string; code: string; name: string }
export type Need = { id: string; description: string | null; id_beneficiary: string | null; requested_quantity: number | null; item_type_id?: string | null; separated_quantity?: number }
export interface Allocation {
  id: string
  status: 'WAITING_RECEIPT' | 'COMPLETED' | 'CANCELED' | 'UNKNOWN'
  id_need?: string | null
  donation?: IDonation
  family?: { name: string; active?: boolean }
  beneficiary?: { name: string; surname: string; active?: boolean }
  delivery_mode?: Mode | null
  quantity: number
  separated_at?: string | null
  received_at?: string | null
  confirmed_at?: string | null
}
export interface Page<T> { list: T[]; total_pages: number }
export async function workflow<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  return (await api.request<{ data: T }>({ url: path, method, data })).data.data
}
export function allocationLabel(row: Allocation) {
  if (row.status === 'COMPLETED') return 'Concluída'
  if (row.status === 'CANCELED') return 'Cancelada'
  if (row.status !== 'WAITING_RECEIPT') return 'Recebimento a conferir'
  return row.delivery_mode === 'PICKUP' ? 'Aguardando retirada' : row.delivery_mode === 'DELIVERY'
    ? 'Aguardando entrega' : 'Aguardando retirada ou entrega'
}
