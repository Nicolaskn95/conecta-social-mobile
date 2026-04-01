import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import {
  aggregateStockByCategory,
  donationInitialVsCurrent,
  familiesByCitySlices,
  mockChartDonations,
  mockChartFamilies,
  type CategoryStockRow,
  type DonationQtyCompareRow,
  type FamilyCitySlice,
} from '../mocks/chartDashboardMocks'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const CHART_HEIGHT = 200
const LATCH_MS = 2800
const BAR_AREA = CHART_HEIGHT - 52

function useLatchedLines() {
  const [lines, setLines] = useState<string[] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((next: string[] | null) => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setLines(next)
    if (next?.length) {
      timer.current = setTimeout(() => {
        setLines(null)
        timer.current = null
      }, LATCH_MS)
    }
  }, [])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return { lines, show }
}

function SelectionCallout({ lines }: { lines: string[] | null }) {
  if (!lines?.length) return null
  return (
    <View style={calloutStyles.box}>
      {lines.map((line, i) => (
        <Text
          key={`${i}-${line.slice(0, 12)}`}
          style={[calloutStyles.line, i === 0 ? calloutStyles.title : calloutStyles.detail]}
          numberOfLines={3}
        >
          {line}
        </Text>
      ))}
    </View>
  )
}

const calloutStyles = StyleSheet.create({
  box: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.header_sidebar_color,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  line: { fontSize: 13 },
  title: {
    fontFamily: fontFamilies.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  detail: {
    fontFamily: fontFamilies.regular,
    color: colors.mutedText,
  },
})

function LightCategoryChart({ data }: { data: CategoryStockRow[] }) {
  const { lines, show } = useLatchedLines()
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.quantity)), [data])

  if (data.length === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <View>
      <View style={styles.categoryRow}>
        {data.map((d) => {
          const barH = Math.max(8, (d.quantity / max) * BAR_AREA)
          return (
            <Pressable
              key={d.category}
              accessibilityRole="button"
              accessibilityLabel={`${d.category}, ${d.quantity} unidades`}
              onPress={() =>
                show([`Categoria: ${d.category}`, `Estoque atual: ${Math.round(d.quantity)}`])
              }
              style={({ pressed }) => [styles.categoryCol, pressed && styles.pressed]}
            >
              <View style={styles.categoryBarTrack}>
                <View style={[styles.categoryBarFill, { height: barH, backgroundColor: colors.primary }]} />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={2}>
                {d.category}
              </Text>
              <Text style={styles.categoryValue}>{d.quantity}</Text>
            </Pressable>
          )
        })}
      </View>
      <SelectionCallout lines={lines} />
    </View>
  )
}

function LightCompareChart({ data }: { data: DonationQtyCompareRow[] }) {
  const { lines, show } = useLatchedLines()
  const globalMax = useMemo(
    () => Math.max(1, ...data.flatMap((r) => [r.inicial, r.atual])),
    [data],
  )

  if (data.length === 0) {
    return <Text style={styles.emptyChart}>Sem dados para exibir.</Text>
  }

  return (
    <View>
      {data.map((row) => {
        const wInicial = Math.min(100, (row.inicial / globalMax) * 100)
        const wAtual = Math.min(100, (row.atual / globalMax) * 100)
        return (
          <View key={row.item} style={styles.compareItem}>
            <Text style={styles.compareItemTitle} numberOfLines={2}>
              {row.item}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${row.item}, inicial ${row.inicial}`}
              onPress={() =>
                show([
                  `Doação: ${row.item}`,
                  'Quantidade inicial',
                  `${Math.round(row.inicial)}`,
                ])
              }
              style={({ pressed }) => [styles.compareMeterRow, pressed && styles.pressed]}
            >
              <View style={styles.compareMeterLabel}>
                <View style={[styles.compareMeterDot, { backgroundColor: colors.secondary }]} />
                <Text style={styles.compareMeterLabelText}>Inicial</Text>
              </View>
              <View style={styles.compareMeterTrack}>
                <View
                  style={[
                    styles.compareMeterFill,
                    { width: `${wInicial}%`, backgroundColor: colors.secondary },
                  ]}
                />
              </View>
              <Text style={styles.compareMeterValue}>{row.inicial}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${row.item}, atual ${row.atual}`}
              onPress={() =>
                show([
                  `Doação: ${row.item}`,
                  'Quantidade atual',
                  `${Math.round(row.atual)}`,
                ])
              }
              style={({ pressed }) => [styles.compareMeterRow, pressed && styles.pressed]}
            >
              <View style={styles.compareMeterLabel}>
                <View style={[styles.compareMeterDot, { backgroundColor: colors.success }]} />
                <Text style={styles.compareMeterLabelText}>Atual</Text>
              </View>
              <View style={styles.compareMeterTrack}>
                <View
                  style={[
                    styles.compareMeterFill,
                    { width: `${wAtual}%`, backgroundColor: colors.success },
                  ]}
                />
              </View>
              <Text style={styles.compareMeterValue}>{row.atual}</Text>
            </Pressable>
          </View>
        )
      })}
      <SelectionCallout lines={lines} />
    </View>
  )
}

