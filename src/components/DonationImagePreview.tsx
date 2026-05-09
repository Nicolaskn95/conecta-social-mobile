import { Image as ExpoImage } from 'expo-image'
import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { SvgUri } from 'react-native-svg'

import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const PREVIEW_H = 200
const horizontalPad = 48

function isLocalAssetUri(uri: string) {
  return uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph://')
}

function isSvgRemote(uri: string, contentType?: string | null) {
  if (isLocalAssetUri(uri)) return false
  if (contentType?.toLowerCase().includes('svg')) return true
  try {
    const path = new URL(uri).pathname.toLowerCase()
    return path.endsWith('.svg')
  } catch {
    const base = uri.split('?')[0]?.toLowerCase() ?? ''
    return base.endsWith('.svg') || base.includes('.svg')
  }
}

type Props = {
  uri: string
  /** Vindo da API (`image_content_type`), ajuda a detectar SVG em URLs sem `.svg` no path */
  imageContentType?: string | null
}

/**
 * `Image` do RN não exibe SVG remoto. Para `image/svg+xml` ou URL `.svg` usamos `SvgUri`.
 */
export function DonationImagePreview({ uri, imageContentType }: Props) {
  const w = Math.max(1, Dimensions.get('window').width - horizontalPad)

  if (isSvgRemote(uri, imageContentType)) {
    return (
      <View style={styles.svgWrap}>
        <SvgUri
          uri={uri}
          width={w}
          height={PREVIEW_H}
          onError={() => undefined}
          fallback={<Text style={styles.fallback}>Não foi possível exibir o SVG.</Text>}
        />
      </View>
    )
  }

  return (
    <ExpoImage
      source={{ uri }}
      style={styles.raster}
      contentFit="cover"
      accessibilityIgnoresInvertColors
      {...(__DEV__
        ? {
            onError: (e: { error: string }) => {
              // eslint-disable-next-line no-console
              console.warn('[DonationImagePreview] raster load failed', e.error, uri.slice(0, 120))
            },
          }
        : {})}
    />
  )
}

const styles = StyleSheet.create({
  svgWrap: {
    width: '100%',
    height: PREVIEW_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raster: {
    width: '100%',
    height: PREVIEW_H,
    borderRadius: 10,
    backgroundColor: colors.tertiary,
  },
  fallback: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.mutedText,
    padding: 12,
    textAlign: 'center',
  },
})
