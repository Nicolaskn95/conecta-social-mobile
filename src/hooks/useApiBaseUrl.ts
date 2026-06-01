import { useEffect, useState } from 'react'

import { getApiBaseUrl, subscribeApiBaseUrl } from '../config/runtimeApiBaseUrl'

export function useApiBaseUrl(): string {
  const [url, setUrl] = useState(getApiBaseUrl)

  useEffect(() => {
    setUrl(getApiBaseUrl())
    return subscribeApiBaseUrl(() => {
      setUrl(getApiBaseUrl())
    })
  }, [])

  return url
}
