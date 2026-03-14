import axios from 'axios'

import { env } from '../config/env'
import { getAuthToken } from '../storage/secureStore'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000, // 30s — evita timeout em APIs que demoram (ex.: cold start no Render)
})

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
