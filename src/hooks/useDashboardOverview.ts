import { useCallback, useEffect, useState } from 'react'

import type { DashboardPeriod, IDashboardOverview } from '../core/dashboard/model/dashboard'
import axios from 'axios'
import { getDashboardOverview } from '../services/dashboardService'

export function useDashboardOverview(period: DashboardPeriod): {
  overview: IDashboardOverview | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [overview, setOverview] = useState<IDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardOverview(period)
      setOverview(data)
    } catch (err) {
      const details = axios.isAxiosError(err)
        ? {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            method: err.config?.method?.toUpperCase(),
            url: `${err.config?.baseURL ?? ''}${err.config?.url ?? ''}`,
            response: err.response?.data,
          }
        : { message: err instanceof Error ? err.message : String(err) }
      console.error('[Dashboard] Falha ao carregar /dashboard/overview', details, err)
      setError('Não foi possível carregar o painel.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  return { overview, loading, error, refetch: load }
}
