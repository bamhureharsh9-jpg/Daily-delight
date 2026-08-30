import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export function LoginScreen({ route, navigation }: any) {
  const role: 'customer' | 'owner' = route?.params?.role || 'customer';
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState(role === 'owner' ? 'owner@dailydelight.in' : 'priya@example.com');
  const [password, setPassword] = useState(role === 'owner' ? 'owner123' : 'priya123');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email/phone and password');
      return;
    }
    setLoading(true);
    try {
      await login(emailOrPhone, password, role);
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (email: string, pwd: string) => {
    setEmailOrPhone(email);
    setPassword(pwd);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </Pressable>
            <View style={[styles.iconCircle, role === 'owner' ? { backgroundColor: Colors.accentLight } : { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name={role === 'owner' ? 'storefront' : 'cart'} size={28} color={role === 'owner' ? Colors.accent : Colors.primary} />
            </View>
            <Text style={styles.title}>
              {role === 'owner' ? 'Owner Login' : 'Customer Login'}
            </Text>
            <Text style={styles.subtitle}>
              {role === 'owner' ? 'Manage your store, products & orders' : 'Sign in to start ordering'}
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email or Phone"
              placeholder="Enter email or phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              leftIcon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPwd ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPwd((s) => !s)}
              secureTextEntry={!showPwd}
            />

            <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" fullWidth />

            {role === 'customer' && (
              <Pressable onPress={() => navigation.navigate('Signup', { role })} style={styles.signupLink}>
                <Text style={styles.signupText}>
                  New here? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Create an account</Text>
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>🔐 Demo Accounts (one-tap)</Text>
            {role === 'owner' ? (
              <Pressable style={styles.demoRow} onPress={() => demoLogin('owner@dailydelight.in', 'owner123')}>
                <View style={[styles.demoIcon, { backgroundColor: Colors.accentLight }]}>
                  <Ionicons name="storefront" size={18} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoName}>Store Owner</Text>
                  <Text style={styles.demoCred}>owner@dailydelight.in • owner123</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.demoRow} onPress={() => demoLogin('priya@example.com', 'priya123')}>
                  <View style={[styles.demoIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons name="person" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoName}>Priya Sharma</Text>
                    <Text style={styles.demoCred}>priya@example.com • priya123</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </Pressable>
                <Pressable style={styles.demoRow} onPress={() => demoLogin('amit@example.com', 'amit123')}>
                  <View style={[styles.demoIcon, { backgroundColor: Colors.primaryLight }]}>
                    <Ionicons name="person" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.demoName}>Amit Verma</Text>
                    <Text style={styles.demoCred}>amit@example.com • amit123</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  head: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl },
  back: { alignSelf: 'flex-start', marginBottom: Spacing.md },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  form: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  signupLink: { alignItems: 'center', marginTop: Spacing.xl },
  signupText: { ...Typography.body, color: Colors.textSecondary },
  demoBox: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  demoTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md, letterSpacing: 0.5 },
  demoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Spacing.sm },
  demoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  demoName: { ...Typography.bodyBold, color: Colors.text },
  demoCred: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