function LightCityChart({ slices }: { slices: FamilyCitySlice[] }) {
  const max = useMemo(() => Math.max(1, ...slices.map((s) => s.value)), [slices])
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <View style={styles.sliceList}>
      {slices.map((s) => {
        const isOn = selected === s.label
        const wPct = (s.value / max) * 100
        return (
          <Pressable
            key={s.label}
            accessibilityRole="button"
            onPress={() => setSelected(isOn ? null : s.label)}
            style={({ pressed }) => [
              styles.cityRow,
              isOn && styles.sliceRowSelected,
              pressed && styles.sliceRowPressed,
            ]}
          >
            <View style={[styles.sliceDot, { backgroundColor: s.color }]} />
            <View style={styles.cityTextCol}>
              <Text style={styles.sliceCity}>{s.label}</Text>
              <View style={styles.hBarTrack}>
                <View style={[styles.hBarFill, { width: `${wPct}%`, backgroundColor: s.color }]} />
              </View>
            </View>
            <Text style={styles.sliceCount}>
              {s.value} {s.value === 1 ? 'família' : 'famílias'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function ChartsScreen() {
  const byCategory = useMemo(
    () => aggregateStockByCategory(mockChartDonations),
    [],
  )
  const citySlices = useMemo(() => familiesByCitySlices(mockChartFamilies), [])
  const compareRows = useMemo(
    () => donationInitialVsCurrent(mockChartDonations),
    [],
  )

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Gráficos</Text>
      <Text style={styles.subtitle}>
        Visão leve (sem motor gráfico pesado) — dados de exemplo alinhados aos tipos do app.
      </Text>
      <Text style={styles.gestureHint}>
        Toque nas barras ou linhas para ver o detalhe; a caixa some sozinha em alguns segundos.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estoque atual por categoria</Text>
        <Text style={styles.cardHint}>
          Soma da quantidade atual por categoria. Toque na coluna para ver o valor.
        </Text>
        <View style={styles.chartBox}>
          <LightCategoryChart data={byCategory} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Famílias por cidade</Text>
        <Text style={styles.cardHint}>Proporção e contagem por cidade (toque para destacar).</Text>
        <View style={styles.cityChartWrap}>
          <LightCityChart slices={citySlices} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inicial × atual por doação</Text>
        <Text style={styles.cardHint}>
          Cada item tem duas faixas horizontais (inicial e atual). O comprimento usa a mesma escala
          em todo o gráfico para comparar doações. Toque na faixa para repetir o valor.
        </Text>
        <View style={styles.compareScroll}>
          <LightCompareChart data={compareRows} />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 36 },
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
    marginBottom: 8,
  },
  gestureHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 20,
    lineHeight: 18,
  },
  card: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_input,
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 6,
  },
  categoryCol: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  categoryBarTrack: {
    width: '100%',
    height: BAR_AREA,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  categoryBarFill: {
    width: '78%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  categoryLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 4,
    minHeight: 28,
  },
  categoryValue: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    color: colors.text,
    marginTop: 2,
  },
  pressed: { opacity: 0.85 },
  compareScroll: { width: '100%' },
  compareItem: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  compareItemTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  compareMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  compareMeterLabel: {
    width: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compareMeterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compareMeterLabelText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  compareMeterTrack: {
    flex: 1,
    height: 14,
    marginHorizontal: 8,
    borderRadius: 5,
    backgroundColor: colors.border_input,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  compareMeterFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 3,
  },
  compareMeterValue: {
    width: 44,
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.text,
    textAlign: 'right',
  },
  cityChartWrap: { width: '100%' },
  sliceList: { gap: 8 },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border_input,
  },
  cityTextCol: { flex: 1, minWidth: 0 },
  sliceRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.header_sidebar_color,
  },
  sliceRowPressed: { opacity: 0.92 },
  sliceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  sliceCity: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
  },
  hBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border_input,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliceCount: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginLeft: 8,
    minWidth: 72,
    textAlign: 'right',
  },
})
