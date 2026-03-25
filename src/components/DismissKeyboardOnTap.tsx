import React, { PropsWithChildren } from 'react'
import { Keyboard, StyleProp, TouchableWithoutFeedback, View, ViewStyle } from 'react-native'

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  /** false dentro de ScrollView para o wrapper acompanhar a altura do conteúdo. */
  fill?: boolean
}>

/**
 * Toque fora dos campos para fechar o teclado (comportamento esperado no iOS).
 */
export function DismissKeyboardOnTap({ children, style, fill = true }: Props) {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[fill && { flex: 1 }, style]}>{children}</View>
    </TouchableWithoutFeedback>
  )
}
