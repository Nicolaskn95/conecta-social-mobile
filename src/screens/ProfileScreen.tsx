import React from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useAuth } from '../auth/useAuth'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

export function ProfileScreen() {
  const { signOut } = useAuth()

  const handleSignOut = () => {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Usuário logado</Text>
      <TouchableOpacity style={styles.btnDanger} onPress={handleSignOut}>
        <Text style={styles.btnDangerText}>Sair</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 8,
  },
  btnDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDangerText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.white,
  },
})
