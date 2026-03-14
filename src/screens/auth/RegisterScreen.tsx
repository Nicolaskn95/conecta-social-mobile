import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { colors } from '../../theme/colors'
import { fontFamilies } from '../../theme/typography'

export function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Placeholder — vamos ligar na API depois.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
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
  },
})
