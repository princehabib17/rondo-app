import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="onboarding/role" />
      <Stack.Screen name="onboarding/username" />
      <Stack.Screen name="onboarding/photo" />
      <Stack.Screen name="onboarding/birthday" />
      <Stack.Screen name="onboarding/country" />
      <Stack.Screen name="onboarding/profile" />
      <Stack.Screen name="onboarding/location" />
      <Stack.Screen name="onboarding/notifications" />
      <Stack.Screen name="onboarding/skill" />
    </Stack>
  );
}
