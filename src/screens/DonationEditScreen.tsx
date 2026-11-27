import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { DonationForm, useDonation } from '../components/DonationForm'
import { DonationImagePreview } from '../components/DonationImagePreview'
import { ItemFields } from '../components/DonationWorkflowFields'
import { env } from '../config/env'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { updateDonation, type DonationImagePick } from '../services/donationService'
import type { ItemDetails } from '../services/donationWorkflow'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Props = NativeStackScreenProps<DonationsStackParamList, 'DonationEdit'>

export function DonationEditScreen({ route, navigation }: Props) {
  const { donation, loading, reload } = useDonation(route.params.donationId)
  const [draft, setDraft] = useState<ItemDetails>()
  const [image, setImage] = useState<DonationImagePick | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const current: ItemDetails = {
    condition: donation?.condition,
    item_type_id: donation?.item_type_id,
    specifications: donation?.specifications,
  }
  const details = draft ?? current
  const patch: ItemDetails = {}
  if ((details.condition ?? null) !== (current.condition ?? null))
    patch.condition = details.condition ?? null
  if ((details.item_type_id ?? null) !== (current.item_type_id ?? null))
    patch.item_type_id = details.item_type_id ?? null
  if (
    details.specifications?.seat_width_cm !== current.specifications?.seat_width_cm ||
    details.specifications?.shoe_size_br !== current.specifications?.shoe_size_br
  )
    patch.specifications = details.specifications ?? null

  const hasChanges = Object.keys(patch).length > 0 || Boolean(image)

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos da galeria para escolher a foto.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    })
    const asset = result.assets?.[0]
    if (asset?.uri) {
      setImage({
        uri: asset.uri,
        name: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
        width: asset.width,
        height: asset.height,
      })
    }
  }

  async function save() {
    if (!donation || !hasChanges || saving) return
    if (
      Object.values(patch.specifications ?? {}).some(
        (value) => !Number.isFinite(value) || value <= 0
      )
    ) {
      setError('Informe uma medida maior que zero.')
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      const result = await updateDonation(donation.id, patch, image)
      if (result.donation) {
        navigation.goBack()
      } else {
        setError(result.errorMessage ?? 'Não foi possível salvar os detalhes.')
      }
    } finally {
      setSaving(false)
    }
  }

  const imageUri = image?.uri ?? donation?.image_url
  return (
    <DonationForm donation={donation} loading={loading} retry={reload}>
      {donation && (
        <>
          <ItemFields
            category={donation.category_id}
            value={details}
            onChange={setDraft}
            expanded
          />
          {env.imageUploadEnabled && (
            <View style={styles.photo}>
              <Text style={styles.label}>Foto do item</Text>
              {imageUri && (
                <DonationImagePreview
                  uri={imageUri}
                  imageContentType={image ? undefined : (donation.image_content_type ?? undefined)}
                />
              )}
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={pickPhoto}
                style={styles.outline}
              >
                <Text style={styles.link}>Escolher da galeria</Text>
              </Pressable>
              {image && (
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => setImage(null)}
                  style={styles.outline}
                >
                  <Text style={styles.link}>Descartar nova foto</Text>
                </Pressable>
              )}
            </View>
          )}
          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasChanges || saving, busy: saving }}
            disabled={!hasChanges || saving}
            onPress={save}
            style={[styles.save, !hasChanges && styles.disabled]}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} accessibilityLabel="Salvando detalhes" />
            ) : (
              <Text style={styles.saveText}>Salvar detalhes</Text>
            )}
          </Pressable>
        </>
      )}
    </DonationForm>
  )
}

const styles = StyleSheet.create({
  photo: { gap: 10, marginTop: 10 },
  label: { color: colors.text, fontFamily: fontFamilies.semiBold },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  link: { color: colors.primary, fontFamily: fontFamilies.semiBold },
  save: {
    backgroundColor: colors.primaryAction,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  saveText: { color: colors.white, fontFamily: fontFamilies.semiBold, fontSize: 15 },
  disabled: { opacity: 0.5 },
  error: { color: colors.danger, fontFamily: fontFamilies.regular, marginTop: 12 },
})
