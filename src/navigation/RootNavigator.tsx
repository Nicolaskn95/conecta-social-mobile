import React, { useEffect, useState } from 'react'

import { useAuth } from '../auth/useAuth'
import { SplashScreen } from '../screens/SplashScreen'
import { AppNavigator } from './AppNavigator'
import { AuthNavigator } from './AuthNavigator'

const MIN_SPLASH_MS = 3000

export function RootNavigator() {
  const { isAuthenticated, authReady } = useAuth()
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS)
    return () => clearTimeout(id)
  }, [])

  if (!authReady || !splashDone) {
    return <SplashScreen />
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />
}
