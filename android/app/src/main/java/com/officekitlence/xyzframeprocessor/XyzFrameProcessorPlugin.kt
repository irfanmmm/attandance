package com.officekitlence.xyzframeprocessor
import android.util.Log
import android.graphics.ImageFormat
import android.media.Image
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class XyzFrameProcessorPlugin(
    proxy: VisionCameraProxy,
    options: Map<String, Any>?
) : FrameProcessorPlugin() {

    private val detector: FaceDetector by lazy {
        val opts = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
            .build()

        FaceDetection.getClient(opts)
    }

    private val lastFaceCount = AtomicInteger(0)
    private val isProcessing = AtomicBoolean(false)
    private var frameSkipCounter = 0

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        return try {
            // Skip frames to reduce load and avoid "image closed" errors
            frameSkipCounter++
            if (frameSkipCounter % 5 != 0) { // Process every 15th frame
                return mapOf("faces" to lastFaceCount.get(), "status" to "skipped")
            }

            val image: Image? = frame.image
            if (image == null) {
                Log.w("FaceDetector", "No image in frame!")
                return mapOf("faces" to lastFaceCount.get(), "status" to "no_image")
            }

            // Skip if already processing
            if (!isProcessing.compareAndSet(false, true)) {
                return mapOf("faces" to lastFaceCount.get(), "status" to "busy")
            }

            try {
                // Create input image with minimal rotation (0 degrees)
                val inputImage = InputImage.fromMediaImage(image, 0)
                
                Log.d("FaceDetector", "Processing frame: ${image.width}x${image.height}")

                // Process synchronously for this frame
                detector.process(inputImage)
                .addOnCompleteListener { task ->
                        isProcessing.set(false)
                        if (task.isSuccessful) {
                            val faces = task.result ?: emptyList()

                            if (faces.isNotEmpty()) {
                                val face = faces[0] // take first face
                                val box = face.boundingBox

                                val frameWidth = inputImage.width
                                val frameHeight = inputImage.height

                                val faceWidth = box.width()
                                val faceHeight = box.height()

                                val widthRatio = faceWidth.toFloat() / frameWidth
                                val heightRatio = faceHeight.toFloat() / frameHeight

                                Log.d("FaceDetector", "✅ Face size ratio W=$widthRatio, H=$heightRatio")

                                // 🔒 Only allow capture if face is large enough (e.g., >40% width & height)
                                if (widthRatio > 0.2f && heightRatio > 0.2f) {
                                    Log.d("FaceDetector", "😀 Full face detected — ready to capture")
                                    
                                    lastFaceCount.set(faces.size)
                                } else {
                                  lastFaceCount.set(0)
                                    Log.d("FaceDetector", "⚠️ Face too small/partial, skipping")
                                }
                            } else {
                              lastFaceCount.set(0)
                                Log.d("FaceDetector", "❌ No faces detected")
                            }
                        } else {
                          isProcessing.set(false)
            lastFaceCount.set(0)
                            Log.e("FaceDetector", "❌ Face detection failed", task.exception)
                        }
                    }
                    // .addOnCompleteListener { task ->
                    //     isProcessing.set(false)
                    //     if (task.isSuccessful) {
                    //         val faces = task.result ?: emptyList()
                    //         lastFaceCount.set(faces.size)
                    //         Log.d("FaceDetector", "✅ Detected ${faces.size} faces")
                    //     } else {
                    //         Log.e("FaceDetector", "❌ Face detection failed", task.exception)
                    //     }
                    // }

                return mapOf(
            "faces" to lastFaceCount.get(),
            "status" to "processing",
            "timestamp" to System.currentTimeMillis().toInt()
        )

            } catch (e: Exception) {
                isProcessing.set(false)
                throw e
            }

        } catch (e: Exception) {
            Log.e("FaceDetector", "💥 Error in frame processor", e)
            return mapOf(
            "faces" to lastFaceCount.get(),
            "error" to (e.localizedMessage ?: "Unknown"),
            "status" to "error"
        )
        }
    }
}