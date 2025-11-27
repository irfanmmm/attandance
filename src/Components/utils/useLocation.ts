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
  console.log(isHighAccuracy, 'ddd');

  const callLocation = (accuracy = null) => {
    console.log(accuracy || isHighAccuracy, '*******');
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
          enableHighAccuracy: accuracy || isHighAccuracy,
          distanceFilter: 10,
          timeout: 2000,
          maximumAge: 3000,
        },
      );
    });
  };

  return { locationShared, callLocation };
}
