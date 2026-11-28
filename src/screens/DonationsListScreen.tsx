import { useCallback, useMemo, useRef, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Choice } from '../components/DonationWorkflowFields'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { getDonations } from '../services/donationService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import type { IDonation } from '../types/donation'
import { categoryNameKey } from '../utils/category'

const PAGE_SIZE = 20
const emptyFilters = { category: '', size: '', gender: '' }
const stockOptions = [
  { value: 'available', label: 'Em estoque' },
  { value: 'unavailable', label: 'Indisponíveis' },
  { value: 'all', label: 'Todas' },
] as const

type Nav = NativeStackNavigationProp<DonationsStackParamList, 'DonationsList'>
type Stock = (typeof stockOptions)[number]['value']

function searchKey(value: string) {
  return categoryNameKey(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function quantityOf(item: IDonation) {
  return item.current_quantity ?? item.initial_quantity
}

function isAvailable(item: IDonation) {
  return item.available !== false && quantityOf(item) > 0
}

function DonationRow({
  item,
  onPress,
  first,
  last,
}: {
  item: IDonation
  onPress: () => void
  first: boolean
  last: boolean
}) {
  const available = isAvailable(item)
  const quantity = quantityOf(item)
  const subtitle = [item.category?.name, item.donator_name].filter(Boolean).join(' · ')
  const stockLabel = available
    ? [quantity, item.category?.measure_unity].filter(Boolean).join(' ')
    : quantity <= 0
      ? 'Sem estoque'
      : 'Indisponível'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[item.name, subtitle, stockLabel].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        first && styles.firstRow,
        last && styles.lastRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.rowCopy}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {subtitle ? (
          <Text style={styles.itemMeta} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.stockLabel, available && styles.stockAvailable]}>{stockLabel}</Text>
        <Ionicons name="chevron-forward" size={17} color={colors.mutedText} />
      </View>
    </Pressable>
  )
}

