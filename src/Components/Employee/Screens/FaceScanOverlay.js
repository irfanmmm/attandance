import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import ScanIcon from '../../../assets/svg/scan.svg';
import { SIZE } from '../../utils/Styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = 317;
const SENSOR_WIDTH = 720;
const SENSOR_HEIGHT = 1280;

const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const FaceScanOverlay = ({
  status = 'Please align your face within the frame',
  isFaceDetected = false,
  isProcessing = false,
  isError = false,
  faceObj = null, // Dynamic raw face object from xyz
}) => {
  // Reanimated Shared Values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const yawAngle = useSharedValue(0);
  const pitchAngle = useSharedValue(0);

  // MediaPipe Normalized Landmark Shared Coordinates (0.0 to 1.0 -> Screen Space)
  const leftEyeX = useSharedValue((FRAME_SIZE - 20) * 0.65);
  const leftEyeY = useSharedValue((FRAME_SIZE - 20) * 0.37);
  const rightEyeX = useSharedValue((FRAME_SIZE - 20) * 0.32);
  const rightEyeY = useSharedValue((FRAME_SIZE - 20) * 0.40);
  const noseX = useSharedValue((FRAME_SIZE - 20) * 0.49);
  const noseY = useSharedValue((FRAME_SIZE - 20) * 0.62);
  const mouthLX = useSharedValue((FRAME_SIZE - 20) * 0.64);
  const mouthLY = useSharedValue((FRAME_SIZE - 20) * 0.75);
  const mouthRX = useSharedValue((FRAME_SIZE - 20) * 0.36);
  const mouthRY = useSharedValue((FRAME_SIZE - 20) * 0.77);

  const laserPositionY = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);

  // Laser Beam & Pulse Loop
  useEffect(() => {
    laserPositionY.value = withRepeat(
      withSequence(
        withTiming(FRAME_SIZE - 20, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.95, { duration: 1000, easing: Easing.ease }),
        withTiming(0.35, { duration: 1000, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, [laserPositionY, pulseOpacity]);

  // Continuous Tracking Updates matching MediaPipe FaceLandmarkerService
  useEffect(() => {
    const bounds = faceObj?.bounds || faceObj?.frame || null;
    const landmarks = faceObj?.landmarks || null;
    const yaw = faceObj?.yawAngle ?? 0;
    const pitch = faceObj?.pitchAngle ?? 0;

    if (bounds) {
      const bw = bounds.width || (bounds.right - bounds.left) || 200;
      const bh = bounds.height || (bounds.bottom - bounds.top) || 200;
      const bx = bounds.left ?? bounds.x ?? 0;
      const by = bounds.top ?? bounds.y ?? 0;

      const coverScale = Math.max(SCREEN_WIDTH / SENSOR_WIDTH, SCREEN_HEIGHT / SENSOR_HEIGHT);
      let faceCenterX, faceCenterY, faceScreenWidth;
      if (typeof bounds.normX === 'number' && typeof bounds.normY === 'number') {
        const normCenterX = bounds.normX + (bounds.normWidth || 0) / 2;
        const normCenterY = bounds.normY + (bounds.normHeight || 0) / 2;
        faceCenterX = (1.0 - normCenterX) * SCREEN_WIDTH; // Front camera horizontal mirror
        faceCenterY = normCenterY * SCREEN_HEIGHT;
        faceScreenWidth = (bounds.normWidth || 0.4) * SCREEN_WIDTH;
      } else {
        const offsetX = (SCREEN_WIDTH - SENSOR_WIDTH * coverScale) / 2;
        const offsetY = (SCREEN_HEIGHT - SENSOR_HEIGHT * coverScale) / 2;
        const rawCenterX = (bx + bw / 2) * coverScale + offsetX;
        faceCenterX = SCREEN_WIDTH - rawCenterX;
        faceCenterY = (by + bh / 2) * coverScale + offsetY;
        faceScreenWidth = bw * coverScale;
      }

      const screenCenterX = SCREEN_WIDTH * 0.5;
      const screenCenterY = SCREEN_HEIGHT * 0.5;

      const targetX = faceCenterX - screenCenterX;
      const targetY = faceCenterY - screenCenterY;
      const targetScale = Math.max(0.55, Math.min(1.05, faceScreenWidth / (FRAME_SIZE * 0.82)));

      translateX.value = withSpring(targetX, springConfig);
      translateY.value = withSpring(targetY, springConfig);
      scale.value = withSpring(targetScale, springConfig);
      yawAngle.value = withSpring(Math.max(-25, Math.min(25, yaw)), springConfig);
      pitchAngle.value = withSpring(Math.max(-15, Math.min(15, pitch)), springConfig);


      // MediaPipe-style Normalized Landmark Point Calculation
      if (landmarks && typeof landmarks === 'object') {
        const mapPt = pt => {
          if (!pt) return null;
          let relX = 0.5, relY = 0.5;

          if (typeof pt.normX === 'number' && typeof pt.normY === 'number' && bounds.normWidth && bounds.normHeight) {
            relX = (pt.normX - bounds.normX) / bounds.normWidth;
            relY = (pt.normY - bounds.normY) / bounds.normHeight;
          } else if (typeof pt.x === 'number' && typeof pt.y === 'number' && bw && bh) {
            relX = (pt.x - bx) / bw;
            relY = (pt.y - by) / bh;
          } else {
            return null;
          }

          // Mirror X for front camera preview display with tight 3% margin
          const clampRelX = Math.min(0.97, Math.max(0.03, 1.0 - relX));
          const clampRelY = Math.min(0.97, Math.max(0.03, relY));

          return {
            x: clampRelX * (FRAME_SIZE - 20),
            y: clampRelY * (FRAME_SIZE - 20),
          };
        };

        const lEye = mapPt(landmarks.LEFT_EYE);
        const rEye = mapPt(landmarks.RIGHT_EYE);
        const nBase = mapPt(landmarks.NOSE_BASE);
        const mLip = mapPt(landmarks.MOUTH_LEFT);
        const mRip = mapPt(landmarks.MOUTH_RIGHT);

        if (lEye) {
          leftEyeX.value = withSpring(lEye.x, springConfig);
          leftEyeY.value = withSpring(lEye.y, springConfig);
        }
        if (rEye) {
          rightEyeX.value = withSpring(rEye.x, springConfig);
          rightEyeY.value = withSpring(rEye.y, springConfig);
        }
        if (nBase) {
          noseX.value = withSpring(nBase.x, springConfig);
          noseY.value = withSpring(nBase.y, springConfig);
        }
        if (mLip) {
          mouthLX.value = withSpring(mLip.x, springConfig);
          mouthLY.value = withSpring(mLip.y, springConfig);
        }
        if (mRip) {
          mouthRX.value = withSpring(mRip.x, springConfig);
          mouthRY.value = withSpring(mRip.y, springConfig);
        }
      }
    }
  }, [faceObj, translateX, translateY, scale, yawAngle, pitchAngle, leftEyeX, leftEyeY, rightEyeX, rightEyeY, noseX, noseY, mouthLX, mouthLY, mouthRX, mouthRY]);

  // Reanimated Animated Styles
  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const animatedMeshStyle = useAnimatedStyle(() => {
    const rotY = interpolate(yawAngle.value, [-30, 0, 30], [-18, 0, 18]);
    const rotX = interpolate(pitchAngle.value, [-20, 0, 20], [-12, 0, 12]);

    return {
      transform: [
        { perspective: 600 },
        { rotateY: `${rotY}deg` },
        { rotateX: `${rotX}deg` },
      ],
    };
  });

  const animatedLeftEyeStyle = useAnimatedStyle(() => ({
    left: leftEyeX.value - 4,
    top: leftEyeY.value - 4,
  }));

  const animatedLeftEyeBoxStyle = useAnimatedStyle(() => ({
    left: leftEyeX.value - 25,
    top: leftEyeY.value - 13,
  }));

  const animatedRightEyeStyle = useAnimatedStyle(() => ({
    left: rightEyeX.value - 4,
    top: rightEyeY.value - 4,
  }));

  const animatedRightEyeBoxStyle = useAnimatedStyle(() => ({
    left: rightEyeX.value - 25,
    top: rightEyeY.value - 13,
  }));

  const animatedNoseStyle = useAnimatedStyle(() => ({
    left: noseX.value - 4,
    top: noseY.value - 4,
  }));

  const animatedMouthLStyle = useAnimatedStyle(() => ({
    left: mouthLX.value - 4,
    top: mouthLY.value - 4,
  }));

  const animatedMouthRStyle = useAnimatedStyle(() => ({
    left: mouthRX.value - 4,
    top: mouthRY.value - 4,
  }));

  const animatedLaserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserPositionY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // Dynamic Theme Colors
  let primaryColor = '#00E5FF';
  let laserColor = '#00E5FF';
  let badgeBg = 'rgba(0, 229, 255, 0.15)';

  if (isError) {
    primaryColor = '#FF3B30';
    laserColor = '#FF3B30';
    badgeBg = 'rgba(255, 59, 48, 0.2)';
  } else if (isProcessing) {
    primaryColor = '#38EF7D';
    laserColor = '#11998E';
    badgeBg = 'rgba(56, 239, 125, 0.25)';
  } else if (isFaceDetected) {
    primaryColor = '#00E676';
    laserColor = '#00E676';
    badgeBg = 'rgba(0, 230, 118, 0.2)';
  }

  return (
    <View style={styles.frameContainer}>
      <View style={styles.titleContainer}>
        <Text allowFontScaling={false} style={styles.scanTitle}>
          AI 3D Eye & Face Tracking
        </Text>
      </View>

      <Animated.View style={[styles.frameWrapper, animatedFrameStyle]}>
        {/* Reticle Corner Brackets */}
        <View style={styles.frame}>
          <View style={[styles.corner, styles.topLeft, { borderColor: primaryColor }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: primaryColor }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: primaryColor }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: primaryColor }]} />
        </View>

        {/* Dynamic 3D Eye & Landmark Mesh Layer */}
        <Animated.View style={[styles.meshArea, animatedMeshStyle]}>
          {/* Left Eye Node & Dynamic Tracking Box */}
          <Animated.View
            style={[
              styles.meshNode,
              animatedLeftEyeStyle,
              animatedPulseStyle,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
            ]}
          />
          <Animated.View
            style={[
              styles.eyeBox,
              animatedLeftEyeBoxStyle,
              animatedPulseStyle,
              { borderColor: primaryColor },
            ]}
          />

          {/* Right Eye Node & Dynamic Tracking Box */}
          <Animated.View
            style={[
              styles.meshNode,
              animatedRightEyeStyle,
              animatedPulseStyle,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
            ]}
          />
          <Animated.View
            style={[
              styles.eyeBox,
              animatedRightEyeBoxStyle,
              animatedPulseStyle,
              { borderColor: primaryColor },
            ]}
          />

          {/* Nose Base Node */}
          <Animated.View
            style={[
              styles.meshNode,
              animatedNoseStyle,
              animatedPulseStyle,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
            ]}
          />

          {/* Mouth Left & Right Corner Nodes */}
          <Animated.View
            style={[
              styles.meshNode,
              animatedMouthLStyle,
              animatedPulseStyle,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
            ]}
          />
          <Animated.View
            style={[
              styles.meshNode,
              animatedMouthRStyle,
              animatedPulseStyle,
              { backgroundColor: primaryColor, shadowColor: primaryColor },
            ]}
          />
        </Animated.View>

        {/* Laser Beam Layer */}
        <View style={styles.scanArea}>
          <Animated.View
            style={[
              styles.laserLine,
              animatedLaserStyle,
              {
                backgroundColor: laserColor,
                shadowColor: laserColor,
              },
            ]}
          >
            <View style={[styles.laserGlow, { backgroundColor: laserColor }]} />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Status Badge */}
      <View style={[styles.scanStatusBadge, { backgroundColor: badgeBg }]}>
        <ScanIcon width={SIZE(16)} height={SIZE(16)} fill={primaryColor} />
        <Text
          allowFontScaling={false}
          style={[styles.scanStatusText, { color: '#FFFFFF' }]}
        >
          {status}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'none',
  },
  titleContainer: {
    alignSelf: 'center',
    marginBottom: SIZE(20),
  },
  scanTitle: {
    fontSize: SIZE(22),
    lineHeight: SIZE(26),
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  frameWrapper: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'absolute',
  },
  meshArea: {
    width: FRAME_SIZE - 20,
    height: FRAME_SIZE - 20,
    position: 'absolute',
  },
  scanArea: {
    width: FRAME_SIZE - 20,
    height: FRAME_SIZE - 20,
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  meshNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  eyeBox: {
    position: 'absolute',
    width: 50,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 6,
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  laserGlow: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    height: 15,
    opacity: 0.35,
  },
  scanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZE(24),
    paddingHorizontal: SIZE(16),
    paddingVertical: SIZE(8),
    borderRadius: SIZE(20),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scanStatusText: {
    fontSize: SIZE(14),
    lineHeight: SIZE(18),
    marginLeft: SIZE(8),
    fontWeight: '500',
  },
});
