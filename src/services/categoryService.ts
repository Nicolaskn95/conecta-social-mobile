import { api } from './api'
import type { ICategory } from '../types/donation'

type ApiResponse<T> = { data?: T }

function unwrap<T>(res: { data?: ApiResponse<T> | T }): T {
  const d = res.data
  if (d == null) return undefined as T
  if (Array.isArray(d)) return d as T
  if (typeof d === 'object' && 'data' in d) return (d as ApiResponse<T>).data as T
  return d as T
}

export async function getCategories(): Promise<ICategory[]> {
  const res = await api.get<{ data?: ICategory[] }>('/categories')
  const data = unwrap<ICategory[]>(res.data)
  return Array.isArray(data) ? data : []
}
