import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import type { DonationStockAdjustmentReason } from '../types/donation'
import { adjustDonationStock } from '../services/donationService'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { DonationForm, useDonation } from '../components/DonationForm'
import { Choice } from '../components/DonationWorkflowFields'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Props = NativeStackScreenProps<DonationsStackParamList, 'DonationStock'>

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

export function DonationStockScreen({ route }: Props) {
  const { donation, setDonation, loading, reload } = useDonation(route.params.donationId)
  const [stockDelta, setStockDelta] = useState('')
  const [stockReason, setStockReason] =
    useState<DonationStockAdjustmentReason>('INVENTORY_CORRECTION')
  const [stockNote, setStockNote] = useState('')
  const [adjustingStock, setAdjustingStock] = useState(false)

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

  const stock = donation?.current_quantity ?? 0
  const unit = donation?.category?.measure_unity ?? '—'
  return (
    <DonationForm donation={donation} loading={loading} retry={reload}>
      <Text style={styles.sectionHint}>
        Registre perdas, vencimentos ou correções de inventário.
      </Text>

      {donation && (
        <View style={styles.stockGrid}>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Quantidade inicial</Text>
            <Text style={styles.stockValue}>{donation.initial_quantity}</Text>
          </View>
          <View style={styles.stockCard}>
            <Text style={styles.stockLabel}>Estoque atual</Text>
            <Text style={styles.stockValue}>{stock}</Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Quantidade de ajuste ({unit})</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="Quantidade de ajuste"
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

      <View style={styles.reasonList}>
        <Choice
          label="Motivo"
          items={STOCK_ADJUSTMENT_REASONS}
          value={stockReason}
          onChange={setStockReason}
          disabled={adjustingStock}
        />
      </View>

      <Text style={styles.label}>
        Observação {stockReason === 'OTHER' ? '(obrigatória)' : '(opcional)'}
      </Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        accessibilityLabel="Observação"
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
        <TouchableOpacity
          style={styles.submit}
          accessibilityRole="button"
          onPress={handleAdjustStock}
        >
          <Text style={styles.submitText}>Registrar ajuste</Text>
        </TouchableOpacity>
      )}
    </DonationForm>
  )
}

const styles = StyleSheet.create({
  sectionHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 20,
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 10,
  },
  stockCard: {
    flexGrow: 1,
    flexBasis: 136,
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EEF5F8',
  },
  stockLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  stockValue: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    color: colors.text,
    marginTop: 6,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
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
  sectionHintMuted: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 10,
    lineHeight: 18,
  },
  reasonList: { marginTop: 16 },
  inputMultiline: {
    minHeight: 96,
  },
  loader: { marginTop: 24 },
  submit: {
    backgroundColor: colors.primaryAction,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.white,
  },
})
