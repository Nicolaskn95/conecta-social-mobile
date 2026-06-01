/** Base da API (ex.: `http://HOST:3001/api`) — alinhado ao Swagger em `/api/docs`. */
export function getDefaultApiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api').trim()
}

export const env = {
  apiBaseUrl: getDefaultApiBaseUrl(),
} as const
