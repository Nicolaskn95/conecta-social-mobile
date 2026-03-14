import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ICategory } from '../types/donation'

const CACHE_KEY = 'categories_cache'
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 // 1 hour

type Cached = { categories: ICategory[]; savedAt: number }

export async function getCachedCategories(): Promise<ICategory[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: Cached = JSON.parse(raw)
    if (!parsed.categories || !Array.isArray(parsed.categories)) return null
    if (Date.now() - parsed.savedAt > CACHE_MAX_AGE_MS) return null
    return parsed.categories
  } catch {
    return null
  }
}

export async function setCachedCategories(categories: ICategory[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ categories, savedAt: Date.now() }))
}
