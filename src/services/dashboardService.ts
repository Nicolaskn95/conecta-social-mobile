import type { DashboardPeriod, IDashboardOverview, IDashboardOverviewResponse } from '../core/dashboard/model/dashboard'

import { api } from './api'

export async function getDashboardOverview(period: DashboardPeriod): Promise<IDashboardOverview> {
  const res = await api.get<IDashboardOverviewResponse>('/dashboard/overview', {
    params: { period },
  })
  const body = res.data
  if (body == null || typeof body !== 'object' || body.data == null) {
    throw new Error('Resposta do dashboard inválida.')
  }
  return body.data
}
