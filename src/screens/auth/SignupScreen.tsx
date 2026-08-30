import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export function SignupScreen({ navigation }: any) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Required', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signup({ name, email, phone, password, role: 'customer' });
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <Pressable onPress={() => navigation.goBack()} style={styles.back} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to start ordering fresh groceries</Text>
          </View>

          <View style={styles.form}>
            <Input label="Full Name" placeholder="Your full name" value={name} onChangeText={setName} leftIcon="person-outline" autoCapitalize="words" />
            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Phone" placeholder="10-digit mobile number" value={phone} onChangeText={setPhone} leftIcon="call-outline" keyboardType="phone-pad" maxLength={10} />
            <Input label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} leftIcon="lock-closed-outline" secureTextEntry />

            <Button title="Create Account" onPress={handleSignup} loading={loading} size="lg" fullWidth />

            <Pressable onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: Spacing.lg }}>
              <Text style={styles.altText}>
                Already have an account? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  head: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  back: { marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  form: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  altText: { ...Typography.body, color: Colors.textSecondary },
});
