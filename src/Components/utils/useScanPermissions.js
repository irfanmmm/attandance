import { useState, useCallback } from 'react';
import { PermissionsService } from './permissions';

/**
 * Custom hook to handle camera and location permissions for the scanning screen.
 * 
 * @param {Object} params
 * @param {Object} params.settings - App settings
 * @param {Function} params.updateState - Function to update UI state
 * @param {Function} params.callLocation - Function to trigger location fetching
 * @param {import('react-native-worklets-core').SharedValue<Object>} params.location - Shared value for lat/long
 * @param {import('react-native-worklets-core').SharedValue<boolean>} params.isLocationReady - Shared value for location readiness
 * @param {import('react-native-worklets-core').SharedValue<boolean>} params.isProcessingFrame - Shared value for processing state
 * @returns {Object} { permission, initLocation }
 */
export const useScanPermissions = ({
  settings,
  updateState,
  callLocation,
  location,
  isLocationReady,
  isProcessingFrame,
}) => {
  const [permission, setPermission] = useState(null);

  const initLocation = useCallback(async () => {
    console.log('📍 initLocation started, settings ready:', !!settings);
    if (settings === undefined) return;

    // 1. Handle case where Location Tracking is disabled
    if (!settings?.['Location Tracking']) {
      console.log('📍 Location Tracking disabled in settings, requesting camera only');
      const res = await PermissionsService.requestCameraOnly();
      console.log('📍 Camera only permission result:', res.camera);
      setPermission(res);

      if (res.camera !== 'granted') return;
      
      // Bypass location check
      location.value = { latitude: 0, longitude: 0 };
      isLocationReady.value = true;
      console.log('📍 isLocationReady set to true (No Location Tracking)');
      return;
    }

    // 2. Request both Camera and Location
    console.log('📍 Requesting camera and location permissions');
    const res = await PermissionsService.requestCameraAndLocation();
    console.log('📍 Permission result:', res);
    setPermission(res);

    // If camera is granted, we can at least start the scanner UI
    if (res.camera === 'granted') {
      isLocationReady.value = true;
      console.log('📍 isLocationReady set to true (Camera granted)');
    }

    // 3. If location denied, we are done
    if (res.location !== 'granted') {
      console.log('📍 Location not granted, proceeding with 0,0');
      location.value = { latitude: 0, longitude: 0 };
      return;
    }

    // 4. Proactively fetch location if enabled and granted
    console.log('📍 Fetching actual location in background...');
    
    // We don't block isLocationReady on this anymore
    try {
      const locationRes = await callLocation();
      console.log('📍 Location fetch result:', !!locationRes);

      if (locationRes?.latitude && locationRes?.longitude) {
        location.value = {
          latitude: locationRes.latitude,
          longitude: locationRes.longitude,
        };
        isProcessingFrame.value = false;
        console.log('📍 Location updated in background');
      }
    } catch (err) {
      console.log('📍 Background location fetch failed:', err.message);
    }
  }, [settings, updateState, callLocation, location, isLocationReady, isProcessingFrame]);

  return { 
    permission, 
    initLocation 
  };
};
