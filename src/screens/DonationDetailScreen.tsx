import { useRoute, RouteProp } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import type { DonationsStackParamList } from '../navigation/DonationsStack'
import type { IDonation } from '../types/donation'
import { getDonationById, updateDonation } from '../services/donationService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Route = RouteProp<DonationsStackParamList, 'DonationDetail'>

export function DonationDetailScreen() {
  const route = useRoute<Route>()
  const { donationId } = route.params
  const [donation, setDonation] = useState<IDonation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [available, setAvailable] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await getDonationById(donationId)
    setDonation(d)
    if (d) {
      setCurrentQuantity(String(d.current_quantity ?? d.initial_quantity))
      setAvailable(d.available !== false)
    }
    setLoading(false)
  }, [donationId])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    const qty = Number(currentQuantity)
    if (Number.isNaN(qty) || qty < 0) {
      Alert.alert('Erro', 'Quantidade não pode ser negativa.')
      return
    }
    if (!donation) return
    setSaving(true)
    try {
      const updated = await updateDonation(donation.id, {
        current_quantity: qty,
        available,
      })
      if (updated) {
        setDonation(updated)
        Alert.alert('Sucesso', 'Doação atualizada.')
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar.')
      }
    } catch {
      Alert.alert('Erro', 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !donation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const unit = donation.category?.measure_unity ?? '—'

  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>{donation.name}</Text>
      <Text style={styles.label}>Unidade de medida (categoria)</Text>
      <Text style={styles.value}>{unit}</Text>
      <Text style={styles.label}>Doador</Text>
      <Text style={styles.value}>{donation.donator_name ?? '—'}</Text>
      <Text style={styles.label}>Quantidade atual</Text>
      <TextInput
        style={styles.input}
        value={currentQuantity}
        onChangeText={setCurrentQuantity}
        placeholder="0"
        placeholderTextColor={colors.mutedText}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={[styles.toggle, !available && styles.toggleOff]}
        onPress={() => setAvailable(!available)}
      >
        <Text style={styles.toggleText}>
          {available ? 'Disponível' : 'Indisponível (reparo/higienização)'}
        </Text>
      </TouchableOpacity>
      {saving ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
          <Text style={styles.btnPrimaryText}>Salvar</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
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
  toggle: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.success_light,
    borderWidth: 1,
    borderColor: colors.success,
  },
  toggleOff: { backgroundColor: colors.danger_hover, borderColor: colors.danger },
  toggleText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
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
})
