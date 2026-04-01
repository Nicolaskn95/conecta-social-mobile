import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { OperationLogEntry } from '../storage/operationLogStorage'
import { getLogs } from '../storage/operationLogStorage'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Filter = 'all' | 'triagem' | 'movimentacao'

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function typeLabel(type: OperationLogEntry['type']): string {
  return type === 'triagem' ? 'Triagem' : 'Movimentação'
}

export function OperationLogScreen() {
  const [logs, setLogs] = useState<OperationLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const list = await getLogs()
    setLogs(list)
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((l) => l.type === filter)
  }, [logs, filter])

  const renderItem = useCallback(
    ({ item }: { item: OperationLogEntry }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={[styles.badge, item.type === 'triagem' ? styles.badgeTriagem : styles.badgeMov]}
          >
            <Text style={styles.badgeText}>{typeLabel(item.type)}</Text>
          </View>
          <Text style={styles.dateText}>{formatWhen(item.createdAt)}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    ),
    []
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.intro}>Registros salvos neste aparelho (triagem e movimentação).</Text>
      <Text style={styles.filterLabel}>Filtrar</Text>
      <View style={styles.chips}>
        {(
          [
            { key: 'all' as const, label: 'Todos' },
            { key: 'triagem' as const, label: 'Triagem' },
            { key: 'movimentacao' as const, label: 'Movimentação' },
          ] as const
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, filter === key && styles.chipActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {logs.length === 0 ? 'Nenhum log armazenado ainda.' : 'Nenhum log para este filtro.'}
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  intro: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    lineHeight: 20,
  },
  filterLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.text,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.tertiary,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fontFamilies.semiBold, fontSize: 13, color: colors.primary },
  chipTextActive: { color: colors.white },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTriagem: { backgroundColor: colors.tertiary },
  badgeMov: {
    backgroundColor: colors.header_sidebar_color,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  badgeText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.text,
  },
  dateText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.text,
    marginTop: 10,
    lineHeight: 22,
  },
  empty: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
})
