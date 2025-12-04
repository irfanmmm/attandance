import Geolocation from '@react-native-community/geolocation';
import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { openLocationSettings } from './settings_navigation';

export function useLocationShared() {
  const locationShared = useSharedValue({
    latitude: null,
    longitude: null,
    timestamp: null,
  });
  const timeoutRef = useRef<any>(null);
  const startWatch = (accuracy: boolean) => {
    console.log('Starting watch with accuracy:', accuracy);

    Geolocation.getCurrentPosition(
      position => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };

        locationShared.value = coords;

        console.log('📍 Location received:', coords);

        // If high accuracy finally worked, clear fallback
        clearTimeout(timeoutRef.current);
      },
      error => {
        console.log('❌ Location Error:', error);

        if (error.code === 3) {
          console.log('⚠️ High accuracy timed out → fallback to low accuracy');
        }
        if (error.code === 2) {
          clearTimeout(timeoutRef.current);
          Alert.alert(
            'GPS Disabled',
            'Your device cannot get your location. Please enable High Accuracy mode.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: openLocationSettings },
            ],
          );
        }
      },
      {
        enableHighAccuracy: accuracy,
        distanceFilter: 10,
        maximumAge: 3000,
        timeout: 2000, // not reliable on android
      },
    );
  };

  const callLocation = () => {
    // Step 1: Start high accuracy
    startWatch(true);

    // Step 2: Set fallback timer (3 seconds)
    timeoutRef.current = setTimeout(() => {
      console.log('⏳ High accuracy failed → switching to low accuracy');
      startWatch(false);
    }, 3000);
  };

  return { locationShared, callLocation };
}
