// LocationProvider.tsx or App.tsx
import { useEffect } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { useLocationShared } from './useLocation';

export function LocationProvider() {
  const { locationShared } = useLocationShared();
  useEffect(() => {
    const watchId = Geolocation.watchPosition(
      position => {
        'worklet';
        locationShared.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
      },
      error => console.warn(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 5000,
      },
    );

    return () => Geolocation.clearWatch(watchId);
  }, []);

  return null;
}
