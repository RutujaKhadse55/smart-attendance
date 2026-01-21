// components/Card.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { lightTheme } from '../theme/light';

export default function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const s = lightTheme;
  return <View style={[styles.card, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
});
