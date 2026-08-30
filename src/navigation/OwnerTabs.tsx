import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';
import { OwnerDashboard } from '../screens/owner/OwnerDashboard';
import { OwnerOrdersScreen } from '../screens/owner/OwnerOrdersScreen';
import { ProductsScreen } from '../screens/owner/ProductsScreen';
import { CustomersScreen } from '../screens/owner/CustomersScreen';
import { OwnerMoreScreen } from '../screens/owner/OwnerMoreScreen';

const Tab = createBottomTabNavigator();

export function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          paddingTop: 4,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size, focused }) => {
          const iconMap: Record<string, any> = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Orders: focused ? 'receipt' : 'receipt-outline',
            Products: focused ? 'cube' : 'cube-outline',
            Customers: focused ? 'people' : 'people-outline',
            More: focused ? 'menu' : 'menu-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={OwnerDashboard} />
      <Tab.Screen name="Orders" component={OwnerOrdersScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="More" component={OwnerMoreScreen} />
    </Tab.Navigator>
  );
}
