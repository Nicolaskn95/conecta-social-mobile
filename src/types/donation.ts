import type { ItemDetails } from '../services/donationWorkflow'

export interface ICategory {
  id: string
  name: string
  measure_unity: string
  active: boolean
  created_at?: string
}

export interface IDonation extends ItemDetails {
  id: string
  category_id: string
  category?: ICategory
  name: string
  description?: string | null
  initial_quantity: number
  current_quantity: number
  donator_name?: string | null
  gender?: string | null
  size?: string | null
  active?: boolean
  available?: boolean
  /** URL assinada (S3); presente quando a API retorna a doação */
  image_url?: string | null
  /** Ex.: `image/svg+xml` — o app usa para escolher `SvgUri` vs `Image` */
  image_content_type?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/** Campos aceitos no PUT `/donations/:id` (JSON ou multipart, alinhado ao Swagger/curl). */
export interface DonationUpdatePayload extends ItemDetails {
  category_id?: string
  name?: string
  description?: string
  donator_name?: string
  gender?: string
  size?: string
  active?: boolean
}

export interface DonationCreatePayload extends ItemDetails {
  category_id: string
  name: string
  initial_quantity: number
  description?: string
  donator_name?: string
  gender?: string
  size?: string
}

export type DonationStockAdjustmentReason =
  | 'SPOILAGE'
  | 'LOSS'
  | 'DAMAGE'
  | 'EXPIRATION'
  | 'INVENTORY_CORRECTION'
  | 'OTHER'

export interface DonationStockAdjustmentPayload {
  delta_quantity: number
  reason: DonationStockAdjustmentReason
  note?: string
}
