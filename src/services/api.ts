import axios, { AxiosHeaders } from 'axios'

import { getDefaultApiBaseUrl } from '../config/env'
import { getApiBaseUrl } from '../config/runtimeApiBaseUrl'
import { getAuthToken } from '../storage/secureStore'

export const api = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 30000, // 30s — evita timeout em APIs que demoram (ex.: cold start no Render)
})

function isFormData(data: unknown): boolean {
  return typeof FormData !== 'undefined' && data instanceof FormData
}

api.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl()
  const token = await getAuthToken()
  const headers = AxiosHeaders.from(config.headers ?? {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  // RN + Axios: FormData precisa do boundary; não enviar Content-Type fixo (multipart/json).
  if (isFormData(config.data)) {
    headers.delete('Content-Type')
    headers.delete('content-type')
  }
  config.headers = headers
  return config
})
