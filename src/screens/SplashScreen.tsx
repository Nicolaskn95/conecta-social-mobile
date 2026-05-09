import LottieView from 'lottie-react-native'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

const ANIMATION = require('../../assets/lottieJSON.json')

export function SplashScreen() {
  const animationRef = useRef<LottieView | null>(null)

  useEffect(() => {
    animationRef.current?.play()
  }, [])

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={ANIMATION}
        autoPlay
        loop={false}
        style={styles.lottie}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '80%',
    height: '80%',
  },
})
