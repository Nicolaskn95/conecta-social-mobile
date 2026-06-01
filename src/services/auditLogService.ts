import { api } from './api'

export type AuditEntityType = 'DONATION' | 'DONATION_TO_FAMILY' | 'FAMILY' | 'EVENT'

export interface IAuditLog {
  id: string
  message: string
  entityType: AuditEntityType | string
  actionType?: string | null
  actorRole?: string | null
  createdAt: string
}

type UnknownRecord = Record<string, unknown>

type ApiWrappedList = {
  data?: unknown
  list?: unknown
  items?: unknown
}

type AuditLogApiItem = {
  id?: unknown
  message?: unknown
  entity_type?: unknown
  entityType?: unknown
  action_type?: unknown
  actionType?: unknown
  actor_role?: unknown
  actorRole?: unknown
  created_at?: unknown
  createdAt?: unknown
}

function asObject(value: unknown): UnknownRecord | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as UnknownRecord
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const obj = asObject(value)
  if (!obj) return []
  const wrapped = obj as ApiWrappedList
  if (Array.isArray(wrapped.data)) return wrapped.data
  if (Array.isArray(wrapped.list)) return wrapped.list
  if (Array.isArray(wrapped.items)) return wrapped.items
  return []
}

function normalizeAuditLog(value: unknown): IAuditLog | null {
  const item = asObject(value) as AuditLogApiItem | null
  if (!item) return null

  const id = typeof item.id === 'string' ? item.id : undefined
  const message = typeof item.message === 'string' ? item.message : undefined
  const createdAtRaw =
    typeof item.created_at === 'string'
      ? item.created_at
      : typeof item.createdAt === 'string'
        ? item.createdAt
        : undefined
  const entityTypeRaw =
    typeof item.entity_type === 'string'
      ? item.entity_type
      : typeof item.entityType === 'string'
        ? item.entityType
        : undefined

  if (!id || !message || !createdAtRaw || !entityTypeRaw) return null

  const actionType =
    typeof item.action_type === 'string'
      ? item.action_type
      : typeof item.actionType === 'string'
        ? item.actionType
        : null

  const actorRole =
    typeof item.actor_role === 'string'
      ? item.actor_role
      : typeof item.actorRole === 'string'
        ? item.actorRole
        : null

  return {
    id,
    message,
    createdAt: createdAtRaw,
    entityType: entityTypeRaw,
    actionType,
    actorRole,
  }
}

export async function getAuditLogs(): Promise<IAuditLog[]> {
  const res = await api.get<unknown>('/audit-logs')
  const list = asArray(res.data)
  return list
    .map(normalizeAuditLog)
    .filter((item): item is IAuditLog => item !== null)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}
