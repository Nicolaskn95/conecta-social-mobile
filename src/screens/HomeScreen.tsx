import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const sections: { title: string; body: string }[] = [
  {
    title: 'Nosso objetivo',
    body:
      'O Conecta Social existe para apoiar organizações e voluntários que trabalham com doações: ' +
      'centralizar informações, dar transparência às movimentações e tornar mais simples a operação em campo ' +
      'e a gestão do estoque.',
  },
  {
    title: 'Para quem é este aplicativo',
    body:
      'É voltado a quem participa da arrecadação, triagem e distribuição de itens, além de quem precisa ' +
      'acompanhar eventos e manter o inventário alinhado à realidade do dia a dia.',
  },
]

const highlights: string[] = [
  'Gestão de doações e inventário',
  'Eventos de arrecadação',
  'Registro de triagem e movimentação (logs)',
  'Conta e perfil do usuário',
]

export function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="auto" />
      <Text style={styles.brand}>Conecta Social</Text>
      <Text style={styles.tagline}>Operação de campo e gestão de estoque</Text>

      {sections.map(({ title, body }) => (
        <View key={title} style={styles.section}>
          <View style={styles.sectionAccent} />
          <View style={styles.sectionBody}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.paragraph}>{body}</Text>
          </View>
        </View>
      ))}

      <View style={styles.highlightsBox}>
        <Text style={styles.highlightsTitle}>O que você encontra aqui</Text>
        {highlights.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerHint}>
        Use a barra de navegação inferior para acessar cada área do aplicativo.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
  brand: {
    fontFamily: fontFamilies.bold,
    fontSize: 26,
    color: colors.text,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.mutedText,
    marginBottom: 28,
    lineHeight: 22,
  },
  section: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  sectionAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 14,
  },
  sectionBody: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 17,
    color: colors.primary,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },
  highlightsBox: {
    borderWidth: 1,
    borderColor: colors.tertiary,
    borderRadius: 12,
    padding: 18,
    marginTop: 4,
    marginBottom: 20,
    backgroundColor: colors.header_sidebar_color,
  },
  highlightsTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    color: colors.primary,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.mutedText,
    lineHeight: 22,
  },
  footerHint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    lineHeight: 20,
    fontStyle: 'italic',
  },
})
