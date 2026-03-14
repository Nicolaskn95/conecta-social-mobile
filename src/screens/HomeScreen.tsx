import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import type { MainTabsParamList } from '../navigation/MainTabs'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Nav = BottomTabNavigationProp<MainTabsParamList, 'Home'>

const cards: { key: keyof MainTabsParamList; title: string; subtitle: string }[] = [
  { key: 'Donations', title: 'Doações', subtitle: 'Listar e atualizar inventário' },
  { key: 'Events', title: 'Eventos', subtitle: 'Ver eventos de arrecadação' },
  { key: 'Logs', title: 'Registrar log', subtitle: 'Triagem e movimentação' },
  { key: 'Profile', title: 'Perfil', subtitle: 'Conta e sair' },
]

export function HomeScreen() {
  const navigation = useNavigation<Nav>()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="auto" />
      <Text style={styles.title}>Conecta Social</Text>
      <Text style={styles.subtitle}>Operação de campo e gestão de estoque</Text>
      {cards.map(({ key, title, subtitle }) => (
        <TouchableOpacity
          key={key}
          style={styles.card}
          onPress={() => navigation.navigate(key)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    color: colors.primary,
  },
  cardSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
  },
})
