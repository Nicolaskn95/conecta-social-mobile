import { useState, type ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const monthName = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const dateName = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function ReceiptDateModal({
  recipient,
  onConfirm,
  onClose,
  disabled,
  saving,
  error,
  children,
}: {
  recipient: string
  onConfirm: (date?: string) => void
  onClose: () => void
  disabled: boolean
  saving: boolean
  error: string
  children?: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const [month, setMonth] = useState(() => {
    const today = new Date()
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1))
  })
  const [selected, setSelected] = useState<Date>()
  const year = month.getUTCFullYear()
  const monthIndex = month.getUTCMonth()
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const offset = month.getUTCDay()
  const today = new Date()
  const todayTimestamp = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <Modal visible transparent animationType="slide" onRequestClose={saving ? () => {} : onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(20, insets.bottom) }]}
          >
            <View style={styles.header}>
              <View style={styles.titleBlock}>
                <Text accessibilityRole="header" style={styles.title}>
                  Data do recebimento
                </Text>
                <Text style={styles.recipient}>{recipient}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar confirmação"
                disabled={saving}
                onPress={onClose}
                style={styles.iconButton}
              >
                <Ionicons name="close" size={23} color={colors.primaryAction} />
              </Pressable>
            </View>
            <Text style={styles.hint}>
              Selecione o dia em que o item foi recebido ou confirme sem informar a data.
            </Text>
            <View style={styles.calendar}>
              <View style={styles.monthRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Mês anterior"
                  disabled={saving}
                  onPress={() => setMonth(new Date(Date.UTC(year, monthIndex - 1, 1)))}
                  style={styles.iconButton}
                >
                  <Ionicons name="chevron-back" size={21} color={colors.primaryAction} />
                </Pressable>
                <Text accessibilityLiveRegion="polite" style={styles.month}>
                  {monthName.format(month)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Próximo mês"
                  disabled={saving}
                  onPress={() => setMonth(new Date(Date.UTC(year, monthIndex + 1, 1)))}
                  style={styles.iconButton}
                >
                  <Ionicons name="chevron-forward" size={21} color={colors.primaryAction} />
                </Pressable>
              </View>
              <View style={styles.grid}>
                {weekdays.map((day) => (
                  <Text key={day} style={[styles.cell, styles.weekday]}>
                    {day}
                  </Text>
                ))}
                {Array.from({ length: offset }, (_, index) => (
                  <View key={'offset-' + index} style={styles.cell} />
                ))}
                {Array.from({ length: days }, (_, index) => {
                  const date = new Date(Date.UTC(year, monthIndex, index + 1))
                  const active = selected?.valueOf() === date.valueOf()
                  const isToday = date.valueOf() === todayTimestamp
                  return (
                    <Pressable
                      key={index}
                      accessibilityRole="button"
                      accessibilityLabel={dateName.format(date)}
                      accessibilityState={{ selected: active, disabled: saving }}
                      disabled={saving}
                      onPress={() => setSelected(date)}
                      style={({ pressed }) => [styles.cell, styles.day, pressed && styles.pressed]}
                    >
                      <View
                        style={[styles.dayCircle, isToday && styles.today, active && styles.active]}
                      >
                        <Text style={[styles.dayText, active && styles.activeText]}>
                          {index + 1}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
            {children}
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}
            {selected && (
              <Text accessibilityLiveRegion="polite" style={styles.selection}>
                Data selecionada: {dateName.format(selected)}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: disabled || !selected, busy: saving }}
              disabled={disabled || !selected}
              onPress={() => selected && onConfirm(selected.toISOString())}
              style={[styles.confirm, (disabled || !selected) && !saving && styles.disabled]}
            >
              <Text
                style={[
                  styles.confirmText,
                  (disabled || !selected) && !saving && styles.disabledText,
                ]}
              >
                Confirmar com data
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled, busy: saving }}
              disabled={disabled}
              onPress={() => onConfirm()}
              style={[styles.skip, disabled && !saving && styles.disabled]}
            >
              <Text style={styles.skipText}>Confirmar sem data</Text>
            </Pressable>
            {saving && (
              <ActivityIndicator
                color={colors.primary}
                accessibilityLabel="Confirmando recebimento"
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 52, 0.42)',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '100%',
    flexShrink: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  content: { padding: 20, gap: 12 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  titleBlock: { flex: 1, gap: 4 },
  title: { fontFamily: fontFamilies.semiBold, fontSize: 20, color: colors.text },
  recipient: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.mutedText },
  hint: { fontFamily: fontFamilies.regular, fontSize: 13, lineHeight: 19, color: colors.mutedText },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F8FB',
  },
  calendar: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 14,
    padding: 6,
    gap: 4,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  month: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamilies.semiBold,
    color: colors.text,
    fontSize: 15,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%' },
  weekday: {
    fontSize: 11,
    color: colors.mutedText,
    fontFamily: fontFamilies.semiBold,
    textAlign: 'center',
    paddingVertical: 8,
  },
  day: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  dayCircle: {
    borderRadius: 14,
    minWidth: 32,
    minHeight: 32,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  today: { backgroundColor: '#EEF5F8' },
  active: { backgroundColor: colors.primaryAction },
  pressed: { opacity: 0.65 },
  dayText: { fontFamily: fontFamilies.semiBold, color: colors.text, fontSize: 13 },
  activeText: { color: colors.white },
  selection: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.mutedText },
  error: { color: colors.danger, fontFamily: fontFamilies.regular, fontSize: 13 },
  confirm: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.primaryAction,
    borderRadius: 10,
  },
  confirmText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    textAlign: 'center',
    color: colors.white,
  },
  disabled: { backgroundColor: '#E5EBF1', borderColor: '#E5EBF1' },
  disabledText: { color: colors.mutedText },
  skip: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.tertiary,
    borderRadius: 10,
  },
  skipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    textAlign: 'center',
    color: colors.primaryAction,
  },
})
