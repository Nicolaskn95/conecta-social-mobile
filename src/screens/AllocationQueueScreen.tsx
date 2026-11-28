import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { DonationsStackParamList } from '../navigation/DonationsStack'
import { Choice } from '../components/DonationWorkflowFields'
import { ReceiptDateModal } from '../components/ReceiptDateModal'
import { Allocation, allocationLabel, Need, Page, workflow } from '../services/donationWorkflow'

export function AllocationQueueScreen() {
  const { params } = useRoute<RouteProp<DonationsStackParamList, 'AllocationQueue'>>()
  const scroll = useRef<ScrollView>(null)
  const [target, setTarget] = useState(params?.allocationId)
  const [waiting, setWaiting] = useState(true)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<Page<Allocation> | null>(null)
  const [targetDetail, setTargetDetail] = useState<Allocation | null>(null)
  const [selected, setSelected] = useState<Allocation | null>(null)
  const [action, setAction] = useState<'confirm-receipt' | 'cancel' | null>(null)
  const [keepOpen, setKeepOpen] = useState<'yes' | 'no'>('no')
  const [restock, setRestock] = useState<'yes' | 'no'>('yes')
  const [note, setNote] = useState('')
  const [need, setNeed] = useState<Need | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rows, detail] = await Promise.all([
        workflow<Page<Allocation>>(
          '/donations-to-family/paginated?page=' + page + (waiting ? '&status=WAITING_RECEIPT' : '')
        ),
        target ? workflow<Allocation>('/donations-to-family/' + target) : null,
      ])
      setTargetDetail(detail)
      setResult(rows)
    } catch {
      setError('Não foi possível carregar as destinações.')
    } finally {
      setLoading(false)
    }
  }, [page, waiting, target])
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load])
  )
  const needId = selected?.id_need
  useEffect(() => {
    if (!needId || action !== 'confirm-receipt') return
    let active = true
    workflow<Need>('/needs/' + needId)
      .then((value) => {
        if (active) setNeed(value)
      })
      .catch(() => {
        if (active)
          setError('Não foi possível carregar a necessidade. Tente abrir a confirmação novamente.')
      })
    return () => {
      active = false
    }
  }, [needId, action])
  function open(row: Allocation, kind: 'confirm-receipt' | 'cancel') {
    if (selected?.id === row.id && action === kind) return
    if (kind === 'cancel') scroll.current?.scrollTo({ y: 0, animated: true })
    setSelected(row)
    setAction(kind)
    setRestock('yes')
    setKeepOpen('no')
    setNote('')
    setNeed(null)
    setError('')
  }
  function close() {
    setAction(null)
    setError('')
  }
  async function save(receivedAt?: string) {
    if (saving || !selected || !action || (action === 'confirm-receipt' && !!needId && !need))
      return
    const body =
      action === 'cancel'
        ? { restock: restock === 'yes', note: note.trim() || undefined }
        : { ...(receivedAt ? { received_at: receivedAt } : {}), keep_need_open: keepOpen === 'yes' }
    setSaving(true)
    setError('')
    try {
      const updated = await workflow<Allocation>(
        '/donations-to-family/' + selected.id + '/' + action,
        'POST',
        body
      )
      setAction(null)
      await load()
      setMessage(allocationLabel(updated))
    } catch (cause) {
      const response = (cause as { response?: { status: number; data?: { message?: string } } })
        .response
      if (response?.status === 409) {
        const latest = await workflow<Allocation>('/donations-to-family/' + selected.id).catch(
          () => null
        )
        setAction(null)
        await load()
        if (latest) setMessage('Situação atual: ' + allocationLabel(latest))
      }
      setError(response?.data?.message ?? 'Não foi possível concluir. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }
  const rows =
    targetDetail?.id === target &&
    targetDetail &&
    (!waiting || targetDetail.status === 'WAITING_RECEIPT') &&
    !result?.list.some((x) => x.id === target)
      ? [targetDetail, ...(result?.list ?? [])]
      : (result?.list ?? [])
  return (
    <ScrollView
      ref={scroll}
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Choice
        label="Mostrar"
        items={[
          { value: 'pending', label: 'Aguardando recebimento' },
          { value: 'history', label: 'Histórico' },
        ]}
        value={waiting ? 'pending' : 'history'}
        onChange={(value) => {
          setAction(null)
          setTarget(undefined)
          setPage(1)
          setWaiting(value === 'pending')
        }}
      />
      {message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
      {error && action !== 'confirm-receipt' ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator accessibilityLabel="Carregando destinações" />
      ) : (
        <Action label="Atualizar lista" secondary onPress={load} />
      )}
      {!loading && !error && !rows.length && <Text>Nenhuma destinação encontrada.</Text>}
      {action === 'cancel' && selected && (
        <View style={styles.card}>
          <Text style={styles.heading}>Cancelar separação</Text>
          <Text>
            {selected.donation?.name} · {selected.family?.name}
          </Text>
          <Choice
            label="Destino do item"
            items={[
              { value: 'yes', label: 'Devolver ao estoque' },
              { value: 'no', label: 'Item indisponível para retorno' },
            ]}
            value={restock}
            onChange={setRestock}
          />
          <TextInput
            accessibilityLabel="Observação opcional"
            placeholder="Observação opcional"
            value={note}
            onChangeText={setNote}
            maxLength={250}
            style={styles.input}
          />
          <Action label="Confirmar" disabled={saving} onPress={() => void save()} />
          <Action label="Voltar" secondary disabled={saving} onPress={close} />
        </View>
      )}
      {rows.map((row) => (
        <View style={styles.card} key={row.id}>
          <Text style={styles.heading}>
            {row.donation?.name ?? 'Doação'} · {row.quantity}{' '}
            {row.donation?.category?.measure_unity}
          </Text>
          <Text>
            {row.family?.name ?? 'Família'}
            {row.beneficiary ? ' · ' + row.beneficiary.name + ' ' + row.beneficiary.surname : ''}
          </Text>
          <Text>{allocationLabel(row)}</Text>
          {row.separated_at && (
            <Text>Separado em {new Date(row.separated_at).toLocaleDateString('pt-BR')}</Text>
          )}
          {row.received_at && (
            <Text>Recebido em {row.received_at.slice(0, 10).split('-').reverse().join('/')}</Text>
          )}
          {row.confirmed_at && (
            <Text>Registrado em {new Date(row.confirmed_at).toLocaleString('pt-BR')}</Text>
          )}
          {(row.family?.active === false ||
            row.donation?.active === false ||
            row.beneficiary?.active === false) && <Text>Vínculo desativado</Text>}
          {(row.status === 'WAITING_RECEIPT' || row.status === 'UNKNOWN') && (
            <Action
              label="Confirmar recebimento"
              disabled={saving}
              onPress={() => open(row, 'confirm-receipt')}
            />
          )}
          {row.status === 'WAITING_RECEIPT' && (
            <Action
              label="Cancelar separação"
              secondary
              disabled={saving}
              onPress={() => open(row, 'cancel')}
            />
          )}
        </View>
      ))}
      {(page > 1 || (result?.total_pages ?? 0) > 1) && (
        <View style={styles.pagination}>
          <Action label="Anterior" disabled={page <= 1} onPress={() => setPage(page - 1)} />
          <Text>Página {page}</Text>
          <Action
            label="Próxima"
            disabled={page >= (result?.total_pages ?? 1)}
            onPress={() => setPage(page + 1)}
          />
        </View>
      )}
      {action === 'confirm-receipt' && selected && (
        <ReceiptDateModal
          key={selected.id}
          recipient={[selected.donation?.name, selected.family?.name].filter(Boolean).join(' · ')}
          onConfirm={(date) => void save(date)}
          onClose={close}
          disabled={saving || (!!needId && !need)}
          saving={saving}
          error={error}
        >
          {needId && !need && !error && (
            <ActivityIndicator accessibilityLabel="Carregando necessidade" />
          )}
          {need?.requested_quantity === null && (
            <Choice
              label="Necessidade"
              items={[
                { value: 'no', label: 'Concluir' },
                { value: 'yes', label: 'Manter aberta' },
              ]}
              value={keepOpen}
              onChange={setKeepOpen}
              disabled={saving}
            />
          )}
        </ReceiptDateModal>
      )}
    </ScrollView>
  )
}
function Action({
  label,
  onPress,
  disabled,
  secondary,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  screen: { backgroundColor: '#F3F6FA' },
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, gap: 8 },
  heading: { fontWeight: '700', color: '#182C48' },
  button: {
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: '#E0EEFF',
  },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D9E2EC' },
  buttonText: { color: '#163D67', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  input: { padding: 10, borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 8 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { color: '#9F2323' },
})
