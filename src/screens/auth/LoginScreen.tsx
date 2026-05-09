import { Ionicons } from '@expo/vector-icons'
import React, { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuth } from '../../auth/useAuth'
import { env } from '../../config/env'
import { api } from '../../services/api'
import { colors } from '../../theme/colors'
import { fontFamilies } from '../../theme/typography'

export function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { signInWithToken } = useAuth()
  const passwordRef = useRef<TextInput>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

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
      Alert.alert('Erro ao entrar', typeof msg === 'string' ? msg : 'Falha no login.')
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
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.titleBrand} allowFontScaling={false}>
            Conecta Social
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu e-mail"
            placeholderTextColor={colors.mutedText}
            style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
            returnKeyType="next"
            blurOnSubmit={false}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={[styles.label, styles.labelSpacing]}>Senha</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              placeholder="Digite sua senha"
              placeholderTextColor={colors.mutedText}
              style={[
                styles.input,
                styles.inputPassword,
                focusedField === 'password' && styles.inputFocused,
              ]}
              secureTextEntry={!showPassword}
              editable={!loading}
              returnKeyType="done"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              disabled={loading}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.btnPrimaryText}> Entrando...</Text>
              </View>
            ) : (
              <Text style={styles.btnPrimaryText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Esqueci minha senha',
                'Use o portal web ou fale com o administrador do sistema para redefinir sua senha.',
              )
            }
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ ? (
          <Text style={styles.devHint} numberOfLines={2}>
            {env.apiBaseUrl}
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleBrand: {
    fontFamily: fontFamilies.bold,
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
    color: colors.primary,
  },
  titleUnderline: {
    marginTop: 10,
    height: 4,
    width: 220,
    borderRadius: 2,
    backgroundColor: colors.secondary,
  },
  card: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 32,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  labelSpacing: {
    marginTop: 16,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border_input,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputPassword: {
    paddingRight: 44,
  },
  passwordWrap: {
    position: 'relative',
    width: '100%',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.secondary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimaryDisabled: {
    opacity: 0.5,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.white,
  },
  forgotWrap: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  forgotText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  devHint: {
    marginTop: 20,
    alignSelf: 'center',
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
    maxWidth: 448,
  },
})
