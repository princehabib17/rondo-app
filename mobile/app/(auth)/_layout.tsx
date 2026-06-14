import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="onboarding/role" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="onboarding/location" />
      <Stack.Screen name="onboarding/skill" />
    </Stack>
  );
}
