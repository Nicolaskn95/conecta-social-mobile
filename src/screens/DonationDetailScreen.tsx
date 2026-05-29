import { useHeaderHeight } from '@react-navigation/elements'
import { useRoute, RouteProp } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { DonationImagePreview } from '../components/DonationImagePreview'
import { DismissKeyboardOnTap } from '../components/DismissKeyboardOnTap'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import type { IFamily } from '../types/family'
import type {
  DonationStockAdjustmentReason,
  DonationUpdatePayload,
  IDonation,
} from '../types/donation'
import {
  type DonationImagePick,
  adjustDonationStock,
  allocateDonationToFamily,
  getDonationById,
  updateDonation,
} from '../services/donationService'
import { getActiveFamilies } from '../services/familyService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Route = RouteProp<DonationsStackParamList, 'DonationDetail'>

const STOCK_ADJUSTMENT_REASONS: Array<{
  value: DonationStockAdjustmentReason
  label: string
}> = [
  { value: 'SPOILAGE', label: 'Produto estragado' },
  { value: 'LOSS', label: 'Perda' },
  { value: 'DAMAGE', label: 'Dano' },
  { value: 'EXPIRATION', label: 'Vencimento' },
  { value: 'INVENTORY_CORRECTION', label: 'Correção de inventário' },
  { value: 'OTHER', label: 'Outro' },
]

