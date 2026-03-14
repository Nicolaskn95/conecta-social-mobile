import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { DonationsStackParamList } from '../navigation/DonationsStack'
import type { IDonation } from '../types/donation'
import { getDonations } from '../services/donationService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const PAGE_SIZE = 20

type Nav = NativeStackNavigationProp<DonationsStackParamList, 'DonationsList'>

export function DonationsListScreen() {
  const navigation = useNavigation<Nav>()
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState<IDonation[]>([])
  const [filterSize, setFilterSize] = useState<string>('')
  const [filterGender, setFilterGender] = useState<string>('')
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getDonations()
      setDonations(list)
      setPage(0)
    } catch {
      setDonations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const filtered = donations.filter((d) => {
    if (filterSize && d.size !== filterSize) return false
    if (filterGender && d.gender !== filterGender) return false
    return true
  })

  const sizes = Array.from(new Set(donations.map((d) => d.size).filter(Boolean))) as string[]
  const genders = Array.from(new Set(donations.map((d) => d.gender).filter(Boolean))) as string[]

  const paginated = filtered.slice(0, (page + 1) * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  const handleDonationPress = (donationId: string) => {
    navigation.navigate('DonationDetail', { donationId })
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Tamanho</Text>
        <View style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !filterSize && styles.chipActive]}
            onPress={() => setFilterSize('')}
          >
            <Text style={[styles.chipText, !filterSize && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {sizes.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, filterSize === s && styles.chipActive]}
              onPress={() => setFilterSize(filterSize === s ? '' : s)}
            >
              <Text style={[styles.chipText, filterSize === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.filterLabel}>Gênero</Text>
        <View style={styles.chips}>
          <TouchableOpacity
            style={[styles.chip, !filterGender && styles.chipActive]}
            onPress={() => setFilterGender('')}
          >
            <Text style={[styles.chipText, !filterGender && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>
          {genders.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, filterGender === g && styles.chipActive]}
              onPress={() => setFilterGender(filterGender === g ? '' : g)}
            >
              <Text style={[styles.chipText, filterGender === g && styles.chipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma doação encontrada.</Text>}
        onEndReached={() => hasMore && setPage((p) => p + 1)}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleDonationPress(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.donator_name ? (
              <Text style={styles.cardDonor}>Doador: {item.donator_name}</Text>
            ) : null}
            <Text style={styles.cardMeta}>
              Qtd: {item.current_quantity ?? item.initial_quantity}
              {item.category?.measure_unity ? ` ${item.category.measure_unity}` : ''}
            </Text>
            {item.available === false && <Text style={styles.unavailable}>Indisponível</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.tertiary,
  },
  filterLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.primary },
  chipTextActive: { color: colors.white },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: colors.background,
  },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  cardDonor: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
  },
  cardMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
  unavailable: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
})
