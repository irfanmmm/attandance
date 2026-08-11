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
  model: 'fast',
});

/**
 * Custom hook for face scanning frame processing logic.
 *
 * @param {Object} params
 * @param {import('react-native-worklets-core').SharedValue<boolean>} params.isLocationReady - Whether location is ready
 * @param {import('react-native-worklets-core').SharedValue<boolean>} params.isModalVisible - Whether onboarding modal is visible
 * @param {Function} params.markActive - Function to update activity timestamp
 * @param {Function} params.handleUpdateState - Function to update UI status
 * @param {Function} params.processFace - Function to handle the captured face base64
 * @returns {Object} { frameProcessor, isProcessingFrame }
 */
export const useScanFrameProcessor = ({
  isLocationReady,
  isModalVisible,
  isProcessingFrame,
  markActive,
  handleUpdateState,
  processFace,
}) => {
  const lastStatusUpdate = useSharedValue(0);
  const lastDetectionTime = useSharedValue(0);

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const now = Date.now();

      // 1. Initial Guards
      if (
        !isLocationReady.value ||
        isProcessingFrame.value ||
        isModalVisible.value
      ) {
        return;
      }

      // 2. Throttling (200ms = 5 FPS)
      if (now - lastDetectionTime.value < 200) return;
      lastDetectionTime.value = now;

      // 3. Face Detection
      const faces = xyzFrameProcessor?.call(frame);


      if (Array.isArray(faces) && faces.length > 0) {
        markActive();

        // Handle Multiple Faces
        if (faces.length > 1) {
          if (now - lastStatusUpdate.value > 1000) {
            handleUpdateState('Multiple Face Detected', false, false);
            lastStatusUpdate.value = now;
          }
          isProcessingFrame.value = false;
          return;
        }

        const face = faces[0];
        console.log(face.bounds, '******')

        if (!face?.bounds) {
          isProcessingFrame.value = false;
          return;
        }



        // const { x, y, width: w, height: h } = face.bounds;
        // const faceCenterX = x + w / 2;
        // const faceCenterY = y + h / 2;

        // const isPortraitFrame = frameHeight > frameWidth;
        // const fWidth = isPortraitFrame ? frameWidth : frameHeight;
        // const fHeight = isPortraitFrame ? frameHeight : frameWidth;

        // const frameCenterX = fWidth / 2;
        // const frameCenterY = fHeight / 2;

        // const scale = Math.max(SCREEN_WIDTH / fWidth, SCREEN_HEIGHT / fHeight);
        // const allowedHalfSize = UI_FRAME_SIZE / scale / 2;

        // const isWithinSquare =
        //   Math.abs(faceCenterX - frameCenterX) <= allowedHalfSize &&
        //   Math.abs(faceCenterY - frameCenterY) <= allowedHalfSize;

        // if (!isWithinSquare) {
        //   if (now - lastStatusUpdate.value > 1000) {
        //     handleUpdateState(
        //       'Please align your face within the frame',
        //       false,
        //       false,
        //     );
        //     lastStatusUpdate.value = now;
        //   }
        //   isProcessingFrame.value = false;
        //   return;
        // }

        try {
          isProcessingFrame.value = true;
          handleUpdateState('Processing your face...', true, false);

          const result = crop(frame, {
            includeImageBase64: true,
            saveAsFile: false,
          });

          if (result?.base64) {
            processFace(result.base64);
          } else {
            isProcessingFrame.value = false;
          }
        } catch (err) {
          isProcessingFrame.value = false;
          console.log('Worklet Error:', err);
        }
      } else {
        // 5. Idle/No-Face Feedback (Throttled to 1.5s)
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
    [markActive, handleUpdateState, processFace],
  );

  return {
    frameProcessor,
    isProcessingFrame,
  };
};
