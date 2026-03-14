import AsyncStorage from '@react-native-async-storage/async-storage'

const LOGS_KEY = 'operation_logs'

export interface OperationLogEntry {
  id: string
  type: 'triagem' | 'movimentacao'
  message: string
  eventId?: string | null
  createdAt: string
}

export async function saveLog(entry: Omit<OperationLogEntry, 'id' | 'createdAt'>): Promise<void> {
  const logs = await getLogs()
  const newEntry: OperationLogEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  }
  logs.unshift(newEntry)
  await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

export async function getLogs(): Promise<OperationLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOGS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
