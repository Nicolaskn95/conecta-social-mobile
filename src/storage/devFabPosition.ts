import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'dev_api_fab_position_v1'

export type DevFabPosition = { left: number; top: number }

export async function loadDevFabPosition(): Promise<DevFabPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    if (
      !data ||
      typeof data !== 'object' ||
      typeof (data as DevFabPosition).left !== 'number' ||
      typeof (data as DevFabPosition).top !== 'number'
    ) {
      return null
    }
    return { left: (data as DevFabPosition).left, top: (data as DevFabPosition).top }
  } catch {
    return null
  }
}

export async function saveDevFabPosition(pos: DevFabPosition): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    /* ignore */
  }
}
