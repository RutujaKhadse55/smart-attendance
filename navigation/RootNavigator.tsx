// navigation/RootNavigator.tsx
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './AdminNavigator';
import AttendanceTeacherNavigator from './AttendanceTeacherNavigator';
import BatchTeacherNavigator from './BatchTeacherNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // Could show Lottie loading

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'Admin' ? (
        <Stack.Screen name="Admin" component={AdminNavigator} />
      ) : user.role === 'Attendance Teacher' ? (
        <Stack.Screen name="AttendanceTeacher" component={AttendanceTeacherNavigator} />
      ) : (
        <Stack.Screen name="BatchTeacher" component={BatchTeacherNavigator} />
      )}
    </Stack.Navigator>
  );
}
