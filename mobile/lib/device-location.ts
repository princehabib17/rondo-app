import { Platform } from 'react-native';

export type DeviceLocation =
  | { ok: true; lat: number; lng: number }
  | { ok: false; reason: 'denied' | 'unavailable' };

type ExpoLocation = {
  Accuracy: { Balanced: number };
  requestForegroundPermissionsAsync: () => Promise<{ granted: boolean }>;
  getCurrentPositionAsync: (opts: { accuracy: number }) => Promise<{
    coords: { latitude: number; longitude: number };
  }>;
};

function webGeolocation(): Promise<DeviceLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: 'unavailable' });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => resolve({ ok: false, reason: err.code === 1 ? 'denied' : 'unavailable' }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 }
    );
  });
}

export async function requestDeviceLocation(): Promise<DeviceLocation> {
  if (Platform.OS === 'web') return webGeolocation();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Location = require('expo-location') as ExpoLocation;
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
