package com.officekitlence.xyzframeprocessor

import LivenessDetector
import android.util.Log
import android.view.Surface
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetector
import com.mrousavy.camera.core.types.Position
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

private const val TAG = "FaceDetector"

class XyzFrameProcessorPlugin(
        options: Map<String, Any>?,
        private val orientationManager: VisionCameraFaceDetectorOrientation
) : FrameProcessorPlugin() {

    private var autoMode = false
    private var faceDetector: FaceDetector? = null
    private var runLandmarks = false
    private var runClassifications = false
    private var runContours = false
    private var trackingEnabled = false
    private var windowWidth = 1.0
    private var windowHeight = 1.0
    private var cameraFacing: Position = Position.FRONT
    private val common = FaceDetectorCommon()

    init {
        autoMode = options?.get("autoMode").toString() == "true"
        windowWidth = (options?.get("windowWidth") ?: 1.0) as Double
        windowHeight = (options?.get("windowHeight") ?: 1.0) as Double

        if (options?.get("cameraFacing").toString() == "back") {
            cameraFacing = Position.BACK
        }

        val faceDetectorResult = common.getFaceDetector(options)
        runLandmarks = faceDetectorResult.runLandmarks
        runClassifications = faceDetectorResult.runClassifications
        runContours = faceDetectorResult.runContours
        trackingEnabled = faceDetectorResult.trackingEnabled
        faceDetector = faceDetectorResult.faceDetector
    }

    private fun getImageOrientation(): Int {
        return when (orientationManager.orientation) {
            // device is portrait
            Surface.ROTATION_0 -> if (cameraFacing == Position.FRONT) 270 else 90
            // device is landscape right
            Surface.ROTATION_270 -> if (cameraFacing == Position.FRONT) 180 else 180
            // device is upside down
            Surface.ROTATION_180 -> if (cameraFacing == Position.FRONT) 90 else 270
            // device is landscape left
            Surface.ROTATION_90 -> if (cameraFacing == Position.FRONT) 0 else 0
            else -> 0
        }
    }

    // private val detector: FaceDetector by lazy {
    //     val opts =
    //             FaceDetectorOptions.Builder()
    //                     .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
    //                     .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
    //                     .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
    //                     .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
    //                     // .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
    //                     .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
    //                     .build()

    //     FaceDetection.getClient(opts)
    // }

    private val lastFaceCount = AtomicInteger(0)
    private val isProcessing = AtomicBoolean(false)
    private var frameSkipCounter = 0

    private var lastProcessedResult: Any? = ""
    private val processingJob = AtomicBoolean(false)
    private val livenessDetector = LivenessDetector()

    override fun callback(frame: Frame, params: Map<String, Any>?): Any {
        val mediaImage = frame.image
        val image = InputImage.fromMediaImage(mediaImage, getImageOrientation())
        val width = image.height.toDouble()
        val height = image.width.toDouble()

        if (!processingJob.getAndSet(true)) {
            faceDetector
                    ?.process(image)
                    ?.addOnSuccessListener { faces ->
                        try {

                            val resultList =
                                    common.processFaces(
                                            faces,
                                            runLandmarks,
                                            runClassifications,
                                            runContours,
                                            trackingEnabled,
                                            width,
                                            height,
                                            if (autoMode) windowWidth / width else 1.0,
                                            if (autoMode) windowHeight / height else 1.0,
                                            autoMode,
                                            cameraFacing,
                                            orientationManager.orientation
                                    )

                            resultList.forEachIndexed { index, faceData ->
                                val livenessResult =
                                        livenessDetector.analyzeLiveness(faceData.toMutableMap())

                                // Create new map with liveness data
                                val updatedFaceData =
                                        faceData.toMutableMap().apply {
                                            put(
                                                    "liveness",
                                                    mapOf(
                                                            "isLive" to livenessResult.isLive,
                                                            "confidence" to
                                                                    livenessResult.confidence,
                                                            "status" to livenessDetector.getStatus()
                                                    )
                                            )
                                        }

                                resultList[0] = updatedFaceData
                            }
                            if (resultList.size == 0) {
                                livenessDetector.reset()
                            }
                            lastProcessedResult = resultList
                            Log.d(TAG, "Result: $lastProcessedResult")
                        } catch (e: Exception) {
                            Log.e(TAG, "Error processing faces: ", e)
                            lastProcessedResult = mapOf("error" to e.message, "faceCount" to 0)
                        } finally {
                            processingJob.set(false)
                            mediaImage.close()
                        }
                    }
                    ?.addOnFailureListener { e ->
                        Log.e(TAG, "Face detection failed: ", e)
                        lastProcessedResult = mapOf("error" to e.message, "faceCount" to 0)
                        processingJob.set(false)
                        mediaImage.close()
                    }
        } else {
            mediaImage.close()
        }

        Log.d(TAG, "Returning cached result: $lastProcessedResult")
        return lastProcessedResult ?: mapOf("faceCount" to 0)
    }
}
