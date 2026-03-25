import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { DismissKeyboardOnTap } from '../../components/DismissKeyboardOnTap'
import { env } from '../../config/env'
import { useAuth } from '../../auth/useAuth'
import { api } from '../../services/api'
import { colors } from '../../theme/colors'
import { fontFamilies } from '../../theme/typography'

/** Usuário mock para acesso rápido à plataforma (dev/demo). */
const MOCK_USER = {
  email: 'admin@conecta.com',
  password: 'admin123',
}

export function LoginScreen() {
  const { signInWithToken } = useAuth()
  const passwordRef = useRef<TextInput>(null)
  const [email, setEmail] = useState(MOCK_USER.email)
  const [password, setPassword] = useState(MOCK_USER.password)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const emailTrim = email.trim()
    const passwordTrim = password.trim()
    if (!emailTrim || !passwordTrim) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post<{
        data?: { access_token: string }
        access_token?: string
      }>('/auth/login', {
        email: emailTrim,
        password: passwordTrim,
      })
      const token = data.data?.access_token ?? (data as { access_token?: string }).access_token
      if (!token) {
        Alert.alert('Erro', 'Resposta da API sem token.')
        return
      }
      await signInWithToken(token)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Verifique a URL da API (EXPO_PUBLIC_API_URL) e tente novamente.'
      Alert.alert('Erro ao entrar', msg ?? 'Falha no login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <DismissKeyboardOnTap style={styles.inner}>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Conecte-se ao backend com e-mail e senha.</Text>
        <Text style={styles.apiUrl} numberOfLines={1}>
          API: {env.apiBaseUrl}
        </Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          ref={passwordRef}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          secureTextEntry
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.btnPrimaryText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </DismissKeyboardOnTap>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
    marginBottom: 8,
  },
  apiUrl: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 24,
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
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    marginTop: 6,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 24,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.white,
  },
})
