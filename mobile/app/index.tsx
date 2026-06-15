import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../constants/theme';

export default function IndexRoute() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (!profile?.role) {
      router.replace('/(auth)/onboarding/role');
    } else if (profile.role === 'organizer') {
      router.replace('/organizer/(tabs)/dashboard');
    } else {
      router.replace('/(tabs)/feed');
    }
  }, [loading, session, profile]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.yellow} size="large" />
    </View>
  );
}
