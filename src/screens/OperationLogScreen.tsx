import React, { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { DismissKeyboardOnTap } from '../components/DismissKeyboardOnTap'
import { saveLog } from '../storage/operationLogStorage'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

export function OperationLogScreen() {
  const [message, setMessage] = useState('')
  const [logType, setLogType] = useState<'triagem' | 'movimentacao'>('triagem')
  const [saving, setSaving] = useState(false)

  const handleRegister = async () => {
    if (!message.trim()) {
      Alert.alert('Campo obrigatório', 'Informe a mensagem do log.')
      return
    }
    setSaving(true)
    try {
      await saveLog({ type: logType, message: message.trim() })
      Alert.alert('Log registrado', 'Mensagem salva localmente.')
      setMessage('')
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o log.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <DismissKeyboardOnTap fill={false}>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.typeBtn, logType === 'triagem' && styles.typeBtnActive]}
            onPress={() => setLogType('triagem')}
            disabled={saving}
          >
            <Text style={[styles.typeBtnText, logType === 'triagem' && styles.typeBtnTextActive]}>
              Triagem
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, logType === 'movimentacao' && styles.typeBtnActive]}
            onPress={() => setLogType('movimentacao')}
            disabled={saving}
          >
            <Text
              style={[styles.typeBtnText, logType === 'movimentacao' && styles.typeBtnTextActive]}
            >
              Movimentação
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={message}
          onChangeText={setMessage}
          placeholder="Descreva o estado da triagem ou movimentação..."
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={4}
          editable={!saving}
        />
        <Text style={styles.hint}>Evento (opcional): em breve.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} disabled={saving}>
          <Text style={styles.btnPrimaryText}>{saving ? 'Salvando...' : 'Registrar log'}</Text>
        </TouchableOpacity>
      </DismissKeyboardOnTap>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 40 },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
  typeBtnTextActive: { color: colors.white },
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
  inputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  hint: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8,
  },
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
