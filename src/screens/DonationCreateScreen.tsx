import { ItemFields } from '../components/DonationWorkflowFields'
import type { ItemDetails } from '../services/donationWorkflow'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'

import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { getCategories } from '../services/categoryService'
import { createDonation } from '../services/donationService'
import { getApiErrorMessage } from '../services/apiError'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import type { ICategory } from '../types/donation'
import { categoryNameKey } from '../utils/category'

type Navigation = NativeStackNavigationProp<DonationsStackParamList, 'DonationCreate'>

export function DonationCreateScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Navigation>()
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryError, setCategoryError] = useState(false)
  const [category, setCategory] = useState<ICategory | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [donor, setDonor] = useState('')
  const [size, setSize] = useState('')
  const [gender, setGender] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getCategories()
      const unique = new Map<string, ICategory>()
      result.filter((item) => item.active !== false).forEach((item) => {
        const key = categoryNameKey(item.name)
        if (key && !unique.has(key)) unique.set(key, item)
      })
      setCategories(Array.from(unique.values()))
      setCategoryError(false)
    } catch {
      setCategoryError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadCategories() }, [loadCategories])

  const [details, setDetails] = useState<ItemDetails>({})
  useEffect(() => { setDetails({}) }, [category?.id])

  const submit = async () => {
    const trimmedName = name.trim()
    const parsedQuantity = Number(quantity)
    if (trimmedName.length < 2) {
      Alert.alert('Nome obrigatório', 'Informe um nome com pelo menos dois caracteres.')
      return
    }
    if (!category) {
      Alert.alert('Categoria obrigatória', 'Selecione uma categoria para a doação.')
      return
    }
    if (!/^\d+$/.test(quantity) || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 2147483647) {
      Alert.alert('Quantidade inválida', 'Informe uma quantidade inteira maior que zero.')
      return
    }

    setSaving(true)
    try {
      await createDonation({
        ...details,
        name: trimmedName,
        category_id: category.id,
        initial_quantity: parsedQuantity,
        description: description.trim() || undefined,
        donator_name: donor.trim() || undefined,
        size: size.trim() || undefined,
        gender: gender.trim() || undefined,
      })
      navigation.goBack()
    } catch (error) {
      Alert.alert('Erro ao cadastrar', getApiErrorMessage(error, 'Não foi possível cadastrar a doação.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Informações da doação</Text>
        <Text style={styles.hint}>Campos obrigatórios estão marcados com *.</Text>

        <Text style={styles.label}>Nome *</Text>
        <TextInput accessibilityLabel="Nome da doação" style={styles.input} value={name} onChangeText={setName} maxLength={60} editable={!saving} />

        <Text style={styles.label}>Categoria *</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : (
          <>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Selecionar categoria" style={styles.select} onPress={() => setSelecting(true)} disabled={saving || categoryError || categories.length === 0}>
              <Text style={category ? styles.value : styles.placeholder}>
                {category ? `${category.name} (${category.measure_unity})` : 'Selecione uma categoria'}
              </Text>
            </TouchableOpacity>
            {categoryError ? (
              <TouchableOpacity accessibilityRole="button" onPress={loadCategories}>
                <Text style={styles.error}>Não foi possível carregar as categorias. Toque para tentar novamente.</Text>
              </TouchableOpacity>
            ) : categories.length === 0 ? <Text style={styles.hint}>Nenhuma categoria disponível.</Text> : null}
          </>
        )}

        <ItemFields key={category?.id} category={category?.id} value={details} onChange={setDetails} />
        <Text style={styles.label}>Quantidade inicial *{category ? ` (${category.measure_unity})` : ''}</Text>
        <TextInput accessibilityLabel="Quantidade inicial" style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="number-pad" maxLength={10} editable={!saving} />
        <Text style={styles.label}>Descrição</Text>
        <TextInput accessibilityLabel="Descrição" style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} maxLength={250} multiline editable={!saving} />
        <Text style={styles.label}>Nome do doador</Text>
        <TextInput accessibilityLabel="Nome do doador" style={styles.input} value={donor} onChangeText={setDonor} maxLength={90} editable={!saving} />
        <Text style={styles.label}>Tamanho</Text>
        <TextInput accessibilityLabel="Tamanho" style={styles.input} value={size} onChangeText={setSize} maxLength={20} editable={!saving} />
        <Text style={styles.label}>Gênero</Text>
        <TextInput accessibilityLabel="Gênero" style={styles.input} value={gender} onChangeText={setGender} maxLength={10} editable={!saving} />

        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" style={styles.cancel} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={[styles.submit, saving && styles.disabled]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Cadastrar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={selecting} transparent animationType="slide" onRequestClose={() => setSelecting(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <Text style={styles.heading}>Selecione uma categoria</Text>
            <ScrollView>
              {categories.map((item) => (
                <TouchableOpacity key={item.id} accessibilityRole="button" style={styles.option} onPress={() => { setCategory(item); setSelecting(false) }}>
                  <Text style={styles.value}>{item.name} ({item.measure_unity})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity accessibilityRole="button" style={styles.option} onPress={() => setSelecting(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  heading: { fontFamily: fontFamilies.semiBold, fontSize: 19, color: colors.text },
  hint: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.mutedText, marginTop: 8 },
  label: { fontFamily: fontFamilies.semiBold, fontSize: 14, color: colors.text, marginTop: 18, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border_input, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontFamily: fontFamilies.regular },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  select: { borderWidth: 1, borderColor: colors.border_input, borderRadius: 10, padding: 12 },
  value: { fontFamily: fontFamilies.regular, fontSize: 15, color: colors.text },
  placeholder: { fontFamily: fontFamilies.regular, fontSize: 15, color: colors.mutedText },
  error: { color: colors.danger, marginTop: 8, fontFamily: fontFamilies.regular },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancel: { flex: 1, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelText: { color: colors.primary, fontFamily: fontFamilies.semiBold, fontSize: 15 },
  submit: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  submitText: { color: colors.white, fontFamily: fontFamilies.semiBold, fontSize: 15 },
  disabled: { opacity: 0.6 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '75%' },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border_input },
})
