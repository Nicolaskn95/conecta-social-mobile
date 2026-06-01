import AsyncStorage from '@react-native-async-storage/async-storage'

import { getDefaultApiBaseUrl } from './env'

const STORAGE_KEY = 'dev_api_base_url_override_v1'

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

let currentUrl = normalizeBaseUrl(getDefaultApiBaseUrl())

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* ignore */
    }
  })
}

export function getApiBaseUrl(): string {
  return currentUrl
}

export function subscribeApiBaseUrl(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function initRuntimeApiBaseUrl(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim()) {
      currentUrl = normalizeBaseUrl(stored)
    } else {
      currentUrl = normalizeBaseUrl(getDefaultApiBaseUrl())
    }
  } catch {
    currentUrl = normalizeBaseUrl(getDefaultApiBaseUrl())
  }
  notify()
}

export async function setPersistedApiBaseUrl(url: string): Promise<void> {
  const next = normalizeBaseUrl(url)
  currentUrl = next
  try {
    await AsyncStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* still use in-memory */
  }
  notify()
}

export async function clearPersistedApiBaseUrl(): Promise<void> {
  currentUrl = normalizeBaseUrl(getDefaultApiBaseUrl())
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  notify()
}
