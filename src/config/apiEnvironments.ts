import { getDefaultApiBaseUrl } from './env'

export type ApiEnvironmentPreset = {
  id: string
  label: string
  url: string
}

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

function slugId(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `env-${index}`
}

/**
 * Formato: `Nome|https://api...,Outro|http://10.0.2.2:3001`
 * (vírgula separa presets; `|` separa rótulo e URL).
 */
function parsePresetsLine(line: string): ApiEnvironmentPreset[] {
  const parts = line.split(',').map((p) => p.trim()).filter(Boolean)
  const out: ApiEnvironmentPreset[] = []
  for (let i = 0; i < parts.length; i++) {
    const pipe = parts[i].indexOf('|')
    if (pipe <= 0) continue
    const label = parts[i].slice(0, pipe).trim()
    const url = parts[i].slice(pipe + 1).trim()
    if (!label || !url) continue
    out.push({ id: slugId(label, i), label, url: normalizeUrl(url) })
  }
  return out
}

function parseJsonPresets(raw: string): ApiEnvironmentPreset[] | null {
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data) || data.length === 0) return null
    const out: ApiEnvironmentPreset[] = []
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      if (!row || typeof row !== 'object') continue
      const label = (row as { label?: unknown }).label
      const url = (row as { url?: unknown }).url
      if (typeof label !== 'string' || typeof url !== 'string') continue
      const l = label.trim()
      const u = url.trim()
      if (!l || !u) continue
      out.push({ id: slugId(l, i), label: l, url: normalizeUrl(u) })
    }
    return out.length ? out : null
  } catch {
    return null
  }
}

function dedupeByUrl(presets: ApiEnvironmentPreset[]): ApiEnvironmentPreset[] {
  const seen = new Set<string>()
  return presets.filter((p) => {
    const k = p.url.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * URLs extras no .env (não pode repetir `EXPO_PUBLIC_API_URL` — o parser só guarda o último).
 * Rótulos opcionais para o modal.
 */
function presetsFromNumberedEnvUrls(): ApiEnvironmentPreset[] {
  const pairs: ReadonlyArray<readonly [string | undefined, string | undefined]> = [
    [process.env.EXPO_PUBLIC_API_URL_2, process.env.EXPO_PUBLIC_API_URL_2_LABEL],
    [process.env.EXPO_PUBLIC_API_URL_3, process.env.EXPO_PUBLIC_API_URL_3_LABEL],
    [process.env.EXPO_PUBLIC_API_URL_4, process.env.EXPO_PUBLIC_API_URL_4_LABEL],
  ]
  const out: ApiEnvironmentPreset[] = []
  for (let i = 0; i < pairs.length; i++) {
    const url = pairs[i][0]?.trim()
    if (!url) continue
    const label = pairs[i][1]?.trim() || `Ambiente ${i + 2}`
    out.push({ id: slugId(label, i), label, url: normalizeUrl(url) })
  }
  return out
}

/** Presets para o modal DEV: `EXPO_PUBLIC_API_URL` + `_2`/`_3`, JSON, ou linha `Label|url`. */
export function getDevApiEnvironmentPresets(): ApiEnvironmentPreset[] {
  const primary = normalizeUrl(getDefaultApiBaseUrl())
  const defaultPreset: ApiEnvironmentPreset = {
    id: 'env-default',
    label: 'Padrão (.env)',
    url: primary,
  }

  let list: ApiEnvironmentPreset[] = [defaultPreset, ...presetsFromNumberedEnvUrls()]

  const jsonRaw = process.env.EXPO_PUBLIC_API_DEV_OPTIONS?.trim()
  if (jsonRaw) {
    const parsed = parseJsonPresets(jsonRaw)
    if (parsed?.length) {
      list = [...list, ...parsed]
    }
  }

  const lineRaw = process.env.EXPO_PUBLIC_API_DEV_PRESETS?.trim()
  if (lineRaw) {
    const parsed = parsePresetsLine(lineRaw)
    if (parsed.length) {
      list = [...list, ...parsed]
    }
  }

  return dedupeByUrl(list)
}
