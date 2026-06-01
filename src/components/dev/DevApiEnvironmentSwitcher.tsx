import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getDevApiEnvironmentPresets } from '../../config/apiEnvironments'
import {
  clearPersistedApiBaseUrl,
  getApiBaseUrl,
  setPersistedApiBaseUrl,
} from '../../config/runtimeApiBaseUrl'
import { loadDevFabPosition, saveDevFabPosition } from '../../storage/devFabPosition'
import { colors } from '../../theme/colors'
import { fontFamilies } from '../../theme/typography'

const FAB_MARGIN = 8
/** Movimento menor que isso abre o modal; acima disso só arrasta. */
const TAP_MAX_DISTANCE_PX = 14

const FAB_APPROX_W = 92
const FAB_APPROX_H = 46

function sameBase(a: string, b: string): boolean {
  return a.replace(/\/+$/, '') === b.replace(/\/+$/, '')
}

function clampFabJs(
  l: number,
  t: number,
  sw: number,
  sh: number,
  fw: number,
  fh: number,
  it: number,
  ib: number,
  il: number,
  ir: number
): { left: number; top: number } {
  const minL = FAB_MARGIN + il
  const minT = FAB_MARGIN + it
  const maxL = sw - fw - FAB_MARGIN - ir
  const maxT = sh - fh - FAB_MARGIN - ib
  return {
    left: Math.max(minL, Math.min(maxL, l)),
    top: Math.max(minT, Math.min(maxT, t)),
  }
}

function clampFabPosition(
  l: number,
  t: number,
  sw: number,
  sh: number,
  fw: number,
  fh: number,
  it: number,
  ib: number,
  il: number,
  ir: number
) {
  'worklet'
  const minL = FAB_MARGIN + il
  const minT = FAB_MARGIN + it
  const maxL = sw - fw - FAB_MARGIN - ir
  const maxT = sh - fh - FAB_MARGIN - ib
  return {
    left: Math.max(minL, Math.min(maxL, l)),
    top: Math.max(minT, Math.min(maxT, t)),
  }
}

function defaultFabLeft(sw: number, fw: number, insetR: number): number {
  return sw - fw - Math.max(insetR, 12) - FAB_MARGIN
}

function defaultFabTop(sh: number, fh: number, insetB: number): number {
  return sh - fh - Math.max(insetB, 12) - FAB_MARGIN
}