export function DonationDetailScreen() {
  const headerHeight = useHeaderHeight()
  const route = useRoute<Route>()
  const { donationId } = route.params
  const [donation, setDonation] = useState<IDonation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [families, setFamilies] = useState<IFamily[]>([])
  const [familiesLoading, setFamiliesLoading] = useState(true)
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [allocateQty, setAllocateQty] = useState('')
  const [allocating, setAllocating] = useState(false)
  const [pickedImage, setPickedImage] = useState<DonationImagePick | null>(null)
  const [stockDelta, setStockDelta] = useState('')
  const [stockReason, setStockReason] = useState<DonationStockAdjustmentReason>(
    'INVENTORY_CORRECTION'
  )
  const [stockNote, setStockNote] = useState('')
  const [adjustingStock, setAdjustingStock] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await getDonationById(donationId)
    setDonation(d)
    setLoading(false)
  }, [donationId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setFamiliesLoading(true)
      try {
        const list = await getActiveFamilies()
        if (!cancelled) setFamilies(list)
      } catch {
        if (!cancelled) setFamilies([])
      } finally {
        if (!cancelled) setFamiliesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos da galeria para escolher a foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    if (!asset?.uri) return
    setPickedImage({
      uri: asset.uri,
      name: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? undefined,
      width: asset.width,
      height: asset.height,
    })
  }

  const handleSave = async () => {
    if (!donation) return
    setSaving(true)
    try {
      const payload: DonationUpdatePayload = {
        category_id: donation.category_id,
        name: donation.name,
        description: donation.description ?? '',
        donator_name: donation.donator_name ?? '',
        gender: donation.gender ?? '',
        size: donation.size ?? '',
        active: donation.active !== false,
      }
      const { donation: updated, errorMessage } = await updateDonation(
        donation.id,
        payload,
        pickedImage ?? undefined
      )
      if (updated) {
        setPickedImage(null)
        setDonation(updated)
        Alert.alert('Sucesso', 'Doação atualizada.')
      } else {
        Alert.alert('Erro ao atualizar', errorMessage ?? 'Não foi possível atualizar.')
      }
    } catch {
      Alert.alert('Erro', 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustStock = async () => {
    if (!donation) return

    const delta = Number(stockDelta)
    if (!Number.isInteger(delta) || delta === 0) {
      Alert.alert('Ajuste', 'Informe uma quantidade inteira diferente de zero.')
      return
    }

    if (stockReason === 'OTHER' && !stockNote.trim()) {
      Alert.alert('Ajuste', 'A observação é obrigatória quando o motivo é Outro.')
      return
    }

    setAdjustingStock(true)
    try {
      const { donation: updated, errorMessage } = await adjustDonationStock(donation.id, {
        delta_quantity: delta,
        reason: stockReason,
        note: stockNote.trim() ? stockNote.trim() : undefined,
      })

      if (updated) {
        setDonation(updated)
        setStockDelta('')
        setStockReason('INVENTORY_CORRECTION')
        setStockNote('')
        Alert.alert('Sucesso', 'Ajuste de estoque registrado.')
      } else {
        Alert.alert('Erro no ajuste', errorMessage ?? 'Não foi possível ajustar o estoque.')
      }
    } finally {
      setAdjustingStock(false)
    }
  }

  const handleAllocateToFamily = async () => {
    if (!donation) return
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
    if (qty > stock) {
      Alert.alert('Quantidade', 'Não há estoque suficiente para esta destinação.')
      return
    }
    setAllocating(true)
    try {
      const { donation: updated, errorMessage } = await allocateDonationToFamily(donation.id, {
        family_id: selectedFamilyId,
        quantity: qty,
      })
      if (updated) {
        setDonation(updated)
        setAllocateQty('')
        Alert.alert('Sucesso', 'Quantidade destinada à família e estoque atualizado.')
      } else {
        Alert.alert('Erro', errorMessage ?? 'Não foi possível destinar.')
      }
    } finally {
      setAllocating(false)
    }
  }

  const stock = donation?.current_quantity ?? 0
  const isOutOfStock = stock < 1
  const unit = donation?.category?.measure_unity ?? '—'

  const imagePreviewUri = pickedImage?.uri ?? donation?.image_url ?? null

  const stockAvailabilityLabel = useMemo(
    () => ((donation?.current_quantity ?? 0) > 0 ? 'Disponível' : 'Sem estoque'),
    [donation?.current_quantity]
  )

  if (loading || !donation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.avoid}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <DismissKeyboardOnTap fill={false}>
          <Text style={styles.cardTitle}>{donation.name}</Text>
          <Text style={styles.label}>Unidade de medida (categoria)</Text>
          <Text style={styles.value}>{unit}</Text>
          <Text style={styles.label}>Doador</Text>
          <Text style={styles.value}>{donation.donator_name ?? '—'}</Text>
          <Text style={styles.label}>Foto do item</Text>
          {imagePreviewUri ? (
            <DonationImagePreview
              uri={imagePreviewUri}
              imageContentType={
                pickedImage ? undefined : (donation.image_content_type ?? undefined)
              }
            />
          ) : (
            <Text style={styles.imagePlaceholder}>Nenhuma foto cadastrada.</Text>
          )}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.btnOutline} onPress={handlePickGallery}>
              <Text style={styles.btnOutlineText}>Escolher da galeria</Text>
            </TouchableOpacity>
            {pickedImage ? (
              <TouchableOpacity style={styles.btnOutlineMuted} onPress={() => setPickedImage(null)}>
                <Text style={styles.btnOutlineMutedText}>Descartar nova foto</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.sectionHintMuted}>
            A nova foto será enviada ao salvar os dados gerais da doação.
          </Text>

          {saving ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
              <Text style={styles.btnPrimaryText}>Salvar dados gerais</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Ajuste de estoque</Text>
          <Text style={styles.sectionHint}>
            Registre perda, vencimento ou correção de inventário sem editar manualmente o estoque na
            atualização geral.
          </Text>

          <View style={styles.stockGrid}>
            <View style={styles.stockCard}>
              <Text style={styles.stockLabel}>Quantidade inicial</Text>
              <Text style={styles.stockValue}>{donation.initial_quantity}</Text>
            </View>
            <View style={styles.stockCard}>
              <Text style={styles.stockLabel}>Estoque atual</Text>
              <Text style={styles.stockValue}>{stock}</Text>
            </View>
            <View style={styles.stockCard}>
              <Text style={styles.stockLabel}>Disponibilidade</Text>
              <Text style={styles.stockValue}>{stockAvailabilityLabel}</Text>
            </View>
          </View>

          <Text style={styles.label}>Quantidade de ajuste ({unit})</Text>
          <TextInput
            style={styles.input}
            value={stockDelta}
            onChangeText={setStockDelta}
            placeholder="Ex.: -2 ou 5"
            placeholderTextColor={colors.mutedText}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
            editable={!adjustingStock}
          />
          <Text style={styles.sectionHintMuted}>
            Valores negativos reduzem o estoque; positivos incrementam.
          </Text>

          <Text style={styles.label}>Motivo</Text>
          <View style={styles.reasonList}>
            {STOCK_ADJUSTMENT_REASONS.map((option) => {
              const selected = stockReason === option.value
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.reasonChip, selected && styles.reasonChipActive]}
                  onPress={() => setStockReason(option.value)}
                  disabled={adjustingStock}
                >
                  <Text style={[styles.reasonChipText, selected && styles.reasonChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.label}>Observação {stockReason === 'OTHER' ? '*' : ''}</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={stockNote}
            onChangeText={setStockNote}
            placeholder="Detalhe do ajuste"
            placeholderTextColor={colors.mutedText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!adjustingStock}
          />

          {adjustingStock ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <TouchableOpacity style={styles.btnSecondary} onPress={handleAdjustStock}>
              <Text style={styles.btnSecondaryText}>Registrar movimentação de estoque</Text>
            </TouchableOpacity>
          )}

          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Destinar à família</Text>
          <Text style={styles.sectionHint}>
            Registra a entrega e reduz automaticamente a quantidade em estoque.
          </Text>
          {isOutOfStock ? (
            <Text style={styles.warningText}>Sem quantidade em estoque para destinar.</Text>
          ) : familiesLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : families.length === 0 ? (
            <Text style={styles.emptyFamilies}>Nenhuma família ativa cadastrada na API.</Text>
          ) : (
            <>
              <Text style={styles.label}>Família</Text>
              <View style={styles.familyList}>
                {families.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.familyRow, selectedFamilyId === f.id && styles.familyRowActive]}
                    onPress={() => setSelectedFamilyId(f.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.familyName}>{f.name}</Text>
                    <Text style={styles.familyMeta}>
                      {f.city} — {f.neighborhood}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Quantidade a destinar ({unit})</Text>
              <TextInput
                style={styles.input}
                value={allocateQty}
                onChangeText={setAllocateQty}
                placeholder="0"
                placeholderTextColor={colors.mutedText}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                editable={!allocating}
              />
              {allocating ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.btnSecondary,
                    (!selectedFamilyId || !allocateQty.trim()) && styles.btnDisabled,
                  ]}
                  onPress={handleAllocateToFamily}
                  disabled={!selectedFamilyId || !allocateQty.trim()}
                >
                  <Text style={styles.btnSecondaryText}>Confirmar destinação</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </DismissKeyboardOnTap>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  avoid: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 120, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
  },
  value: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
  imagePlaceholder: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
  },
  imageActions: { marginTop: 12, gap: 10 },
  btnOutline: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnOutlineText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: colors.primary,
  },
  btnOutlineMuted: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnOutlineMutedText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
  },
  sectionHintMuted: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 10,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    marginTop: 6,
  },
  inputMultiline: {
    minHeight: 96,
  },
  loader: { marginTop: 24 },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.white,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.tertiary,
    marginTop: 28,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 17,
    color: colors.primary,
    marginTop: 8,
  },
  sectionHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 20,
  },
  stockGrid: {
    marginTop: 4,
    gap: 10,
  },
  stockCard: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  stockLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  stockValue: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    color: colors.text,
    marginTop: 6,
  },
  reasonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  reasonChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.header_sidebar_color,
  },
  reasonChipText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.text,
  },
  reasonChipTextActive: {
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
  },
  warningText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.danger,
    marginTop: 8,
  },
  emptyFamilies: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
  },
  familyList: { marginTop: 6, gap: 8 },
  familyRow: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.background,
  },
  familyRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.header_sidebar_color,
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
  btnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
  btnDisabled: { opacity: 0.45 },
})
