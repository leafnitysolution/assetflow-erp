import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { user, isLoading, checkSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00bc7d" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#09090b" />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="asset/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ticket/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-ticket" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
