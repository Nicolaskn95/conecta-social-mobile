import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryPie,
  VictoryTheme,
} from 'victory-native'

import type {
  DashboardPeriod,
  IActivityOverviewChart,
  ICriticalStockItem,
  IDistributionChart,
  IRecentDonation,
  IRecentFamily,
  IUpcomingEvent,
} from '../core/dashboard/model/dashboard'
import { useDashboardOverview } from '../hooks/useDashboardOverview'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const CHART_HEIGHT = 220
const FAMILY_BAR_ROW = 36

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
  { value: 'year', label: 'Ano' },
]

const SERIES_COLORS = [colors.primary, colors.secondary, colors.success, colors.danger] as const

/** Cores extras para fatias do gráfico de pizza (além de SERIES_COLORS). */
const PIE_EXTRA = ['#7C3AED', '#EA580C', '#0D9488', '#CA8A04'] as const

function pieColorScale(length: number): string[] {
  const pool = [...SERIES_COLORS, ...PIE_EXTRA]
  return Array.from({ length }, (_, i) => pool[i % pool.length])
}

/** Cores do mockup “Eventos por status” (Aberto / Concluído / Cancelado). */
function eventStatusSliceColor(label: string): string {
  const L = label.toLowerCase()
  if (L.includes('aberto') || L.includes('open')) return '#2C5F73'
  if (L.includes('concluído') || L.includes('completed')) return '#5BA3CF'
  if (L.includes('cancel') || L.includes('canceled') || L.includes('cancelled'))
    return '#8FD4F5'
  return colors.primary
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return iso
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(d)
  } catch {
    return iso
  }
}

function eventStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Aberto',
    COMPLETED: 'Concluído',
    CANCELED: 'Cancelado',
    CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiValue} numberOfLines={3}>
        {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  )
}

const ACTIVITY_BAR_H = 236
const ACTIVITY_GROUP_COLORS = [colors.primary, colors.secondary] as const

/**
 * Cadastros no período — layout do mockup: título + período à direita,
 * legenda centralizada, barras agrupadas por mês com rótulos de valor.
 */
