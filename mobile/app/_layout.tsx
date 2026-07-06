import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="games/[id]/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="games/[id]/join" options={{ presentation: 'modal' }} />
          <Stack.Screen name="games/[id]/payment" options={{ presentation: 'modal' }} />
          <Stack.Screen name="games/[id]/chat" options={{ presentation: 'card' }} />
          <Stack.Screen name="wallet" options={{ presentation: 'card' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
          <Stack.Screen name="my-games" options={{ presentation: 'card' }} />
          <Stack.Screen name="help" options={{ presentation: 'card' }} />
          <Stack.Screen name="scout" options={{ presentation: 'card' }} />
          <Stack.Screen name="messages/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="messages/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="organizers/[id]/index" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="reels" options={{ presentation: 'card' }} />
          <Stack.Screen name="games/[id]/confirmed" options={{ presentation: 'card', gestureEnabled: false }} />
          <Stack.Screen name="organizer" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
