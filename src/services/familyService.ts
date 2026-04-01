import { api } from './api'
import type { IFamily } from '../types/family'

type ApiResponse<T> = { data?: T; list?: T }

function unwrap<T>(res: { data?: ApiResponse<T> | T }): T {
  const d = res.data
  if (d == null) return undefined as T
  if (Array.isArray(d)) return d as T
  if (typeof d === 'object' && 'data' in d) return (d as ApiResponse<T>).data as T
  if (typeof d === 'object' && 'list' in d) return (d as ApiResponse<T>).list as T
  return d as T
}

export async function getActiveFamilies(): Promise<IFamily[]> {
  const res = await api.get<{ data?: IFamily[] }>('/families')
  const data = unwrap<IFamily[]>(res.data)
  return Array.isArray(data) ? data : []
}
