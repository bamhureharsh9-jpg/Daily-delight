import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common/Loading';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { CustomerTabs } from './CustomerTabs';
import { OwnerTabs } from './OwnerTabs';
import { ProductDetailScreen } from '../screens/customer/ProductDetailScreen';
import { CategoryScreen } from '../screens/customer/CategoryScreen';
import { CheckoutScreen } from '../screens/customer/CheckoutScreen';
import { OrderTrackingScreen } from '../screens/customer/OrderTrackingScreen';
import { AddressesScreen } from '../screens/customer/AddressesScreen';
import { OffersScreen } from '../screens/customer/OffersScreen';
import { AddEditProductScreen } from '../screens/owner/AddEditProductScreen';
import { OwnerOrderDetailScreen } from '../screens/owner/OwnerOrderDetailScreen';
import { CustomerDetailScreen } from '../screens/owner/CustomerDetailScreen';
import { CouponsScreen } from '../screens/owner/CouponsScreen';
import { AddEditCouponScreen } from '../screens/owner/AddEditCouponScreen';
import { DeliveryAreasScreen } from '../screens/owner/DeliveryAreasScreen';
import { CategoriesScreen } from '../screens/owner/CategoriesScreen';
import { BannersScreen } from '../screens/owner/BannersScreen';
import { ReportsScreen } from '../screens/owner/ReportsScreen';
import { SettingsScreen } from '../screens/owner/SettingsScreen';
import { ProductsScreen } from '../screens/owner/ProductsScreen';
import { OwnerOrdersScreen } from '../screens/owner/OwnerOrdersScreen';
import { CustomersScreen } from '../screens/owner/CustomersScreen';
import { SearchScreen } from '../screens/customer/SearchScreen';
import { ActivityLogScreen } from '../screens/common/ActivityLogScreen';
import { SyncToastHost } from '../components/common/SyncToastHost';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.bg,
    card: Colors.white,
    primary: Colors.primary,
    text: Colors.text,
    border: Colors.border,
  },
};

function RootNavigator() {
  const { user, role } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user || !role ? (
          <>
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : role === 'customer' ? (
          <>
            <Stack.Screen name="MainTabs" component={CustomerTabs} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="Offers" component={OffersScreen} />
            <Stack.Screen name="SearchFromPush" component={SearchScreen} />
            <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={OwnerTabs} />
            <Stack.Screen name="AddProduct" component={AddEditProductScreen} />
            <Stack.Screen name="EditProduct" component={AddEditProductScreen} />
            <Stack.Screen name="OwnerOrderDetail" component={OwnerOrderDetailScreen} />
            <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
            <Stack.Screen name="AddCoupon" component={AddEditCouponScreen} />
            <Stack.Screen name="EditCoupon" component={AddEditCouponScreen} />
            <Stack.Screen name="Coupons" component={CouponsScreen} />
            <Stack.Screen name="DeliveryAreas" component={DeliveryAreasScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="Banners" component={BannersScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ProductsList" component={ProductsScreen} />
            <Stack.Screen name="OrdersList" component={OwnerOrdersScreen} />
            <Stack.Screen name="CustomersList" component={CustomersScreen} />
            <Stack.Screen name="ActivityLog" component={ActivityLogScreen} />
          </>
        )}
      </Stack.Navigator>
      <SyncToastHost />
    </View>
  );
}

export function AppNavigator() {
  const { loading } = useAuth();

  if (loading) return <Loading full />;

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
