// navigation/BatchTeacherNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AbsentListScreen from '../screens/batchTeacher/AbsentListScreen';
import FollowUpScreen from '../screens/followup/FollowUpScreen';

const Stack = createNativeStackNavigator();

export default function BatchTeacherNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AbsentList" component={AbsentListScreen} options={{ title: 'Absent Students' }} />
      <Stack.Screen name="FollowUp" component={FollowUpScreen} options={{ title: 'Follow-up' }} />
    </Stack.Navigator>
  );
}
