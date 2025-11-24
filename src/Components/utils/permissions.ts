import { PermissionsAndroid, Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

type PermissionStatus = 'granted' | 'blocked' | 'denied';

export class PermissionsService {
  static async requestCameraAndLocation(): Promise<{
    camera: PermissionStatus;
    location: PermissionStatus;
  }> {
    if (Platform.OS === 'android') {
      return this.requestAndroidPermissions() as any;
    } else {
      return this.requestIosPermissions();
    }
  }

  private static async requestAndroidPermissions() {
    try {
      const permissions = [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const camera = results[PERMISSIONS.ANDROID.CAMERA];
      const location = results[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION];
      console.log(results)

      return {
        camera: this.mapAndroidResult(camera),
        location: this.mapAndroidResult(location),
      };
    } catch (error) {
      return { camera: 'blocked', location: 'blocked' };
    }
  }

  private static async requestIosPermissions() {
    const cameraStatus = await this.checkAndRequest(PERMISSIONS.IOS.CAMERA);
    const locationStatus = await this.checkAndRequest(
      PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
    );

    return { camera: cameraStatus, location: locationStatus };
  }

  private static async checkAndRequest(
    permission: Permission,
  ): Promise<PermissionStatus> {
    try {
      let status = await check(permission);

      if (status === RESULTS.GRANTED) {
        return 'granted';
      }

      if (status === RESULTS.DENIED || status === RESULTS.LIMITED) {
        status = await request(permission);
      }

      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
        return 'granted';
      }

      if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
        return 'blocked';
      }

      return 'denied';
    } catch (error) {
      return 'blocked';
    }
  }
  private static mapAndroidResult(result: any): PermissionStatus {
    switch (result) {
      case PermissionsAndroid.RESULTS.GRANTED:
        return 'granted';
      case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
        return 'blocked';
      case PermissionsAndroid.RESULTS.DENIED:
      default:
        return 'denied';
    }
  }
  static async arePermissionsGranted(): Promise<boolean> {
    const { camera, location } = await this.requestCameraAndLocation();
    return camera === 'granted' && location === 'granted';
  }
  static async isAnyPermissionBlocked(): Promise<boolean> {
    const { camera, location } = await this.requestCameraAndLocation();
    return camera === 'blocked' || location === 'blocked';
  }
}
