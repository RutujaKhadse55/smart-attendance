// components/LottieViewWrapper.tsx
import React from 'react';
import LottieView from 'lottie-react-native';
import { View, StyleSheet } from 'react-native';

export default function LottieViewWrapper({ source, size = 120 }: { source: any; size?: number }) {
  return (
    <View style={styles.container}>
      <LottieView source={source} autoPlay loop style={{ width: size, height: size }} />
    </View>
  );
}
const styles = StyleSheet.create({ container: { alignItems: 'center', justifyContent: 'center' } });
