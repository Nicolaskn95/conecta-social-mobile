import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'

type Props = { children: ReactNode }
type State = { error: Error | null; info: ErrorInfo | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[AppErrorBoundary]', error, info.componentStack)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Erro ao carregar o app</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          {__DEV__ && this.state.info?.componentStack ? (
            <ScrollView style={styles.scroll}>
              <Text style={styles.stack}>{this.state.info.componentStack}</Text>
            </ScrollView>
          ) : null}
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    color: colors.text,
    marginBottom: 12,
  },
  message: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.danger,
    marginBottom: 16,
  },
  scroll: { maxHeight: 320 },
  stack: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.mutedText,
  },
})
