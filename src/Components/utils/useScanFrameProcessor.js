import {
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';
import { crop } from 'vision-camera-cropper';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const UI_FRAME_SIZE = 317; // 310 + 7 (from styles)

const xyzFrameProcessor = VisionCameraProxy.initFrameProcessorPlugin('xyz', {
  performanceMode: 'fast',
  landmarkMode: 'all',
  // Contours (dense per-face point mesh) are ML Kit's most expensive mode and
  // are never read anywhere below (only bounds/landmarks/angles/eye-open are
  // used) - leaving this on 'all' costs real per-frame CPU on every device.
  contourMode: 'none',
  classificationMode: 'all',
  trackingEnabled: 'true',
});


// Padding ratio around the tight face box before cropping for model embedding
const CROP_PADDING_RATIO = 0.35;

/**
 * Custom hook for face scanning frame processing logic with tight crop region & rollAngle support.
 */
export const useScanFrameProcessor = ({
  isLocationReady,
  isModalVisible,
  isProcessingFrame,
  markActive,
  handleUpdateState,
  processFace,
  onFaceStateChange,
  onFaceBoundsChange,
}) => {
  const lastStatusUpdate = useSharedValue(0);
  const lastDetectionTime = useSharedValue(0);
  const lastFaceSeenTime = useSharedValue(0);
  const isFaceDetected = useSharedValue(false);
  const lastFaceX = useSharedValue(-1);
  const lastFaceY = useSharedValue(-1);
  const lastProcessingTime = useSharedValue(0);
  const isReadyToCapture = useSharedValue(false);


  const lastNotifyBoundsTime = useSharedValue(0);

  // useRunOnJS memoizes via this dependency array; leaving it off previously
  // meant a new native binding was created on every render, which forces
  // useFrameProcessor below to reset the Camera's whole Frame Processor
  // Context every render (see the matching comment in NewScan.js). Callers
  // must pass stable onFaceStateChange/onFaceBoundsChange for this to hold.
  const notifyFaceState = useRunOnJS(detected => {
    if (onFaceStateChange) {
      onFaceStateChange(detected);
    }
  }, [onFaceStateChange]);

  const notifyFaceBounds = useRunOnJS(bounds => {
    if (onFaceBoundsChange) {
      onFaceBoundsChange(bounds);
    }
  }, [onFaceBoundsChange]);


  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const now = Date.now();

      const frameWidth = frame.width;
      const frameHeight = frame.height;

      if (
        !isLocationReady.value ||
        isModalVisible.value
      ) {
        return;
      }

      const shouldCropFlag = isReadyToCapture.value ? 'true' : 'false';
      const facesResult = xyzFrameProcessor?.call(frame, { shouldCrop: shouldCropFlag });

      const isLandscapeBuffer = frameWidth > frameHeight;
      const pWidth = isLandscapeBuffer ? frameHeight : frameWidth;
      const pHeight = isLandscapeBuffer ? frameWidth : frameHeight;
      const minFaceDim = pWidth * 0.08;

      // Extract faces list
      const rawFacesList = Array.isArray(facesResult)
        ? facesResult
        : typeof facesResult === 'object' && facesResult !== null && Array.isArray(facesResult.faces)
          ? facesResult.faces
          : typeof facesResult === 'object' && facesResult !== null && facesResult.bounds
            ? [facesResult]
            : [];

      // Map face bounds to portrait screen coordinates with robust clamping
      const validFaces = rawFacesList.map(f => {
        if (!f || !f.bounds) return f;
        const b = f.bounds;
        const rawX = b.x ?? 0;
        const rawY = b.y ?? 0;
        const rawW = b.width ?? 0;
        const rawH = b.height ?? 0;

        const rw = Math.min(pWidth, Math.max(20, rawW));
        const rh = Math.min(pHeight, Math.max(20, rawH));
        const rx = Math.max(0, Math.min(pWidth - rw, rawX));
        const ry = Math.max(0, Math.min(pHeight - rh, rawY));

        const isCutOffAtEdge = (rawX <= 3 || rawY <= 3 || (rawX + rawW) >= (pWidth - 3) || (rawY + rawH) >= (pHeight - 3));

        return {
          ...f,
          isCutOffAtEdge,
          portraitBounds: {
            x: rx,
            y: ry,
            width: rw,
            height: rh,
          }
        };
      }).filter(f => {
        if (!f || !f.portraitBounds) return false;
        const fw = f.portraitBounds.width;
        const fh = f.portraitBounds.height;
        return fw >= minFaceDim && fh >= minFaceDim;
      });

      const numFaces = validFaces.length;

      if (numFaces > 0) {
        lastFaceSeenTime.value = now;
        markActive();

        if (!isFaceDetected.value) {
          isFaceDetected.value = true;
          notifyFaceState(true);
        }

        if (numFaces > 1) {
          if (now - lastStatusUpdate.value > 1000) {
            handleUpdateState('Multiple Face Detected', false, false);
            lastStatusUpdate.value = now;
          }
          isProcessingFrame.value = false;
          return;
        }

        const face = validFaces[0];
        const pb = face.portraitBounds;

        if (pb) {
          if (now - lastNotifyBoundsTime.value > 30) {
            lastNotifyBoundsTime.value = now;
            notifyFaceBounds(face);
          }

          const edgeMargin = pWidth * 0.02;
          const maxRight = pWidth - edgeMargin;
          const maxBottom = pHeight - edgeMargin;

          const centerX = pWidth / 2.0;
          const centerY = pHeight / 2.2;
          const centerToleranceX = pWidth * 0.22;
          const centerToleranceY = pHeight * 0.25;

          const minFaceDim = pWidth * 0.16;
          const maxFaceDimW = pWidth * 0.82;
          const maxFaceDimH = pHeight * 0.68;

          // 1. Edge Cutoff Check: Reject partially visible / clipped faces
          if (
            face.isCutOffAtEdge ||
            pb.x < edgeMargin ||
            pb.y < edgeMargin ||
            (pb.x + pb.width) > maxRight ||
            (pb.y + pb.height) > maxBottom
          ) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Center your face within frame', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          // 2. Off-Center Alignment Check: Ensure face center is in visible camera view
          const faceCenterX = pb.x + pb.width / 2;
          const faceCenterY = pb.y + pb.height / 2;

          if (
            Math.abs(faceCenterX - centerX) > centerToleranceX ||
            Math.abs(faceCenterY - centerY) > centerToleranceY
          ) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Align face in center of frame', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          if (pb.width < minFaceDim || pb.height < minFaceDim) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Move closer to the camera', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          // 4. Distance Check: Reject face if too close to camera
          if (pb.width > maxFaceDimW || pb.height > maxFaceDimH) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Move further back from camera', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          // 4. Strict Head & Eye Gaze Pose Angle Check (roll, pitch, yaw - max 16 deg allowed for direct camera gaze)
          const roll = face?.rollAngle ?? face?.headEulerAngleZ ?? 0;
          const pitch = face?.pitchAngle ?? face?.headEulerAngleX ?? 0;
          const yaw = face?.yawAngle ?? face?.headEulerAngleY ?? 0;

          if (Math.abs(roll) > 16 || Math.abs(pitch) > 16 || Math.abs(yaw) > 16) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Look directly into the camera', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          // 5. Eye Open & Direct Gaze Liveness Check (probability >= 0.35)
          const leftEyeProb = face?.leftEyeOpenProbability;
          const rightEyeProb = face?.rightEyeOpenProbability;
          if (
            typeof leftEyeProb === 'number' &&
            typeof rightEyeProb === 'number' &&
            (leftEyeProb < 0.35 || rightEyeProb < 0.35)
          ) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Look directly into the camera', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }

          // 6. Facial Landmark Eye Gaze Symmetry Check (staring straight at lens)
          const lm = face?.landmarks;
          if (lm && lm.LEFT_EYE && lm.RIGHT_EYE && lm.NOSE_BASE) {
            const leftX = lm.LEFT_EYE.x;
            const rightX = lm.RIGHT_EYE.x;
            const noseX = lm.NOSE_BASE.x;
            const dLeft = Math.abs(noseX - leftX);
            const dRight = Math.abs(rightX - noseX);

            if (dRight > 0) {
              const gazeRatio = dLeft / dRight;
              if (gazeRatio < 0.68 || gazeRatio > 1.48) {
                if (now - lastStatusUpdate.value > 1000) {
                  handleUpdateState('Look directly into the camera', false, false);
                  lastStatusUpdate.value = now;
                }
                isProcessingFrame.value = false;
                return;
              }
            }
          }

          // 6. Handheld Motion Shake Check (allow normal handheld motion up to 65px displacement)
          if (lastFaceX.value >= 0 && lastFaceY.value >= 0) {
            const dx = Math.abs(pb.x - lastFaceX.value);
            const dy = Math.abs(pb.y - lastFaceY.value);
            if (dx > 65 || dy > 65) {
              lastFaceX.value = pb.x;
              lastFaceY.value = pb.y;
              if (now - lastStatusUpdate.value > 1000) {
                handleUpdateState('Hold steady (camera moving)', false, false);
                lastStatusUpdate.value = now;
              }
              isProcessingFrame.value = false;
              return;
            }
          }
          lastFaceX.value = pb.x;
          lastFaceY.value = pb.y;

          // 7. Real-Time Blur & Focus Check (Threshold 25.0 for front camera)
          const BLUR_THRESHOLD = 25.0;
          if (
            typeof face?.blurScore !== 'number' ||
            face.blurScore <= 0 ||
            face.blurScore < BLUR_THRESHOLD
          ) {
            if (now - lastStatusUpdate.value > 1000) {
              handleUpdateState('Hold camera steady (blurry image)', false, false);
              lastStatusUpdate.value = now;
            }
            isProcessingFrame.value = false;
            return;
          }
        }

        if (isProcessingFrame.value) {
          if (now - lastProcessingTime.value > 2500) {
            isProcessingFrame.value = false;
            isReadyToCapture.value = false;
          } else {
            return;
          }
        }

        if (!isReadyToCapture.value) {
          isReadyToCapture.value = true;
          return;
        }

        try {
          const croppedBase64 = face?.croppedBase64;

          if (croppedBase64) {
            isProcessingFrame.value = true;
            lastProcessingTime.value = now;
            handleUpdateState('Processing your face...', true, false);
            processFace(croppedBase64, face?.rollAngle ?? 0);
          }
        } catch (err) {
          isProcessingFrame.value = false;
          console.log('Worklet Error:', err?.message || err);
        } finally {
          isReadyToCapture.value = false;
        }
      } else {
        if (isFaceDetected.value && now - lastFaceSeenTime.value > 300) {
          isFaceDetected.value = false;
          notifyFaceState(false);
        }


        if (now - lastStatusUpdate.value > 1500) {
          handleUpdateState(
            'Please align your face within the frame',
            false,
            false,
          );
          lastStatusUpdate.value = now;
        }
        isProcessingFrame.value = false;
      }
    },
    [markActive, handleUpdateState, processFace, notifyFaceState, notifyFaceBounds],
  );

  return {
    frameProcessor,
    isProcessingFrame,
  };
};
