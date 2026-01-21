// components/AnimatedToggle.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';
import { lightTheme } from '../theme/light';

export default function AnimatedToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const s = lightTheme;
  const translateX = useRef(new Animated.Value(value ? 24 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [value, translateX]);

  const toggle = () => {
    const next = !value;
    onChange(next);
  };

  return (
    <Pressable onPress={toggle} style={[styles.container, { backgroundColor: value ? s.colors.success : s.colors.border }]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      <Text style={styles.text}>{value ? 'Present' : 'Absent'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 64, height: 32, borderRadius: 16, padding: 4, flexDirection: 'row', alignItems: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  text: { marginLeft: 8 },
});
