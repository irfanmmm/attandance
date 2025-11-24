import Geolocation from '@react-native-community/geolocation';
import { useCallback, useState } from 'react';
import { useSharedValue } from 'react-native-worklets-core';

export function useLocationShared() {
  const [isHighAccuracy, setHighAccuracy] = useState(true);
  const locationShared = useSharedValue({
    latitude: 0,
    longitude: 0,
    timestamp: 0,
  });

  const callLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          console.log(position, '📸 Location captured:');
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
          };
          locationShared.value = coords;
          resolve(coords);
        },
        error => {
          console.log(error);
          if (error.code === 3) {
            setHighAccuracy(false);
          }
          reject(error);
        },
        {
          enableHighAccuracy: isHighAccuracy,
          distanceFilter: 10,
          timeout: 20000,
          maximumAge: 30000,
        },
      );
    });
  }, []);

  return { locationShared, callLocation };
}