import { api } from './api'
import type { IEvent, EventsPaginatedResponse } from '../types/event'

type ApiResponse<T> = { data?: T }

function unwrap<T>(res: { data?: ApiResponse<T> | T }): T {
  const d = res.data
  if (d == null) return undefined as T
  if (Array.isArray(d)) return d as T
  if (typeof d === 'object' && 'data' in d) return (d as ApiResponse<T>).data as T
  return d as T
}

export async function getEventsActive(): Promise<IEvent[]> {
  const res = await api.get<{ data?: IEvent[] }>('/events')
  const data = unwrap<IEvent[]>(res.data)
  return Array.isArray(data) ? data : []
}

/** Eventos recentes com HTML de embed do Instagram (igual ao web, endpoint público). */
export async function getEventsRecentWithInstagram(limit: number = 10): Promise<IEvent[]> {
  try {
    const res = await api.get<{ data?: IEvent[] }>(`/events/recent-with-instagram?limit=${limit}`)
    const data = unwrap<IEvent[]>(res.data)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function getEventsPaginated(
  page: number = 1,
  size: number = 10
): Promise<EventsPaginatedResponse> {
  const res = await api.get<{ data?: EventsPaginatedResponse }>(
    `/events/paginated?page=${page}&size=${size}`
  )
  const data = unwrap<EventsPaginatedResponse>(res.data)
  return (
    data ?? {
      list: [],
      page: 1,
      next_page: null,
      previous_page: null,
      total_pages: 0,
      is_last_page: true,
    }
  )
}
