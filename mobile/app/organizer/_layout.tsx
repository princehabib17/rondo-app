import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function OrganizerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create/index" />
      <Stack.Screen name="create/tournament" />
      <Stack.Screen name="games/[id]/manage" />
      <Stack.Screen name="games/[id]/payments" />
      <Stack.Screen name="tournaments/index" />
      <Stack.Screen name="tournaments/[id]/manage" />
      <Stack.Screen name="earnings" />
    </Stack>
  );
}
