import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { clearAuthToken, getAuthToken, setAuthToken } from '../storage/secureStore'

type AuthState = {
  token: string | null
  authReady: boolean
}

type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  authReady: boolean
  signInWithToken: (token: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    authReady: false,
  })

  useEffect(() => {
    let cancelled = false
    getAuthToken().then((token) => {
      if (!cancelled) {
        setState({ token, authReady: true })
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const signInWithToken = useCallback(async (token: string) => {
    await setAuthToken(token)
    setState((s) => ({ ...s, token }))
  }, [])

  const signOut = useCallback(async () => {
    await clearAuthToken()
    setState((s) => ({ ...s, token: null }))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state.token,
      isAuthenticated: Boolean(state.token),
      authReady: state.authReady,
      signInWithToken,
      signOut,
    }),
    [state.token, state.authReady, signInWithToken, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
