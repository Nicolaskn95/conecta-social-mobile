import { useCallback, useEffect, useState } from 'react'

import type { DashboardPeriod, IDashboardOverview } from '../core/dashboard/model/dashboard'
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
    } catch {
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
