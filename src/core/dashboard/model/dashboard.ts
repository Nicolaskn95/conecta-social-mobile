export type DashboardPeriod = 'month' | 'quarter' | 'semester' | 'year'

export interface IDashboardSummary {
  active_families: number
  active_employees: number
  employees_by_role: {
    ADMIN: number
    MANAGER: number
    VOLUNTEER: number
  }
  active_events: number
  upcoming_events: number
  completed_events: number
  canceled_events: number
  active_donations: number
  available_donations: number
  critical_stock_items: number
}

export interface IChartDataset {
  key: string
  label: string
  data: number[]
}

export interface IActivityOverviewChart {
  labels: string[]
  datasets: IChartDataset[]
}

export interface IDistributionChart {
  labels: string[]
  data: number[]
}

export interface IUpcomingEvent {
  id: string
  name: string
  city: string
  date: string
  status: string
  attendance?: number | null
}

export interface ICriticalStockItem {
  id: string
  name: string
  quantity: number
  available: boolean
  category_name: string
  measure_unity: string
  updated_at: string
}

export interface IRecentDonation {
  id: string
  name: string
  created_at: string
  donator_name?: string | null
  category_name: string
}

export interface IRecentFamily {
  id: string
  name: string
  city: string
  created_at: string
}

export interface IDashboardOverview {
  period: DashboardPeriod
  generated_at: string
  summary: IDashboardSummary
  charts: {
    activity_overview: IActivityOverviewChart
    donations_by_category: IDistributionChart
    events_by_status: IDistributionChart
    families_by_city: IDistributionChart
    families_by_neighborhood: IDistributionChart
  }
  lists: {
    upcoming_events: IUpcomingEvent[]
    critical_stock: ICriticalStockItem[]
    recent_donations: IRecentDonation[]
    recent_families: IRecentFamily[]
  }
}

export interface IDashboardOverviewResponse {
  code: number
  success: boolean
  message: string
  data: IDashboardOverview
}
