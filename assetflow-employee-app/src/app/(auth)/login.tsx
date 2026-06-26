import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.login(email.trim(), password);

      // Block admin and super admin roles from mobile login
      if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'super-admin') {
        Alert.alert('Access Denied', 'Administrator accounts cannot log in to the mobile app.');
        return;
      }

      setAuth(user, token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>AF</Text>
          </View>
          <Text style={styles.appName}>AssetFlow</Text>
          <Text style={styles.tagline}>Asset Management · Mobile</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@company.com"
              placeholderTextColor="#525252"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#525252"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#09090b" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Super Admin accounts cannot access the mobile app.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00bc7d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoText: { fontSize: 26, fontWeight: '800', color: '#09090b' },
  appName: { fontSize: 28, fontWeight: '800', color: '#fafafa', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#a1a1a1', marginTop: 4 },

  card: {
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#fafafa', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#a1a1a1', marginBottom: 24 },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#a1a1a1', marginBottom: 8 },
  input: {
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  btn: {
    backgroundColor: '#00bc7d',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#09090b' },

  footer: {
    textAlign: 'center',
    color: '#525252',
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
});
