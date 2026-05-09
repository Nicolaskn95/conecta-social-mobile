import * as ImageManipulator from 'expo-image-manipulator'
import type { Action } from 'expo-image-manipulator'

import { env } from '../config/env'
import { api } from './api'
import { getApiErrorMessage } from './apiError'
import { getAuthToken } from '../storage/secureStore'
import type { DonationUpdatePayload, IDonation } from '../types/donation'

/** Maior lado da imagem após redimensionar (px); reduz peso antes do JPEG. */
const UPLOAD_IMAGE_MAX_EDGE = 1920
/** Qualidade JPEG 0–1 após resize. */
const UPLOAD_JPEG_QUALITY = 0.72

function nestMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const raw = (body as { message?: unknown }).message
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) return raw.join('\n')
  return undefined
}

async function putDonationMultipart(
  id: string,
  form: FormData
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; body: unknown }> {
  const token = await getAuthToken()
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}/donations/${id}`
  const controller = new AbortController()
  const timeoutMs = 120_000
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal,
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = { raw: text }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, body: parsed }
    }
    return { ok: true, data: parsed }
  } finally {
    clearTimeout(t)
  }
}

function dbg(...args: unknown[]) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[updateDonation]', ...args)
  }
}

export type DonationImagePick = {
  uri: string
  name?: string
  mimeType?: string
  /** Do picker; usado para não ampliar fotos e limitar o maior lado */
  width?: number
  height?: number
}

type ApiResponse<T> = { data?: T; list?: T }

function unwrap<T>(res: { data?: ApiResponse<T> | T }): T {
  const d = res.data
  if (d == null) return undefined as T
  if (Array.isArray(d)) return d as T
  if (typeof d === 'object' && 'data' in d) return (d as ApiResponse<T>).data as T
  if (typeof d === 'object' && 'list' in d) return (d as ApiResponse<T>).list as T
  return d as T
}

function resizeActionsForMaxEdge(width?: number, height?: number): Action[] {
  const w = width
  const h = height
  if (w != null && h != null && w > 0 && h > 0) {
    if (w >= h) {
      return w > UPLOAD_IMAGE_MAX_EDGE ? [{ resize: { width: UPLOAD_IMAGE_MAX_EDGE } }] : []
    }
    return h > UPLOAD_IMAGE_MAX_EDGE ? [{ resize: { height: UPLOAD_IMAGE_MAX_EDGE } }] : []
  }
  return [{ resize: { width: UPLOAD_IMAGE_MAX_EDGE } }]
}

/**
 * Redimensiona (maior lado ≤ limite) e comprime para JPEG antes do multipart.
 */
export async function compressDonationImageForUpload(
  pick: DonationImagePick
): Promise<DonationImagePick> {
  try {
    const actions = resizeActionsForMaxEdge(pick.width, pick.height)
    const result = await ImageManipulator.manipulateAsync(pick.uri, actions, {
      compress: UPLOAD_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    const baseName = pick.name?.replace(/\.[^.]+$/i, '')?.trim()
    const name = baseName ? `${baseName}.jpg` : 'donation.jpg'
    return { uri: result.uri, name, mimeType: 'image/jpeg' }
  } catch {
    return pick
  }
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

/**
 * Multipart com imagem: campos como no Swagger/curl; opcionais vazios como string vazia.
 */
function appendMultipartDonationFields(form: FormData, payload: DonationUpdatePayload) {
  const str = (v: string | null | undefined) => (v == null || v === '' ? '' : String(v))
  const numStr = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? '' : String(v))

  form.append('size', str(payload.size))
  form.append('gender', str(payload.gender))
  form.append('active', payload.active === false ? 'false' : 'true')
  form.append('initial_quantity', numStr(payload.initial_quantity))
  form.append('available', payload.available === false ? 'false' : 'true')
  form.append('name', str(payload.name))
  form.append('current_quantity', numStr(payload.current_quantity))
  form.append('donator_name', str(payload.donator_name))
  form.append('description', str(payload.description))
  form.append('category_id', str(payload.category_id))
}

export async function updateDonation(
  id: string,
  payload: DonationUpdatePayload,
  image?: DonationImagePick | null
): Promise<{ donation: IDonation | null; errorMessage?: string }> {
  try {
    dbg('início', { id, comImagem: Boolean(image?.uri) })
    if (image?.uri) {
      const prepared = await compressDonationImageForUpload(image)
      const form = new FormData()
      appendMultipartDonationFields(form, payload)
      const name = prepared.name?.trim() ? prepared.name : 'donation.jpg'
      const type = prepared.mimeType?.startsWith('image/') ? prepared.mimeType : 'image/jpeg'
      form.append(
        'image',
        { uri: prepared.uri, name, type } as unknown as Blob
      )
      dbg('multipart: PUT', { path: `/donations/${id}`, name, type })

      const multipartRes = await putDonationMultipart(id, form)
      if (!multipartRes.ok) {
        const msg =
          nestMessageFromBody(multipartRes.body) ??
          `Não foi possível atualizar a doação (HTTP ${multipartRes.status}).`
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(
            '[updateDonation] PUT multipart falhou',
            multipartRes.status,
            multipartRes.body
          )
        }
        return { donation: null, errorMessage: msg }
      }

      const data = unwrap<IDonation>({
        data: multipartRes.data as ApiResponse<IDonation> | IDonation,
      })
      if (!data) {
        return {
          donation: null,
          errorMessage: 'Resposta da API sem dados da doação.',
        }
      }
      return { donation: data }
    }

    const res = await api.put<{ data?: IDonation }>(`/donations/${id}`, payload)

    const data = unwrap<IDonation>(res.data)
    if (!data) {
      return {
        donation: null,
        errorMessage: 'Resposta da API sem dados da doação.',
      }
    }
    return { donation: data }
  } catch (err) {
    return {
      donation: null,
      errorMessage: getApiErrorMessage(err, 'Não foi possível atualizar a doação.'),
    }
  }
}

export async function allocateDonationToFamily(
  donationId: string,
  payload: { family_id: string; quantity: number }
): Promise<{ donation: IDonation | null; errorMessage?: string }> {
  try {
    const res = await api.post<{ data?: IDonation }>(`/donations/${donationId}/allocate`, payload)
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
