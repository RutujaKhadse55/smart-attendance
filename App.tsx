// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { initDB } from './db/schema';
import { seedDefaultAdmin } from './db/seed';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    initDB();
    seedDefaultAdmin();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
