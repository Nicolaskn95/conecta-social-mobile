import React from 'react'
import { View } from 'react-native'

import { useAuth } from '../auth/useAuth'
import { AppNavigator } from './AppNavigator'
import { AuthNavigator } from './AuthNavigator'

export function RootNavigator() {
  const { isAuthenticated, authReady } = useAuth()
  if (!authReady) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />
  }
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />
}
