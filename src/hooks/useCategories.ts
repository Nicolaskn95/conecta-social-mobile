import { useCallback, useEffect, useState } from 'react'
import type { ICategory } from '../types/donation'
import { getCategories } from '../services/categoryService'
import { getCachedCategories, setCachedCategories } from '../storage/categoryCache'

export function useCategories(): {
  categories: ICategory[]
  loading: boolean
  refetch: () => Promise<void>
} {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cached = await getCachedCategories()
      if (cached?.length) setCategories(cached)
      const fresh = await getCategories()
      if (fresh.length) {
        setCategories(fresh)
        await setCachedCategories(fresh)
      }
    } catch {
      const cached = await getCachedCategories()
      if (cached?.length) setCategories(cached)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, refetch: load }
}