export function DonationsListScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const request = useRef(0)
  const listRef = useRef<FlatList<IDonation>>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [donations, setDonations] = useState<IDonation[]>([])
  const [query, setQuery] = useState('')
  const [stock, setStock] = useState<Stock>('available')
  const [filters, setFilters] = useState(emptyFilters)
  const [draft, setDraft] = useState<typeof emptyFilters | null>(null)
  const [shown, setShown] = useState(PAGE_SIZE)

  const load = useCallback(async () => {
    const id = ++request.current
    setLoading(true)
    setError(false)
    try {
      const list = await getDonations()
      if (id === request.current) setDonations(list)
    } catch {
      if (id === request.current) setError(true)
    } finally {
      if (id === request.current) setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
      return () => {
        request.current += 1
      }
    }, [load])
  )

  const sorted = useMemo(
    () =>
      [...donations].sort(
        (a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0)
      ),
    [donations]
  )
  const categories = useMemo(() => {
    const options = new Map<string, string>()
    for (const item of donations) {
      if (item.category?.name?.trim())
        options.set(categoryNameKey(item.category.name), item.category.name)
    }
    return Array.from(options, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR')
    )
  }, [donations])
  const sizes = Array.from(new Set(donations.flatMap((item) => (item.size ? [item.size] : []))))
  const genders = Array.from(
    new Set(donations.flatMap((item) => (item.gender ? [item.gender] : [])))
  )
  const filterCount = Object.values(filters).filter(Boolean).length
  const needle = searchKey(query)
  const terms = needle.split(' ').filter(Boolean)
  const matches = sorted.filter(
    (item) =>
      (!filters.category || filters.category === categoryNameKey(item.category?.name ?? '')) &&
      (!filters.size || filters.size === item.size) &&
      (!filters.gender || filters.gender === item.gender) &&
      (!needle ||
        terms.every((term) =>
          [item.name, item.category?.name, item.donator_name].some(
            (value) => value && searchKey(value).includes(term)
          )
        ))
  )
  const filtered =
    stock === 'all'
      ? matches
      : matches.filter((item) => isAvailable(item) === (stock === 'available'))
  const visible = filtered.slice(0, shown)

  function resetList() {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
    setShown(PAGE_SIZE)
  }

  function changeSearch(text: string) {
    setQuery(text)
    resetList()
  }

  function changeFilters(value: typeof emptyFilters) {
    setFilters(value)
    resetList()
    setDraft(null)
  }

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nova doação"
            onPress={() => navigation.navigate('DonationCreate')}
            style={({ pressed }) => [styles.action, styles.primary, pressed && styles.pressed]}
          >
            <Ionicons name="add" color={colors.white} size={21} />
            <Text style={styles.primaryText}>Nova doação</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Destinações pendentes"
            onPress={() => navigation.navigate('AllocationQueue')}
            style={({ pressed }) => [styles.action, styles.outline, pressed && styles.pressed]}
          >
            <Ionicons name="list-outline" color={colors.primaryAction} size={19} />
            <Text style={styles.actionText}>Destinações</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" color={colors.mutedText} size={20} />
            <TextInput
              accessibilityLabel="Buscar doações"
              accessibilityHint="Busque pelo nome do item, categoria ou doador"
              placeholder="Buscar doações"
              placeholderTextColor={colors.mutedText}
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
              onChangeText={changeSearch}
            />
            {query !== '' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
                onPress={() => changeSearch('')}
                style={styles.iconButton}
              >
                <Ionicons name="close-circle" size={19} color={colors.mutedText} />
              </Pressable>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              filterCount === 1
                ? 'Filtros, 1 ativo'
                : filterCount
                  ? `Filtros, ${filterCount} ativos`
                  : 'Filtros'
            }
            onPress={() => {
              Keyboard.dismiss()
              setDraft(filters)
            }}
            style={({ pressed }) => [
              styles.filter,
              filterCount > 0 && styles.filterActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="options-outline" size={19} color={colors.primaryAction} />
            <Text style={styles.actionText}>Filtros{filterCount ? ` (${filterCount})` : ''}</Text>
          </Pressable>
        </View>
        <View style={styles.segments}>
          {stockOptions.map((option) => {
            const selected = option.value === stock
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  Keyboard.dismiss()
                  setStock(option.value)
                  resetList()
                }}
                style={({ pressed }) => [
                  styles.segment,
                  selected && styles.segmentActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={loading && donations.length > 0}
        onRefresh={load}
        ListHeaderComponent={
          <>
            {error && (
              <View style={styles.notice}>
                <Text accessibilityRole="alert" style={styles.stateText}>
                  Não foi possível atualizar as doações.
                </Text>
                <Pressable accessibilityRole="button" onPress={load} style={styles.textButton}>
                  <Text style={styles.actionText}>Tentar novamente</Text>
                </Pressable>
              </View>
            )}
            {filtered.length > 0 && (
              <Text style={styles.count} accessibilityLiveRegion="polite">
                {filtered.length === 1 ? '1 doação' : `${filtered.length} doações`}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.empty}
              color={colors.primaryAction}
              accessibilityLabel="Carregando doações"
            />
          ) : !error ? (
            <View style={styles.empty}>
              <Ionicons
                name={needle || filterCount ? 'search-outline' : 'cube-outline'}
                color={colors.primaryAction}
                size={29}
              />
              <Text style={styles.emptyTitle}>
                {needle || filterCount
                  ? 'Nenhuma doação encontrada'
                  : stock === 'available'
                    ? 'Nenhuma doação em estoque'
                    : stock === 'unavailable'
                      ? 'Nenhuma doação indisponível'
                      : 'Nenhuma doação cadastrada'}
              </Text>
              {stock !== 'all' && matches.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Keyboard.dismiss()
                    setStock('all')
                    resetList()
                  }}
                  style={styles.textButton}
                >
                  <Text style={styles.actionText}>
                    {needle || filterCount ? 'Buscar em todas as doações' : 'Ver todas as doações'}
                  </Text>
                </Pressable>
              ) : (
                !!(needle || filterCount) && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      changeSearch('')
                      changeFilters(emptyFilters)
                    }}
                    style={styles.textButton}
                  >
                    <Text style={styles.actionText}>Limpar busca e filtros</Text>
                  </Pressable>
                )
              )}
            </View>
          ) : null
        }
        onEndReached={() =>
          visible.length < filtered.length && setShown((size) => size + PAGE_SIZE)
        }
        onEndReachedThreshold={0.25}
        renderItem={({ item, index }) => (
          <DonationRow
            item={item}
            first={index === 0}
            last={index === visible.length - 1}
            onPress={() => navigation.navigate('DonationDetail', { donationId: item.id })}
          />
        )}
      />

      {draft && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setDraft(null)}>
          <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
            <View
              style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
              accessibilityViewIsModal
            >
              <View style={styles.sheetHeader}>
                <Text accessibilityRole="header" style={styles.sheetTitle}>
                  Filtrar doações
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar filtros"
                  onPress={() => setDraft(null)}
                  style={styles.iconButton}
                >
                  <Ionicons name="close" size={23} color={colors.primaryAction} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.sheetFields}>
                <Choice
                  label="Categoria"
                  items={[{ value: '', label: 'Todas' }, ...categories]}
                  value={draft.category}
                  onChange={(category) => setDraft({ ...draft, category })}
                />
                {sizes.length > 0 && (
                  <Choice
                    label="Tamanho"
                    items={[
                      { value: '', label: 'Todos' },
                      ...sizes.map((value) => ({ value, label: value })),
                    ]}
                    value={draft.size}
                    onChange={(size) => setDraft({ ...draft, size })}
                  />
                )}
                {genders.length > 0 && (
                  <Choice
                    label="Gênero"
                    items={[
                      { value: '', label: 'Todos' },
                      ...genders.map((value) => ({ value, label: value })),
                    ]}
                    value={draft.gender}
                    onChange={(gender) => setDraft({ ...draft, gender })}
                  />
                )}
              </ScrollView>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.action, styles.outline]}
                  onPress={() => setDraft(emptyFilters)}
                >
                  <Text style={styles.actionText}>Limpar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.action, styles.primary]}
                  onPress={() => changeFilters(draft)}
                >
                  <Text style={styles.primaryText}>Aplicar filtros</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FA' },
  toolbar: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE6EC',
  },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    gap: 6,
    padding: 8,
    borderRadius: 10,
  },
  primary: { backgroundColor: colors.primaryAction },
  outline: { backgroundColor: '#F2F8FB', borderWidth: 1, borderColor: colors.tertiary },
  primaryText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
    color: colors.white,
  },
  actionText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
    color: colors.primaryAction,
  },
  searchRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  searchBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    gap: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#DDE6EC',
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingRight: 8,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
  },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  filter: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    borderWidth: 1,
    borderColor: '#DDE6EC',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  filterActive: { backgroundColor: '#E8F3F8', borderColor: colors.primary },
  segments: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
    backgroundColor: '#EEF3F7',
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 4,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: colors.white, borderColor: '#D3E2EC', borderWidth: 1 },
  segmentText: {
    color: colors.mutedText,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  segmentTextActive: { color: colors.primaryAction, fontFamily: fontFamilies.semiBold },
  pressed: { opacity: 0.7 },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  count: {
    paddingTop: 14,
    paddingBottom: 10,
    color: colors.mutedText,
    fontSize: 13,
    fontFamily: fontFamilies.semiBold,
  },
  row: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 66,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#DFE8EF',
  },
  firstRow: { borderTopWidth: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  lastRow: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  itemName: { color: colors.text, fontSize: 14, fontFamily: fontFamilies.semiBold },
  itemMeta: { color: colors.mutedText, fontSize: 12, fontFamily: fontFamilies.regular },
  rowEnd: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '42%' },
  stockLabel: {
    flexShrink: 1,
    overflow: 'hidden',
    backgroundColor: '#EEF1F5',
    color: colors.mutedText,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 11,
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
  },
  stockAvailable: { backgroundColor: '#E5F2EC', color: '#245941' },
  empty: { alignItems: 'center', marginTop: 26, padding: 16, gap: 8 },
  emptyTitle: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontFamily: fontFamilies.semiBold,
  },
  notice: { marginTop: 12, padding: 12, backgroundColor: colors.white, borderRadius: 10 },
  stateText: { color: colors.danger, fontFamily: fontFamilies.regular },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(9, 9, 52, 0.42)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexShrink: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetTitle: { flex: 1, color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 18 },
  sheetFields: { paddingBottom: 6, gap: 14 },
})
