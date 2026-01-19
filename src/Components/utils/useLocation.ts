import Geolocation from 'react-native-geolocation-service';
import { useState, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

interface Coordinates {
  latitude: null | number;
  longitude: null | number;
  timestamp: null | number;
}

interface LocationError {
  code: number;
  message: string;
}

export function useLocationShared() {
  const timeoutRef = useRef<any>(null);

  // Check if location services are enabled (Android)
  const checkLocationEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        // Check if location is enabled using DeviceInfo
        // You may need to install @react-native-community/geolocation-service
        return true; // Placeholder - implement actual check
      } catch (error) {
        console.log('Error checking location services:', error);
        return false;
      }
    }
    return true;
  };

  const getLoc = (accuracy: boolean): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: position.timestamp,
          });
        },
        error => {
          console.log(
            `Location error (${accuracy ? 'high' : 'low'} accuracy):`,
            error,
          );
          reject(error);
        },
        {
          enableHighAccuracy: accuracy,
          timeout: accuracy ? 15000 : 10000, // Reduced timeouts
          maximumAge: accuracy ? 5000 : 10000, // Allow slightly older cache for low accuracy
          showLocationDialog: true, // Android: prompt user to enable location
          forceRequestLocation: true, // Android: force location request
        },
      );
    });
  };

  const callLocation = async (retryCount = 0): Promise<Coordinates> => {
    const MAX_RETRIES = 2;

    try {
      // First, check if location services are enabled
      const isEnabled = await checkLocationEnabled();
      if (!isEnabled) {
        console.log('Location services are disabled');
        throw new Error('Location services disabled');
      }

      // Try high accuracy first with shorter timeout
      const high = await Promise.race([
        getLoc(true),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject({ code: 3, message: 'High accuracy timeout' }),
            15000,
          ),
        ),
      ]);

      console.log('✅ Got high accuracy location:', high);
      return high as Coordinates;
    } catch (e: any) {
      console.log('High accuracy failed → trying fallback', e);

      try {
        // Try low accuracy as fallback
        const low = await Promise.race([
          getLoc(false),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject({ code: 3, message: 'Low accuracy timeout' }),
              10000,
            ),
          ),
        ]);

        console.log('✅ Got low accuracy location:', low);
        return low;
      } catch (err: any) {
        console.log('Low accuracy also failed', err);

        // Retry logic
        if (retryCount < MAX_RETRIES) {
          console.log(
            `Retrying location... (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          );
          await new Promise(resolve => setTimeout(resolve as any, 2000)); // Wait 2s before retry
          return callLocation(retryCount + 1);
        }

        // All attempts failed
        console.error('❌ All location attempts failed');
        return {
          latitude: null,
          longitude: null,
          timestamp: null,
        };
      }
    }
  };

  return { callLocation };
}

export function useLocation(
  updateLocation: (latitude: number | null, longitude: number | null) => void,
  setLoading: (loading: boolean) => void,
) {
  const { callLocation } = useLocationShared();

  return async () => {
    setLoading(true);
    const coordinates = await callLocation();

    if (coordinates.latitude && coordinates.longitude) {
      updateLocation(coordinates.latitude, coordinates.longitude);
    } else {
      // Location failed, update with null
      updateLocation(null, null);
    }

    setLoading(false);
  };
}
