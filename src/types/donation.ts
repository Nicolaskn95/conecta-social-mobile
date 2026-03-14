export interface ICategory {
  id: string
  name: string
  measure_unity: string
  active: boolean
  created_at?: string
}

export interface IDonation {
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
  created_at?: string | null
  updated_at?: string | null
}

export interface DonationUpdatePayload {
  current_quantity?: number
  available?: boolean
  name?: string
  description?: string
  gender?: string
  size?: string
}
