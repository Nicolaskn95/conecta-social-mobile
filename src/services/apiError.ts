import axios, { type AxiosError } from 'axios'

function normalizeMessage(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return raw.join('\n')
  }
  return undefined
}

/**
 * Extrai mensagem legível de erros Axios (corpo Nest: `message` string ou array).
 */
function extraHintsForApiUrl(target: string): string[] {
  const t = target.toLowerCase()
  if (t.includes('amazonaws.com') || t.includes('compute-1.amazonaws') || t.includes('.elb.')) {
    return [
      'API na nuvem (AWS): confira no console da EC2 o Security Group — regra de entrada TCP na porta da URL (ex.: 3001) liberada para a internet ou para o seu IP.',
      'Instância ligada, Docker/serviço ouvindo em 0.0.0.0 (não só 127.0.0.1) e firewall do SO liberando a mesma porta.',
      'No PC, teste: curl -v "' + target.split('?')[0] + '" (mesmo host que o app usa).',
    ]
  }
  if (t.includes('127.0.0.1') || t.includes('localhost')) {
    return [
      'Localhost no emulador Android não é o seu PC. Use http://10.0.2.2:PORTA em EXPO_PUBLIC_API_URL ou rode a API com URL acessível (ex.: IP da rede).',
    ]
  }
  if (t.includes('10.0.2.2')) {
    return ['10.0.2.2 aponta para o PC quando a API roda na sua máquina; o Metro/Expo usa isso, não a API na nuvem.']
  }
  return [
    'Verifique: API rodando; firewall; valor de EXPO_PUBLIC_API_URL.',
    'Emulador + API no mesmo PC: use http://10.0.2.2:PORTA, não http://localhost.',
  ]
}

function describeNetworkFailure(err: AxiosError): string {
  const base = (err.config?.baseURL ?? '').replace(/\/$/, '')
  const path = err.config?.url ?? ''
  const target = [base, path].filter(Boolean).join('') || '(URL da API não configurada)'

  const lines = [
    'Não houve resposta do servidor (erro de rede).',
    `Destino tentado: ${target}`,
    ...extraHintsForApiUrl(target),
  ]
  if (target.startsWith('http://')) {
    lines.push(
      'Com http://, o Android precisa permitir cleartext (já habilitado no app.json deste projeto).',
    )
  }
  return lines.join('\n')
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined
    if (data) {
      const fromMessage = normalizeMessage(data.message)
      if (fromMessage) return fromMessage
      const fromError = normalizeMessage(data.error)
      if (fromError) return fromError
    }
    const status = err.response?.status
    if (status != null) {
      return `${fallback} (HTTP ${status})`
    }
    if (err.code === 'ECONNABORTED') {
      return 'Tempo esgotado ao falar com o servidor.'
    }
    const noResponse =
      err.code === 'ERR_NETWORK' ||
      err.message === 'Network Error' ||
      (err.request && !err.response)
    if (noResponse) {
      return describeNetworkFailure(err)
    }
    if (err.message) return err.message
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
