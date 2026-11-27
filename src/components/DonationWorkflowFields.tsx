import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import {
  ItemDetails,
  ItemType,
  Mode,
  Need,
  Page,
  Recipient,
  workflow,
} from '../services/donationWorkflow'

export function Choice<T extends string>({
  label,
  items,
  value,
  onChange,
  disabled,
}: {
  label: string
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {items.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: value === item.value, disabled }}
            disabled={disabled}
            style={({ pressed }) => [
              styles.choice,
              value === item.value && styles.selected,
              pressed && styles.pressed,
            ]}
            onPress={() => onChange(item.value)}
          >
            {value === item.value && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            <Text style={[styles.ink, value === item.value && styles.selectedText]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function OptionalDetailsButton({
  title,
  subtitle,
  open,
  onPress,
}: {
  title: string
  subtitle: string
  open: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ expanded: open }}
      onPress={() => {
        Keyboard.dismiss()
        onPress()
      }}
      style={({ pressed }) => [
        styles.disclosure,
        open && styles.disclosureOpen,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.disclosureIcon}>
        <Ionicons name="options-outline" color={colors.primary} size={20} />
      </View>
      <View style={styles.disclosureCopy}>
        <Text style={styles.disclosureTitle}>{title}</Text>
        <Text style={styles.disclosureHint}>{subtitle}</Text>
      </View>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} color={colors.primary} size={20} />
    </Pressable>
  )
}

const conditions = [
  { value: '', label: 'Não informada' },
  { value: 'NEW', label: 'Novo' },
  { value: 'USED_GOOD', label: 'Usado em bom estado' },
  { value: 'REQUIRES_REVIEW', label: 'Conferir condição' },
] as const

export function donationConditionLabel(condition: ItemDetails['condition']) {
  return conditions.find((option) => option.value === condition)?.label ?? conditions[0].label
}

export function ItemFields({
  category,
  value,
  onChange,
  expanded = false,
}: {
  category?: string
  value: ItemDetails
  onChange: (value: ItemDetails) => void
  expanded?: boolean
}) {
  const [open, setOpen] = useState(false)
  const visible = expanded || open
  const [items, setItems] = useState<ItemType[]>([])
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const [entry, setEntry] = useState<string>()
  useEffect(() => {
    if (!visible || !category) return
    let active = true
    setItems([])
    setFailed(false)
    workflow<ItemType[]>('/item-types?category_id=' + category)
      .then((values) => {
        if (active) setItems(values)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [visible, category, reload])
  const code = items.find((item) => item.id === value.item_type_id)?.code
  const key = code === 'WHEELCHAIR' ? 'seat_width_cm' : code === 'SNEAKERS' ? 'shoe_size_br' : null
  return (
    <View style={styles.section}>
      {!expanded && (
        <OptionalDetailsButton
          title="Detalhes do item"
          subtitle="Opcional · Condição, tipo e medidas"
          open={open}
          onPress={() => setOpen((current) => !current)}
        />
      )}
      {visible && (
        <View style={styles.panel}>
          <Choice
            label="Condição"
            items={[...conditions]}
            value={value.condition ?? ''}
            onChange={(condition) => onChange({ ...value, condition: condition || null })}
          />
          {category && (
            <Choice
              label="Tipo de item"
              items={[
                { value: '', label: 'Não informado' },
                ...(value.item_type_id && !code
                  ? [{ value: value.item_type_id, label: 'Tipo cadastrado' }]
                  : []),
                ...items.map((item) => ({ value: item.id, label: item.name })),
              ]}
              value={value.item_type_id ?? ''}
              onChange={(id) => {
                if (id === (value.item_type_id ?? '')) return
                setEntry(undefined)
                onChange({ ...value, item_type_id: id || null, specifications: null })
              }}
            />
          )}
          {failed && (
            <Pressable accessibilityRole="button" onPress={() => setReload(reload + 1)}>
              <Text style={styles.ink}>Recarregar tipos</Text>
            </Pressable>
          )}
          {key && (
            <View style={styles.group}>
              <Text style={styles.label}>
                {key === 'shoe_size_br' ? 'Numeração brasileira' : 'Largura do assento (cm)'}
              </Text>
              <TextInput
                accessibilityLabel={
                  key === 'shoe_size_br'
                    ? 'Numeração brasileira'
                    : 'Largura do assento em centímetros'
                }
                keyboardType={key === 'shoe_size_br' ? 'number-pad' : 'decimal-pad'}
                style={styles.input}
                value={entry ?? String(value.specifications?.[key] ?? '')}
                onChangeText={(text) => {
                  if (!(key === 'shoe_size_br' ? /^\d*$/ : /^\d*(?:[.,]\d*)?$/).test(text)) return
                  setEntry(text)
                  onChange({
                    ...value,
                    specifications: text ? { [key]: Number(text.replace(',', '.')) } : null,
                  })
                }}
              />
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export function RecipientFields({
  family,
  value,
  onChange,
}: {
  family: string | null
  value: Recipient
  onChange: (value: Recipient) => void
}) {
  const [open, setOpen] = useState(false)
  const [catalog, setCatalog] = useState<ItemType[]>([])
  const [summary, setSummary] = useState<Need | null>(null)
  const [people, setPeople] = useState<{ id: string; name: string; surname: string }[]>([])
  const [needs, setNeeds] = useState<Need[]>([])
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    setPeople([])
    setNeeds([])
    setFailed(false)
    if (!family || !open) return
    let active = true
    setLoading(true)
    const path = '/needs?status=OPEN&size=100&family_id=' + family
    const requests = Promise.all([
      workflow<ItemType[]>('/item-types').catch(() => []),
      workflow<typeof people>('/beneficiaries?family_id=' + family),
      workflow<Page<Need>>(path).then(async (first) => {
        const pages = await Promise.all(
          Array.from({ length: Math.max(0, first.total_pages - 1) }, (_, index) =>
            workflow<Page<Need>>(path + '&page=' + (index + 2))
          )
        )
        return [...first.list, ...pages.flatMap((page) => page.list)]
      }),
    ])
    requests
      .then(([types, members, requests]) => {
        if (active) {
          setCatalog(types)
          setPeople(members)
          setNeeds(requests)
        }
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
  }, [family, open, reload])
  useEffect(() => {
    setSummary(null)
    if (!value.id_need || !open) return
    let active = true
    workflow<Need>('/needs/' + value.id_need)
      .then((need) => {
        if (active) setSummary(need)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [value.id_need, open])
  const filledDetails = [value.id_beneficiary, value.id_need, value.delivery_mode].filter(
    Boolean
  ).length
  return (
    <View style={styles.section}>
      <OptionalDetailsButton
        title="Detalhes da destinação"
        subtitle={
          filledDetails
            ? filledDetails === 1
              ? '1 opção preenchida'
              : `${filledDetails} opções preenchidas`
            : 'Opcional · Quem recebe, pedido e forma de recebimento'
        }
        open={open}
        onPress={() => setOpen((current) => !current)}
      />
      {open && (
        <View style={styles.panel}>
          {loading && (
            <Text accessibilityLiveRegion="polite" style={styles.disclosureHint}>
              Carregando pessoas e pedidos da família…
            </Text>
          )}
          {failed && (
            <Pressable onPress={() => setReload(reload + 1)} accessibilityRole="button">
              <Text style={styles.retry}>Recarregar pessoas e pedidos da família</Text>
            </Pressable>
          )}
          {family && (
            <>
              <Choice
                label="Quem vai receber?"
                items={[
                  { value: '', label: 'A família como um todo' },
                  ...people.map((p) => ({ value: p.id, label: p.name + ' ' + p.surname })),
                ]}
                value={value.id_beneficiary ?? ''}
                onChange={(id) =>
                  onChange({ ...value, id_beneficiary: id || undefined, id_need: undefined })
                }
              />
              <Choice
                label="Vincular a um pedido em aberto"
                items={[
                  { value: '', label: 'Sem pedido vinculado' },
                  ...needs.map((n) => ({
                    value: n.id,
                    label:
                      n.description ??
                      catalog.find((type) => type.id === n.item_type_id)?.name ??
                      'Pedido sem descrição',
                  })),
                ]}
                value={value.id_need ?? ''}
                onChange={(id) => {
                  const selected = needs.find((n) => n.id === id)
                  onChange({
                    ...value,
                    id_need: id || undefined,
                    id_beneficiary: selected
                      ? (selected.id_beneficiary ?? undefined)
                      : value.id_beneficiary,
                  })
                }}
              />
            </>
          )}
          {summary && (
            <Text>
              Quantidade pedida: {summary.requested_quantity ?? 'Não informada'} · Já separado:{' '}
              {summary.separated_quantity ?? 0}
            </Text>
          )}
          <Choice<Mode | ''>
            label="Como o item será recebido?"
            items={[
              { value: '', label: 'Decidir depois' },
              { value: 'PICKUP', label: 'Retirada pela família' },
              { value: 'DELIVERY', label: 'Entrega pelo projeto' },
            ]}
            value={value.delivery_mode ?? ''}
            onChange={(mode) => onChange({ ...value, delivery_mode: mode || undefined })}
          />
        </View>
      )}
    </View>
  )
}
const styles = StyleSheet.create({
  section: { gap: 8, marginVertical: 8 },
  disclosure: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tertiary,
    backgroundColor: '#F2F8FB',
  },
  disclosureOpen: { borderColor: colors.primary, backgroundColor: '#E8F3F8' },
  disclosureIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.header_sidebar_color,
  },
  disclosureCopy: { flex: 1, gap: 3 },
  disclosureTitle: { color: '#205475', fontFamily: fontFamilies.semiBold, fontSize: 14 },
  disclosureHint: { color: colors.mutedText, fontFamily: fontFamilies.regular, fontSize: 12 },
  panel: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
    padding: 12,
    gap: 14,
    backgroundColor: colors.white,
  },
  group: { gap: 6 },
  label: { color: colors.text, fontFamily: fontFamilies.semiBold, fontSize: 13 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 44,
    maxWidth: '100%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 8,
  },
  selected: { backgroundColor: '#E8F3F8', borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  ink: { color: '#205475', flexShrink: 1, fontFamily: fontFamilies.regular, fontSize: 13 },
  selectedText: { fontFamily: fontFamilies.semiBold },
  retry: { color: '#205475', paddingVertical: 8, fontFamily: fontFamilies.semiBold, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border_input,
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    color: colors.text,
  },
})