function CadastrosNoPeriodoChart({
  chart,
  period,
  onPeriodChange,
  periodPending,
}: {
  chart: IActivityOverviewChart
  period: DashboardPeriod
  onPeriodChange: (p: DashboardPeriod) => void
  periodPending?: boolean
}) {
  const { width: screenW } = useWindowDimensions()
  const [layoutW, setLayoutW] = useState(0)
  const { labels, datasets } = chart
  const n = labels?.length ?? 0
  const tickValues = useMemo(() => labels.map((_, i) => i), [labels])

  const innerW = layoutW > 0 ? layoutW : Math.max(220, screenW - 72)
  const slotW = Math.max(36, Math.min(48, Math.floor(320 / Math.max(n, 1))))
  const chartPlotW = Math.max(innerW, n * slotW + 48)

  const yMax = useMemo(() => {
    let m = 0
    for (const ds of datasets ?? []) {
      for (const v of ds.data ?? []) {
        if (typeof v === 'number' && v > m) m = v
      }
    }
    return Math.max(3, Math.ceil(m))
  }, [datasets])

  const series = useMemo(() => (datasets ?? []).slice(0, 2), [datasets])
  const barSeries = useMemo(
    () =>
      series.map((ds) =>
        ds.data.map((y, i) => ({
          x: i,
          y: typeof y === 'number' ? y : 0,
        })),
      ),
    [series],
  )

  if (!n || series.length === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <View
      style={styles.cadastrosBlock}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && Math.abs(w - layoutW) > 1) setLayoutW(w)
      }}
    >
      <View style={styles.activityHeaderRow}>
        <View style={styles.activityTitleCol}>
          <Text style={styles.cardEyebrow}>Atividade</Text>
          <Text style={styles.activityMainTitle}>Cadastros no período</Text>
        </View>
        <View style={styles.activityPeriodWrap}>
          {periodPending ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.activityPeriodSpinner} />
          ) : null}
          <View style={styles.activityPeriodRow}>
            {PERIODS.map((p) => {
              const active = period === p.value
              return (
                <Pressable
                  key={p.value}
                  onPress={() => onPeriodChange(p.value)}
                  style={({ pressed }) => [
                    styles.activityPeriodChip,
                    active && styles.activityPeriodChipActive,
                    pressed && styles.periodChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.activityPeriodChipText,
                      active && styles.activityPeriodChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>

      <View style={styles.activityLegendCenter}>
        {series.map((ds, i) => (
          <View key={ds.key} style={styles.activityLegendPill}>
            <View
              style={[
                styles.activityLegendDot,
                { backgroundColor: ACTIVITY_GROUP_COLORS[i % ACTIVITY_GROUP_COLORS.length] },
              ]}
            />
            <Text style={styles.activityLegendLabel} numberOfLines={1}>
              {ds.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.activityChartScroll}>
        <VictoryChart
          width={chartPlotW}
          height={ACTIVITY_BAR_H}
          padding={{ top: 16, bottom: 40, left: 40, right: 14 }}
          domain={{ y: [0, yMax] }}
          domainPadding={{ x: 18 }}
          theme={VictoryTheme.material}
        >
          <VictoryAxis
            dependentAxis
            tickCount={Math.min(yMax + 1, 8)}
            style={{
              axis: { stroke: colors.border_input },
              tickLabels: { fill: colors.mutedText, fontSize: 10 },
              grid: { stroke: colors.border_input, strokeOpacity: 0.45 },
            }}
          />
          <VictoryAxis
            tickValues={tickValues}
            tickFormat={(t: number) => labels[t] ?? ''}
            style={{
              axis: { stroke: colors.border_input },
              tickLabels: {
                fill: colors.mutedText,
                fontSize: 10,
                padding: 4,
              },
              grid: { stroke: 'transparent' },
            }}
          />
          <VictoryGroup offset={10}>
            {barSeries.map((data, idx) => (
              <VictoryBar
                key={series[idx]?.key ?? idx}
                data={data}
                barWidth={11}
                cornerRadius={{ top: 5 }}
                labels={({ datum }) => String(datum.y ?? '')}
                style={{
                  data: {
                    fill: ACTIVITY_GROUP_COLORS[idx % ACTIVITY_GROUP_COLORS.length],
                  },
                  labels: {
                    fill: colors.mutedText,
                    fontSize: 10,
                    fontFamily: fontFamilies.semiBold,
                  },
                }}
              />
            ))}
          </VictoryGroup>
        </VictoryChart>
      </ScrollView>
    </View>
  )
}

function truncateLabel(s: string, max = 14): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function distributionRows(chart: IDistributionChart) {
  const { labels, data } = chart
  if (!labels?.length) return []
  return labels.map((label, i) => ({
    label,
    value: typeof data[i] === 'number' ? data[i] : 0,
  }))
}

/** Doações por categoria — rosca (pizza com furo central). */
function DonationsCategoryPieChart({ chart }: { chart: IDistributionChart }) {
  const { width: screenW } = useWindowDimensions()
  const rows = useMemo(() => distributionRows(chart), [chart])
  const total = useMemo(() => rows.reduce((s, r) => s + r.value, 0), [rows])
  const size = Math.min(260, Math.max(220, screenW - 56))

  const pieData = useMemo(
    () => rows.map((r) => ({ x: r.label, y: r.value })),
    [rows],
  )
  const sliceColors = useMemo(() => pieColorScale(rows.length), [rows.length])

  if (rows.length === 0 || total === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <View style={styles.pieBlock}>
      <View style={styles.pieCenter}>
        <VictoryPie
          width={size}
          height={size}
          padding={28}
          data={pieData}
          innerRadius={size * 0.2}
          radius={size * 0.36}
          labelRadius={size * 0.28}
          colorScale={sliceColors}
          labels={({ datum }) => {
            const y = typeof datum?.y === 'number' ? datum.y : 0
            const pct = total > 0 ? Math.round((y / total) * 100) : 0
            return pct > 0 ? `${pct}%` : ''
          }}
          style={{
            labels: { fill: colors.text, fontSize: 10, fontWeight: '600' },
          }}
        />
      </View>
      <View style={styles.legendColumn}>
        {rows.map((r, i) => (
          <View key={r.label} style={styles.legendLine}>
            <View style={[styles.legendSwatch, { backgroundColor: sliceColors[i] }]} />
            <Text style={styles.legendLineText} numberOfLines={2}>
              {r.label}: {r.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * Eventos por status — meia-rosca (180°) no topo, valores nas fatias,
 * total de eventos ativos no centro (summary.active_events) e legenda em linha.
 */
function EventsStatusSemiDonutChart({
  chart,
  activeEventsTotal,
}: {
  chart: IDistributionChart
  activeEventsTotal: number
}) {
  const { width: screenW } = useWindowDimensions()
  const [layoutW, setLayoutW] = useState(0)
  const rows = useMemo(() => distributionRows(chart), [chart])
  const pieData = useMemo(
    () => rows.map((r) => ({ x: r.label, y: r.value })),
    [rows],
  )
  const sliceColors = useMemo(
    () => rows.map((r) => eventStatusSliceColor(r.label)),
    [rows],
  )

  /** Largura útil: medida no card ou fallback (scroll 40 + card 32 ≈ 72). */
  const fallbackW = Math.max(200, screenW - 72)
  const chartW = layoutW > 0 ? layoutW : fallbackW
  /**
   * Victory centraliza o círculo completo na área útil; a meia-rosca (-90°–90°) ainda usa
   * o mesmo centro — a altura precisa acomodar ~2× o raio, senão o arco corta no topo.
   */
  const piePad = { top: 12, bottom: 12, left: 2, right: 2 }
  const plotInnerW = chartW - piePad.left - piePad.right
  const outerR = Math.max(44, Math.min(plotInnerW / 2 - 8, plotInnerW * 0.44))
  const chartH = Math.round(
    Math.max(200, piePad.top + piePad.bottom + outerR * 2 + 20),
  )
  const innerR = outerR * 0.58
  const labelR = (innerR + outerR) / 2

  if (rows.length === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <View
      style={styles.eventsStatusBlock}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && Math.abs(w - layoutW) > 1) setLayoutW(w)
      }}
    >
      <View style={[styles.eventsSemiChartWrap, { width: '100%', minHeight: chartH }]}>
        <VictoryPie
          width={chartW}
          height={chartH}
          padding={piePad}
          startAngle={-90}
          endAngle={90}
          innerRadius={innerR}
          radius={outerR}
          labelRadius={labelR}
          padAngle={1.5}
          data={pieData}
          colorScale={sliceColors}
          labels={({ datum }) => {
            const y = typeof datum?.y === 'number' ? datum.y : 0
            return y > 0 ? String(y) : ''
          }}
          style={{
            data: {
              stroke: colors.white,
              strokeWidth: 2,
            },
            labels: {
              fill: colors.text,
              fontSize: Math.min(17, Math.max(12, chartW * 0.05)),
              fontWeight: '700',
            },
          }}
        />
        <View
          style={[styles.eventsSemiCenterBlock, { width: chartW, maxWidth: '100%' }]}
          pointerEvents="none"
        >
          <Text style={styles.eventsSemiCenterLabel}>Eventos ativos</Text>
          <Text style={styles.eventsSemiCenterValue}>{activeEventsTotal}</Text>
        </View>
      </View>
      <View style={styles.eventsStatusLegendRow}>
        {rows.map((r, i) => (
          <View key={r.label} style={styles.eventsStatusLegendItem}>
            <View style={[styles.eventsStatusLegendDot, { backgroundColor: sliceColors[i] }]} />
            <Text style={styles.eventsStatusLegendText}>
              {r.label}{' '}
              <Text style={styles.eventsStatusLegendNum}>{r.value}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

type FamilyMode = 'city' | 'neighborhood'

function FamilyDistributionChart({
  chart,
  mode,
}: {
  chart: IDistributionChart
  mode: FamilyMode
}) {
  const { width: screenW } = useWindowDimensions()
  const chartW = Math.max(280, screenW - 48)
  const rows = useMemo(() => {
    const { labels, data } = chart
    if (!labels?.length) return []
    const list = labels.map((label, i) => ({
      label,
      value: typeof data[i] === 'number' ? data[i] : 0,
    }))
    return mode === 'neighborhood' ? list.slice(0, 10) : list
  }, [chart, mode])

  const chartHeight = useMemo(
    () => Math.max(200, rows.length * FAMILY_BAR_ROW + 80),
    [rows.length],
  )

  if (rows.length === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <VictoryChart
      horizontal
      width={chartW}
      height={chartHeight}
      domainPadding={{ x: 16 }}
      padding={{ top: 16, bottom: 36, left: 112, right: 20 }}
      theme={VictoryTheme.material}
    >
      <VictoryAxis
        dependentAxis
        style={{
          axis: { stroke: colors.border_input },
          tickLabels: { fill: colors.mutedText, fontSize: 9 },
          grid: { stroke: colors.border_input, strokeOpacity: 0.25 },
        }}
      />
      <VictoryAxis
        style={{
          axis: { stroke: colors.border_input },
          tickLabels: {
            fill: colors.text,
            fontSize: 10,
            textAnchor: 'end',
            padding: 2,
          },
          grid: { stroke: 'transparent' },
        }}
        tickFormat={(x) => truncateLabel(String(x), 18)}
      />
      <VictoryBar
        horizontal
        data={rows.map((r) => ({ x: r.label, y: r.value }))}
        style={{ data: { fill: colors.primary } }}
      />
    </VictoryChart>
  )
}

function ListSection({
  title,
  emptyText,
  children,
}: {
  title: string
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children == null || (Array.isArray(children) && children.length === 0) ? (
        <Text style={styles.listEmpty}>{emptyText}</Text>
      ) : (
        children
      )}
    </View>
  )
}

function UpcomingEventRow({ e }: { e: IUpcomingEvent }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle} numberOfLines={2}>
        {e.name}
      </Text>
      <Text style={styles.listMeta}>
        {e.city} · {formatDate(e.date)} · {eventStatusLabel(e.status)}
        {e.attendance != null ? ` · ${e.attendance} presenças` : ''}
      </Text>
    </View>
  )
}

function CriticalStockRow({ item }: { item: ICriticalStockItem }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.listMeta}>
        {item.category_name} · {item.quantity} {item.measure_unity}
        {item.available ? '' : ' · indisponível'}
      </Text>
    </View>
  )
}

function RecentDonationRow({ d }: { d: IRecentDonation }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle} numberOfLines={2}>
        {d.name}
      </Text>
      <Text style={styles.listMeta}>
        {d.category_name}
        {d.donator_name ? ` · ${d.donator_name}` : ''} · {formatDate(d.created_at)}
      </Text>
    </View>
  )
}

function RecentFamilyRow({ f }: { f: IRecentFamily }) {
  return (
    <View style={styles.listRow}>
      <Text style={styles.listTitle} numberOfLines={2}>
        {f.name}
      </Text>
      <Text style={styles.listMeta}>
        {f.city} · {formatDate(f.created_at)}
      </Text>
    </View>
  )
}

export function ChartsScreen() {
  const [period, setPeriod] = useState<DashboardPeriod>('year')
  const [familyMode, setFamilyMode] = useState<FamilyMode>('city')
  const { overview, loading, error, refetch } = useDashboardOverview(period)
  const periodMismatch = Boolean(overview && overview.period !== period)
  const periodPending = Boolean(loading && periodMismatch)
  const periodErrorStale = Boolean(!loading && periodMismatch && error)

  const onRetry = useCallback(() => {
    refetch()
  }, [refetch])

  if (loading && !overview) {
    return (
      <View style={styles.centered}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingHint}>Carregando painel…</Text>
      </View>
    )
  }

  if (error && !overview) {
    return (
      <View style={styles.centered}>
        <StatusBar style="auto" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </Pressable>
      </View>
    )
  }

  if (!overview) {
    return null
  }

  const { summary, charts, lists } = overview

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Painel</Text>
      <Text style={styles.subtitle}>Indicadores e listas conforme o período selecionado.</Text>

      {periodPending ? (
        <View style={styles.periodPendingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingHint}>Carregando dados do período…</Text>
        </View>
      ) : null}

      {periodErrorStale ? (
        <View style={styles.staleErrorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {!periodPending && !periodErrorStale && loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.inlineLoadingText}>Atualizando…</Text>
        </View>
      ) : null}

      {!periodPending && !periodErrorStale ? (
        <Text style={styles.updatedAt}>Atualizado em {formatDateTime(overview.generated_at)}</Text>
      ) : null}

      {!periodPending && !periodErrorStale ? (
        <>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <KpiCard label="Famílias ativas" value={summary.active_families} />
          <KpiCard label="Doações disponíveis" value={summary.available_donations} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            label="Eventos"
            value={`${summary.active_events} ativos · ${summary.upcoming_events} próx.`}
          />
          <KpiCard label="Estoque crítico (itens)" value={summary.critical_stock_items} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="Funcionários ativos" value={summary.active_employees} />
          <KpiCard label="Doações ativas" value={summary.active_donations} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={[styles.chartBox, styles.chartBoxCadastros]}>
          <CadastrosNoPeriodoChart
            chart={charts.activity_overview}
            period={period}
            onPeriodChange={setPeriod}
            periodPending={periodPending}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Doações por categoria</Text>
        <Text style={styles.cardHint}>Rosca proporcional por categoria (valores da API).</Text>
        <View style={[styles.chartBox, styles.chartBoxPie]}>
          <DonationsCategoryPieChart chart={charts.donations_by_category} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardEyebrow}>Estatística</Text>
        <Text style={styles.cardTitle}>Eventos por status</Text>
        <Text style={styles.cardHint}>
          Meia-rosca por status (dados do gráfico); total central = eventos ativos.
        </Text>
        <View style={[styles.chartBox, styles.chartBoxEventSemi]}>
          <EventsStatusSemiDonutChart
            chart={charts.events_by_status}
            activeEventsTotal={summary.active_events}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Famílias por local</Text>
        <Text style={styles.cardHint}>Cidade ou bairro (máx. 10 bairros).</Text>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setFamilyMode('city')}
            style={({ pressed }) => [
              styles.toggleChip,
              familyMode === 'city' && styles.toggleChipActive,
              pressed && styles.periodChipPressed,
            ]}
          >
            <Text
              style={[styles.toggleChipText, familyMode === 'city' && styles.toggleChipTextActive]}
            >
              Cidade
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFamilyMode('neighborhood')}
            style={({ pressed }) => [
              styles.toggleChip,
              familyMode === 'neighborhood' && styles.toggleChipActive,
              pressed && styles.periodChipPressed,
            ]}
          >
            <Text
              style={[
                styles.toggleChipText,
                familyMode === 'neighborhood' && styles.toggleChipTextActive,
              ]}
            >
              Bairro
            </Text>
          </Pressable>
        </View>
        <View style={styles.cityChartWrap}>
          <FamilyDistributionChart
            chart={
              familyMode === 'city' ? charts.families_by_city : charts.families_by_neighborhood
            }
            mode={familyMode}
          />
        </View>
      </View>

      <ListSection
        title="Próximos eventos"
        emptyText="Nenhum evento próximo na lista."
      >
        {lists.upcoming_events?.length ? (
          lists.upcoming_events.map((e) => <UpcomingEventRow key={e.id} e={e} />)
        ) : null}
      </ListSection>

      <ListSection title="Estoque crítico" emptyText="Nenhum item em estoque crítico.">
        {lists.critical_stock?.length
          ? lists.critical_stock.map((item) => <CriticalStockRow key={item.id} item={item} />)
          : null}
      </ListSection>

      <ListSection title="Doações recentes" emptyText="Nenhuma doação recente.">
        {lists.recent_donations?.length
          ? lists.recent_donations.map((d) => <RecentDonationRow key={d.id} d={d} />)
          : null}
      </ListSection>

      <ListSection title="Famílias recentes" emptyText="Nenhuma família recente.">
        {lists.recent_families?.length
          ? lists.recent_families.map((f) => <RecentFamilyRow key={f.id} f={f} />)
          : null}
      </ListSection>

      {error && !periodErrorStale ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerErrorText}>{error}</Text>
          <Pressable onPress={onRetry}>
            <Text style={styles.bannerRetry}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingHint: {
    marginTop: 12,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
  },
  errorText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: colors.white,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  periodChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.header_sidebar_color,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodChipPressed: { opacity: 0.88 },
  periodChipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.text,
  },
  periodChipTextActive: {
    color: colors.white,
  },
  periodPendingBox: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  staleErrorBox: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.danger_hover,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inlineLoadingText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
  },
  updatedAt: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 16,
  },
  kpiGrid: { marginBottom: 8 },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  kpiValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  kpiLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  card: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  cardEyebrow: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    color: colors.mutedText,
    letterSpacing: 0.3,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  cardHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 12,
  },
  chartBoxCadastros: {
    minHeight: 0,
  },
  cadastrosBlock: {
    width: '100%',
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  activityTitleCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  activityMainTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    color: colors.text,
    marginTop: 2,
  },
  activityPeriodWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
  activityPeriodSpinner: {
    marginRight: 2,
  },
  activityPeriodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    maxWidth: 200,
  },
  activityPeriodChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: colors.header_sidebar_color,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  activityPeriodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityPeriodChipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    color: colors.text,
  },
  activityPeriodChipTextActive: {
    color: colors.white,
  },
  activityLegendCenter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  activityLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '48%',
  },
  activityLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityLegendLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.text,
    flexShrink: 1,
  },
  activityChartScroll: {
    marginHorizontal: -4,
  },
  emptyChart: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: 24,
  },
  chartBox: {
    minHeight: CHART_HEIGHT,
    width: '100%',
  },
  chartBoxPie: {
    minHeight: 0,
  },
  chartBoxEventSemi: {
    minHeight: 0,
  },
  eventsStatusBlock: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  eventsSemiChartWrap: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  eventsSemiCenterBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsSemiCenterLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 2,
  },
  eventsSemiCenterValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 36,
    color: colors.text,
    lineHeight: 40,
  },
  eventsStatusLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  eventsStatusLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventsStatusLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventsStatusLegendText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.text,
  },
  eventsStatusLegendNum: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.text,
  },
  pieBlock: {
    width: '100%',
  },
  pieCenter: {
    alignItems: 'center',
  },
  legendColumn: {
    marginTop: 12,
    gap: 8,
  },
  legendLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginTop: 3,
  },
  legendLineText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.text,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.mutedText,
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggleChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  toggleChipActive: {
    backgroundColor: colors.header_sidebar_color,
    borderColor: colors.primary,
  },
  toggleChipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.mutedText,
  },
  toggleChipTextActive: {
    color: colors.text,
  },
  cityChartWrap: { width: '100%' },
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_input,
  },
  listTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  listMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  listEmpty: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    paddingVertical: 8,
  },
  bannerError: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.danger_hover,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: 8,
  },
  bannerErrorText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.danger,
    marginBottom: 8,
  },
  bannerRetry: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
})
