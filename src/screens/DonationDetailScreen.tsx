import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { DonationForm, useDonation } from '../components/DonationForm'
import { DonationImagePreview } from '../components/DonationImagePreview'
import { donationConditionLabel } from '../components/DonationWorkflowFields'
import { env } from '../config/env'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Props = NativeStackScreenProps<DonationsStackParamList, 'DonationDetail'>

export function DonationDetailScreen({ route, navigation }: Props) {
  const { donationId } = route.params
  const { donation, loading, reload } = useDonation(donationId)
  const stock = donation?.current_quantity ?? 0
  const canAllocate = stock > 0 && donation?.active !== false

  return (
    <DonationForm donation={donation} loading={loading} retry={reload}>
      {donation && (
        <>
          {donation.category?.name && <Text style={styles.category}>{donation.category.name}</Text>}
          <View style={styles.summary}>
            <View>
              <Text style={styles.label}>Estoque disponível</Text>
              <Text style={styles.quantity}>
                {stock} {donation.category?.measure_unity}
              </Text>
            </View>
            <View>
              <Text style={styles.label}>Condição</Text>
              <Text style={styles.value}>{donationConditionLabel(donation.condition)}</Text>
            </View>
            {donation.donator_name && (
              <View>
                <Text style={styles.label}>Doador</Text>
                <Text style={styles.value}>{donation.donator_name}</Text>
              </View>
            )}
          </View>
          {donation.description && <Text style={styles.description}>{donation.description}</Text>}
          {env.imageUploadEnabled && donation.image_url && (
            <DonationImagePreview
              uri={donation.image_url}
              imageContentType={donation.image_content_type ?? undefined}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAllocate }}
            disabled={!canAllocate}
            style={[styles.primary, !canAllocate && styles.disabled]}
            onPress={() => navigation.navigate('DonationAllocate', { donationId })}
          >
            <Text style={styles.primaryText}>
              {canAllocate ? 'Separar para a família' : 'Sem estoque para separar'}
            </Text>
          </Pressable>
          <View style={styles.actions}>
            {canAllocate && (
              <Pressable
                accessibilityRole="button"
                style={styles.action}
                onPress={() =>
                  navigation.navigate('DonationAllocate', { donationId, showSuggestions: true })
                }
              >
                <Ionicons name="people-outline" color={colors.primary} size={21} />
                <Text style={styles.actionText}>Ver sugestões de destinatários</Text>
                <Ionicons name="chevron-forward" color={colors.mutedText} size={18} />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              style={styles.action}
              onPress={() => navigation.navigate('DonationEdit', { donationId })}
            >
              <Ionicons name="create-outline" color={colors.primary} size={21} />
              <Text style={styles.actionText}>Editar detalhes</Text>
              <Ionicons name="chevron-forward" color={colors.mutedText} size={18} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.action}
              onPress={() => navigation.navigate('DonationStock', { donationId })}
            >
              <Ionicons name="cube-outline" color={colors.primary} size={21} />
              <Text style={styles.actionText}>Ajustar estoque</Text>
              <Ionicons name="chevron-forward" color={colors.mutedText} size={18} />
            </Pressable>
          </View>
        </>
      )}
    </DonationForm>
  )
}

const styles = StyleSheet.create({
  category: { color: colors.mutedText, fontFamily: fontFamilies.regular, marginBottom: 16 },
  summary: {
    backgroundColor: colors.white,
    borderColor: colors.border_input,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  label: { color: colors.mutedText, fontFamily: fontFamilies.regular, fontSize: 13 },
  quantity: { color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 23, marginTop: 3 },
  value: { color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 15, marginTop: 3 },
  description: { color: colors.text, fontFamily: fontFamilies.regular, marginTop: 12 },
  primary: {
    backgroundColor: colors.primaryAction,
    minHeight: 48,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryText: {
    color: colors.white,
    fontFamily: fontFamilies.semiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  disabled: { opacity: 0.55 },
  actions: { marginTop: 12, gap: 8 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.border_input,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 48,
    padding: 12,
  },
  actionText: { flex: 1, color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 15 },
})
