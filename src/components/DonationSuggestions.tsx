import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  emptyRecommendations,
  getRecommendations,
  suggestionDetails,
  type Suggestion,
} from '../services/recommendations'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

export function DonationSuggestions({
  donationId,
  initialOpen,
  disabled,
  revision,
  onSelect,
}: {
  donationId: string
  initialOpen: boolean
  disabled: boolean
  revision: number
  onSelect: (suggestion: Suggestion) => void
}) {
  const [open, setOpen] = useState(initialOpen)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState<Awaited<ReturnType<typeof getRecommendations>>>()
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!open) return
      let active = true
      setLoading(true)
      setFailed(false)
      setResult(undefined)
      getRecommendations(donationId)
        .then((data) => {
          if (active) setResult(data)
        })
        .catch(() => {
          if (active) setFailed(true)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
      return () => {
        active = false
      }
    }, [donationId, open, retry, revision])
  )

  return (
    <View style={styles.panel}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.toggle}
      >
        <Text style={styles.link}>
          {open ? 'Recolher sugestões' : 'Ver sugestões de destinatários'}
        </Text>
      </Pressable>
      {open && (
        <>
          {loading && <ActivityIndicator accessibilityLabel="Buscando pedidos em aberto" />}
          {failed && (
            <>
              <Text accessibilityRole="alert" style={styles.text}>
                Não foi possível consultar as sugestões.
              </Text>
              <Pressable
                accessibilityRole="button"
                style={styles.toggle}
                onPress={() => setRetry((value) => value + 1)}
              >
                <Text style={styles.link}>Tentar novamente</Text>
              </Pressable>
            </>
          )}
          {result && result.status !== 'OK' && (
            <Text style={styles.text}>{emptyRecommendations[result.status]}</Text>
          )}
          {!loading &&
            result?.suggestions.map((item) => (
              <View key={item.id_need} style={styles.card}>
                <Text style={styles.title}>
                  {item.family_name}
                  {item.beneficiary_name ? ' · ' + item.beneficiary_name : ''}
                </Text>
                <Text style={styles.text}>{item.need_label}</Text>
                <Text style={item.classification === 'REVIEW' ? styles.review : styles.link}>
                  {item.classification === 'REVIEW'
                    ? 'A conferir'
                    : 'Compatível pelos dados registrados'}
                </Text>
                <Text style={styles.text}>{suggestionDetails(item).join(' ')}</Text>
                {item.max_separable_quantity != null && (
                  <Text style={styles.text}>
                    Saldo do pedido: {item.remaining_quantity} · Pode separar até{' '}
                    {item.max_separable_quantity} {result.unit}
                  </Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={disabled}
                  style={[styles.use, disabled && { opacity: 0.5 }]}
                  onPress={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  <Text style={styles.useText}>Usar esta sugestão</Text>
                </Pressable>
              </View>
            ))}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { backgroundColor: '#EEF5F8', borderRadius: 12, padding: 12, gap: 8, marginBottom: 16 },
  toggle: { minHeight: 44, justifyContent: 'center' },
  card: {
    borderColor: colors.tertiary,
    borderWidth: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  title: { color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 15 },
  text: { color: colors.mutedText, fontFamily: fontFamilies.regular, fontSize: 13 },
  link: { color: colors.primaryAction, fontFamily: fontFamilies.semiBold, fontSize: 14 },
  review: { color: '#805412', fontFamily: fontFamilies.semiBold, fontSize: 14 },
  use: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAction,
    borderRadius: 8,
    padding: 8,
  },
  useText: { color: colors.white, fontFamily: fontFamilies.semiBold },
})
