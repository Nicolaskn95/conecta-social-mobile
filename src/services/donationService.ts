import { api } from './api'
import type { IDonation, DonationUpdatePayload } from '../types/donation'

type ApiResponse<T> = { data?: T; list?: T }

function unwrap<T>(res: { data?: ApiResponse<T> | T }): T {
  const d = res.data
  if (d == null) return undefined as T
  if (Array.isArray(d)) return d as T
  if (typeof d === 'object' && 'data' in d) return (d as ApiResponse<T>).data as T
  if (typeof d === 'object' && 'list' in d) return (d as ApiResponse<T>).list as T
  return d as T
}

export async function getDonations(): Promise<IDonation[]> {
  const res = await api.get<{ data?: IDonation[] }>('/donations')
  const data = unwrap<IDonation[]>(res.data)
  return Array.isArray(data) ? data : []
}

export async function getDonationById(id: string): Promise<IDonation | null> {
  try {
    const res = await api.get<{ data?: IDonation }>(`/donations/${id}`)
    const data = unwrap<IDonation>(res.data)
    return data ?? null
  } catch {
    return null
  }
}

export async function updateDonation(
  id: string,
  payload: DonationUpdatePayload
): Promise<IDonation | null> {
  try {
    const res = await api.put<{ data?: IDonation }>(`/donations/${id}`, payload)
    const data = unwrap<IDonation>(res.data)
    return data ?? null
  } catch {
    return null
  }
}

export async function allocateDonationToFamily(
  donationId: string,
  payload: { family_id: string; quantity: number }
): Promise<{ donation: IDonation | null; errorMessage?: string }> {
  try {
    const res = await api.post<{ data?: IDonation }>(
      `/donations/${donationId}/allocate`,
      payload
    )
    const data = unwrap<IDonation>(res.data)
    return { donation: data ?? null }
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
    return {
      donation: null,
      errorMessage: typeof msg === 'string' ? msg : 'Não foi possível destinar.',
    }
  }
}