export function DevApiEnvironmentSwitcher() {
  const insets = useSafeAreaInsets()
  const { width: sw, height: sh } = useWindowDimensions()
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(getApiBaseUrl)

  const presets = useMemo(() => getDevApiEnvironmentPresets(), [])

  const displayPresets = useMemo(() => {
    if (presets.some((p) => sameBase(p.url, current))) return presets
    return [
      { id: 'persisted-custom', label: 'Salvo (fora da lista)', url: current },
      ...presets,
    ]
  }, [presets, current])

  const refreshCurrent = useCallback(() => {
    setCurrent(getApiBaseUrl())
  }, [])

  const handleOpen = useCallback(() => {
    refreshCurrent()
    setOpen(true)
  }, [refreshCurrent])

  const handlePick = useCallback(async (url: string) => {
    await setPersistedApiBaseUrl(url)
    refreshCurrent()
    setOpen(false)
  }, [refreshCurrent])

  const handleReset = useCallback(async () => {
    await clearPersistedApiBaseUrl()
    refreshCurrent()
    setOpen(false)
  }, [refreshCurrent])

  const left = useSharedValue(
    defaultFabLeft(Math.max(sw, 1), FAB_APPROX_W, insets.right)
  )
  const top = useSharedValue(defaultFabTop(Math.max(sh, 1), FAB_APPROX_H, insets.bottom))
  const fabW = useSharedValue(FAB_APPROX_W)
  const fabH = useSharedValue(FAB_APPROX_H)
  const screenW = useSharedValue(sw)
  const screenH = useSharedValue(sh)
  const insetTop = useSharedValue(insets.top)
  const insetBottom = useSharedValue(insets.bottom)
  const insetLeft = useSharedValue(insets.left)
  const insetRight = useSharedValue(insets.right)
  const startL = useSharedValue(0)
  const startT = useSharedValue(0)

  useEffect(() => {
    screenW.value = sw
    screenH.value = sh
    insetTop.value = insets.top
    insetBottom.value = insets.bottom
    insetLeft.value = insets.left
    insetRight.value = insets.right
  }, [sw, sh, insets])

  useEffect(() => {
    if (sw < 1 || sh < 1) return
    const c = clampFabJs(
      left.value,
      top.value,
      sw,
      sh,
      fabW.value,
      fabH.value,
      insets.top,
      insets.bottom,
      insets.left,
      insets.right
    )
    left.value = c.left
    top.value = c.top
  }, [sw, sh, insets, left, top, fabW, fabH])

  useEffect(() => {
    if (sw < 1 || sh < 1) return
    let cancelled = false
    void (async () => {
      const saved = await loadDevFabPosition()
      if (cancelled || !saved) return
      const c = clampFabJs(
        saved.left,
        saved.top,
        sw,
        sh,
        fabW.value,
        fabH.value,
        insets.top,
        insets.bottom,
        insets.left,
        insets.right
      )
      left.value = c.left
      top.value = c.top
    })()
    return () => {
      cancelled = true
    }
  }, [sw, sh, insets, left, top, fabW, fabH])

  const onTapOpen = useCallback(() => {
    handleOpen()
  }, [handleOpen])

  const onDragEndPersist = useCallback((l: number, t: number) => {
    void saveDevFabPosition({ left: l, top: t })
  }, [])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          startL.value = left.value
          startT.value = top.value
        })
        .onUpdate((e) => {
          const nl = startL.value + e.translationX
          const nt = startT.value + e.translationY
          const c = clampFabPosition(
            nl,
            nt,
            screenW.value,
            screenH.value,
            fabW.value,
            fabH.value,
            insetTop.value,
            insetBottom.value,
            insetLeft.value,
            insetRight.value
          )
          left.value = c.left
          top.value = c.top
        })
        .onEnd((e) => {
          const dist = Math.hypot(e.translationX, e.translationY)
          const l = left.value
          const t = top.value
          // Se foi só "toque" (sem arrastar), abre o modal.
          if (dist < TAP_MAX_DISTANCE_PX) {
            runOnJS(onTapOpen)()
            return
          }
          runOnJS(onDragEndPersist)(l, t)
        }),
    [onDragEndPersist, onTapOpen]
  )

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        runOnJS(onTapOpen)()
      }),
    [onTapOpen]
  )

  // Race evita conflito: o "tap" abre o modal sem depender do Pan.
  const gesture = useMemo(() => Gesture.Race(panGesture, tapGesture), [panGesture, tapGesture])

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    top: top.value,
    zIndex: 9999,
  }))

  const onFabLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout
      fabW.value = width
      fabH.value = height
      if (sw < 1 || sh < 1) return
      const c = clampFabJs(
        left.value,
        top.value,
        sw,
        sh,
        width,
        height,
        insets.top,
        insets.bottom,
        insets.left,
        insets.right
      )
      left.value = c.left
      top.value = c.top
    },
    [sw, sh, insets, left, top, fabW, fabH]
  )

  if (!__DEV__) return null

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          onLayout={onFabLayout}
          style={[styles.fab, fabAnimatedStyle]}
          accessibilityLabel="Arraste para mover. Toque sem arrastar para abrir o ambiente da API (desenvolvimento)."
        >
          <View style={styles.fabInner} pointerEvents="none">
            <Ionicons name="server-outline" size={22} color={colors.white} />
            <Text style={styles.fabLabel}>API</Text>
          </View>
        </Animated.View>
      </GestureDetector>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Ambiente da API (DEV)</Text>
            <Text style={styles.subtitle} numberOfLines={3}>
              Atual: {current}
            </Text>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              {displayPresets.map((p) => {
                const selected = sameBase(current, p.url)
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => void handlePick(p.url)}
                    style={[styles.row, selected && styles.rowSelected]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{p.label}</Text>
                      <Text style={styles.rowUrl} numberOfLines={2}>
                        {p.url}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={colors.mutedText} />
                    )}
                  </Pressable>
                )
              })}
            </ScrollView>

            <Pressable style={styles.btnSecondary} onPress={() => void handleReset()}>
              <Text style={styles.btnSecondaryText}>Usar só o padrão do .env</Text>
            </Pressable>
            <Pressable style={styles.btnClose} onPress={() => setOpen(false)}>
              <Text style={styles.btnCloseText}>Fechar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fabLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.white,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 52, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.mutedText,
  },
  list: {
    marginTop: 16,
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border_input,
    marginBottom: 8,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.header_sidebar_color,
  },
  rowText: {
    flex: 1,
    marginRight: 8,
  },
  rowLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.text,
  },
  rowUrl: {
    marginTop: 4,
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.mutedText,
  },
  btnSecondary: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
  btnClose: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnCloseText: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.mutedText,
  },
})
