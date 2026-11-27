import { useCallback, useState, type ReactNode } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useHeaderHeight } from '@react-navigation/elements'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getDonationById } from '../services/donationService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import type { IDonation } from '../types/donation'

export function useDonation(donationId: string) {
  const [donation, setDonation] = useState<IDonation | null>(null)
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState(0)
  useFocusEffect(
    useCallback(() => {
      let active = true
      setLoading(true)
      void getDonationById(donationId).then((result) => {
        if (!active) return
        setDonation(result)
        setLoading(false)
      })
      return () => {
        active = false
      }
    }, [donationId, request])
  )
  return { donation, setDonation, loading, reload: () => setRequest((value) => value + 1) }
}

export function DonationForm({
  donation,
  loading,
  retry,
  children,
}: {
  donation: IDonation | null
  loading: boolean
  retry: () => void
  children: ReactNode
}) {
  const headerHeight = useHeaderHeight()
  if (!donation) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando doação" />
        ) : (
          <>
            <Text>Não foi possível carregar a doação.</Text>
            <Pressable accessibilityRole="button" onPress={retry}>
              <Text style={styles.retry}>Tentar novamente</Text>
            </Pressable>
          </>
        )}
      </View>
    )
  }
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text accessibilityRole="header" style={styles.title}>
          {donation.name}
        </Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  retry: { color: colors.primary, padding: 8, fontFamily: fontFamilies.semiBold },
  title: { color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 20, marginBottom: 12 },
})
