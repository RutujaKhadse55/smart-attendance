// navigation/AdminNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/admin/DashboardScreen';
import StudentImportScreen from '../screens/admin/StudentImportScreen';
import BatchManagementScreen from '../screens/admin/BatchManagementScreen';
import TeacherManagementScreen from '../screens/admin/TeacherManagementScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Import" component={StudentImportScreen} />
      <Tab.Screen name="Batches" component={BatchManagementScreen} />
      <Tab.Screen name="Teachers" component={TeacherManagementScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
