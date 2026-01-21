// navigation/AttendanceTeacherNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BatchListScreen from '../screens/teacher/BatchListScreen';
import AttendanceScreen from '../screens/teacher/AttendanceScreen';

const Stack = createNativeStackNavigator();

export default function AttendanceTeacherNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AllBatches" component={BatchListScreen} options={{ title: 'All Batches' }} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} options={{ title: 'Mark Attendance' }} />
    </Stack.Navigator>
  );
}
