/** Base da API (ex.: `http://HOST:3001/api`) — alinhado ao Swagger em `/api/docs`. */
export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api',
} as const
