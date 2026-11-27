import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { randomUUID } from 'expo-crypto'
import { Ionicons } from '@expo/vector-icons'
import { DonationSuggestions } from '../components/DonationSuggestions'
import type { Suggestion } from '../services/recommendations'
import { RecipientFields } from '../components/DonationWorkflowFields'
import type { Recipient } from '../services/donationWorkflow'
import type { IFamily } from '../types/family'
import { allocateDonationToFamily, getDonationById } from '../services/donationService'
import { getActiveFamilies } from '../services/familyService'
import { getApiErrorMessage } from '../services/apiError'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { DonationForm, useDonation } from '../components/DonationForm'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Props = NativeStackScreenProps<DonationsStackParamList, 'DonationAllocate'>

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function DonationAllocateScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets()
  const { donation, setDonation, loading, reload } = useDonation(route.params.donationId)
  const [families, setFamilies] = useState<IFamily[]>([])
  const [familiesLoading, setFamiliesLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [familyPickerOpen, setFamilyPickerOpen] = useState(false)
  const [familySearch, setFamilySearch] = useState('')
  const [recipient, setRecipient] = useState<Recipient>({})
  const [applied, setApplied] = useState<Suggestion>()
  const [recommendationsRevision, setRecommendationsRevision] = useState(0)
  const suggestion = applied && applied.id_need === recipient.id_need ? applied : undefined
  const [allocateQty, setAllocateQty] = useState('')
  const [allocating, setAllocating] = useState(false)
  const attempt = useRef<{ body: string; id: string } | null>(null)

  useEffect(() => {
    let current = true
    setFamiliesLoading(true)
    setLoadError(false)
    getActiveFamilies()
      .then((list) => {
        if (current) setFamilies(list)
      })
      .catch(() => {
        if (current) setLoadError(true)
      })
      .finally(() => {
        if (current) setFamiliesLoading(false)
      })
    return () => {
      current = false
    }
  }, [retry])

  const handleAllocateToFamily = async () => {
    if (!donation || allocating) return
    if (!selectedFamilyId) {
      Alert.alert('Família', 'Selecione uma família.')
      return
    }
    const qty = Number(allocateQty)
    if (!Number.isInteger(qty) || qty < 1) {
      Alert.alert('Quantidade', 'Informe um número inteiro maior que zero.')
      return
    }
    const stock = donation.current_quantity ?? 0
    if (qty > stock && !attempt.current) {
      Alert.alert('Quantidade', 'Não há estoque suficiente para esta destinação.')
      return
    }
    const command = { family_id: selectedFamilyId, quantity: qty, ...recipient }
    const body = JSON.stringify(command)
    if (attempt.current && attempt.current.body !== body) {
      Alert.alert('Separação pendente', 'Reenvie com os mesmos dados para consultar o resultado.')
      return
    }
    attempt.current ??= { body, id: randomUUID() }
    setAllocating(true)
    try {
      const result = await allocateDonationToFamily(donation.id, {
        ...command,
        request_id: attempt.current.id,
      })
      attempt.current = null
      navigation.replace('AllocationQueue', { allocationId: result.id })
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })
        .response
      if (response?.status && response.status < 500) attempt.current = null
      if (response?.status === 409 || response?.status === 400) {
        setApplied(undefined)
        setRecommendationsRevision((value) => value + 1)
        const refreshed = await getDonationById(donation.id)
        if (refreshed) setDonation(refreshed)
      }
      Alert.alert(
        'Separação',
        getApiErrorMessage(
          error,
          'Não foi possível confirmar o envio. Tente novamente com os mesmos dados.'
        )
      )
    } finally {
      setAllocating(false)
    }
  }

  const stock = donation?.current_quantity ?? 0
  const isOutOfStock = stock < 1 && !attempt.current
  const unit = donation?.category?.measure_unity
  const quantity = Number(allocateQty)
  const quantityInvalid = allocateQty.trim() !== '' && (!Number.isInteger(quantity) || quantity < 1)
  const quantityExceedsStock = quantity > stock && !attempt.current
  const quantityExceedsSuggestion =
    suggestion?.max_separable_quantity != null &&
    quantity > suggestion.max_separable_quantity &&
    !attempt.current
  const canSubmit =
    !!selectedFamilyId &&
    !!allocateQty.trim() &&
    !quantityInvalid &&
    !quantityExceedsStock &&
    !quantityExceedsSuggestion
  const selectedFamily = families.find((family) => family.id === selectedFamilyId)
  const search = normalizeSearch(familySearch.trim())
  const filteredFamilies = families.filter((family) =>
    normalizeSearch(
      [family.name, family.city, family.neighborhood].filter(Boolean).join(' ')
    ).includes(search)
  )

  return (
    <DonationForm donation={donation} loading={loading} retry={reload}>
      <View style={styles.stockNotice}>
        <View style={styles.stockIcon}>
          <Ionicons name="cube-outline" size={21} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.stockLabel}>Disponível em estoque</Text>
          <Text style={styles.stockValue}>
            {stock}
            {unit ? ' ' + unit : ''}
          </Text>
        </View>
      </View>
      {stock > 0 && (
        <DonationSuggestions
          donationId={route.params.donationId}
          initialOpen={!!route.params.showSuggestions}
          disabled={allocating || !!attempt.current}
          revision={recommendationsRevision}
          onSelect={(item) => {
            setSelectedFamilyId(item.id_family)
            setRecipient({
              id_beneficiary: item.id_beneficiary ?? undefined,
              id_need: item.id_need,
            })
            setApplied(item)
          }}
        />
      )}
      {suggestion && (
        <View accessibilityLiveRegion="polite" style={styles.field}>
          <Text style={styles.familyName}>Pedido selecionado: {suggestion.need_label}</Text>
          {suggestion.beneficiary_name && (
            <Text style={styles.familyMeta}>{suggestion.beneficiary_name}</Text>
          )}
          <Text style={styles.familyMeta}>
            {suggestion.max_separable_quantity == null
              ? 'Quantidade a confirmar'
              : 'Máximo separável: ' + suggestion.max_separable_quantity}
          </Text>
        </View>
      )}
      {isOutOfStock ? (
        <Text style={styles.warningText}>Sem quantidade em estoque para destinar.</Text>
      ) : familiesLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : loadError ? (
        <TouchableOpacity accessibilityRole="button" onPress={() => setRetry((value) => value + 1)}>
          <Text style={styles.warningText}>
            Não foi possível carregar as famílias. Tentar novamente
          </Text>
        </TouchableOpacity>
      ) : families.length === 0 ? (
        <Text style={styles.emptyFamilies}>Nenhuma família ativa cadastrada na API.</Text>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Família</Text>
            <TouchableOpacity
              style={[styles.familyRow, selectedFamily && styles.familyRowActive]}
              onPress={() => {
                Keyboard.dismiss()
                setFamilySearch('')
                setFamilyPickerOpen(true)
              }}
              disabled={allocating}
              accessibilityRole="button"
              accessibilityLabel={
                selectedFamily ? 'Alterar família: ' + selectedFamily.name : 'Selecionar família'
              }
            >
              <Ionicons name="people-outline" size={22} color={colors.primary} />
              <View style={styles.flex}>
                <Text style={styles.familyName}>
                  {selectedFamily?.name ?? suggestion?.family_name ?? 'Selecione uma família'}
                </Text>
                {selectedFamily &&
                  [selectedFamily.city, selectedFamily.neighborhood].some(Boolean) && (
                    <Text style={styles.familyMeta}>
                      {[selectedFamily.city, selectedFamily.neighborhood]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Quantidade a separar</Text>
            <View
              style={[
                styles.quantityField,
                (quantityInvalid || quantityExceedsStock) && styles.invalid,
              ]}
            >
              <TextInput
                accessibilityLabel="Quantidade a separar"
                style={styles.quantityInput}
                value={allocateQty}
                onChangeText={setAllocateQty}
                placeholder="Ex.: 1"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!allocating}
              />
              {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
            {quantityInvalid && (
              <Text style={styles.warningText} accessibilityLiveRegion="polite">
                Informe um número inteiro maior que zero.
              </Text>
            )}
            {quantityExceedsStock && !quantityInvalid && (
              <Text style={styles.warningText} accessibilityLiveRegion="polite">
                A quantidade supera o estoque disponível.
              </Text>
            )}
          </View>
          {quantityExceedsSuggestion && !quantityExceedsStock && (
            <Text style={styles.warningText} accessibilityLiveRegion="polite">
              A quantidade supera o máximo separável deste pedido.
            </Text>
          )}
          {selectedFamilyId && (
            <RecipientFields
              key={selectedFamilyId}
              family={selectedFamilyId}
              value={recipient}
              onChange={setRecipient}
            />
          )}
          <TouchableOpacity
            style={[styles.confirm, !canSubmit && !allocating && styles.confirmDisabled]}
            accessibilityRole="button"
            accessibilityLabel={allocating ? 'Confirmando separação' : 'Confirmar separação'}
            accessibilityState={{ disabled: !canSubmit || allocating, busy: allocating }}
            onPress={handleAllocateToFamily}
            disabled={!canSubmit || allocating}
          >
            {allocating ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Confirmando separação" />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={canSubmit ? colors.white : colors.mutedText}
                />
                <Text style={[styles.confirmText, !canSubmit && styles.confirmDisabledText]}>
                  Confirmar separação
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.sectionHint}>
            A separação dá baixa no estoque. O recebimento é confirmado depois.
          </Text>
        </>
      )}

      <Modal
        visible={familyPickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFamilyPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                Selecionar família
              </Text>
              <TouchableOpacity
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção de família"
                onPress={() => setFamilyPickerOpen(false)}
              >
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.quantityField}>
              <Ionicons name="search-outline" size={20} color={colors.mutedText} />
              <TextInput
                style={styles.quantityInput}
                value={familySearch}
                onChangeText={setFamilySearch}
                placeholder="Buscar por nome, cidade ou bairro"
                placeholderTextColor={colors.mutedText}
                accessibilityLabel="Buscar família"
              />
            </View>
            <FlatList
              data={filteredFamilies}
              keyExtractor={(family) => family.id}
              ItemSeparatorComponent={() => <View style={styles.familySeparator} />}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyFamilies}>Nenhuma família encontrada.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.familyRow, selectedFamilyId === item.id && styles.familyRowActive]}
                  onPress={() => {
                    if (item.id !== selectedFamilyId) {
                      setRecipient({})
                      setApplied(undefined)
                    }
                    setSelectedFamilyId(item.id)
                    setFamilyPickerOpen(false)
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedFamilyId === item.id }}
                >
                  <View style={styles.flex}>
                    <Text style={styles.familyName}>{item.name}</Text>
                    {[item.city, item.neighborhood].some(Boolean) && (
                      <Text style={styles.familyMeta}>
                        {[item.city, item.neighborhood].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={selectedFamilyId === item.id ? 'checkmark-circle' : 'chevron-forward'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </DonationForm>
  )
}

const styles = StyleSheet.create({
  sectionHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.danger,
    marginTop: 2,
  },
  flex: { flex: 1, minWidth: 0 },
  field: { gap: 7, marginBottom: 14 },
  stockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF5F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  stockIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stockLabel: { color: colors.mutedText, fontSize: 12, fontFamily: fontFamilies.regular },
  stockValue: { color: colors.text, fontSize: 18, fontFamily: fontFamilies.semiBold, marginTop: 2 },
  loader: { marginTop: 24 },
  emptyFamilies: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    padding: 12,
    minHeight: 52,
    backgroundColor: colors.background,
  },
  familyName: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: colors.text,
  },
  familyMeta: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 4,
  },
  quantityField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  quantityInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    color: colors.text,
    fontFamily: fontFamilies.regular,
  },
  unit: { color: colors.mutedText, fontFamily: fontFamilies.semiBold, fontSize: 12 },
  invalid: { borderColor: colors.danger },
  confirm: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    backgroundColor: colors.primaryAction,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmDisabled: { backgroundColor: '#E5EBF1' },
  confirmText: {
    flexShrink: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: colors.white,
    textAlign: 'center',
  },
  confirmDisabledText: { color: colors.mutedText },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    color: colors.text,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#EEF5F8',
  },
  familySeparator: { height: 8 },
  familyRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF5F8',
  },
})
