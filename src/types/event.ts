export interface IEvent {
  id: string
  name: string
  description?: string | null
  date: string
  location?: string | null
  active?: boolean
  embedded_instagram?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface EventsPaginatedResponse {
  list: IEvent[]
  page: number
  next_page: number | null
  previous_page: number | null
  total_pages: number
  is_last_page: boolean
}
