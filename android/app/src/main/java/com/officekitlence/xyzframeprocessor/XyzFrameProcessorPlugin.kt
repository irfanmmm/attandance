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

        // Pre-warm Google MLKit native C++ delegates on plugin initialization
        try {
            val dummyBitmap = android.graphics.Bitmap.createBitmap(32, 32, android.graphics.Bitmap.Config.ARGB_8888)
            val dummyImage = com.google.mlkit.vision.common.InputImage.fromBitmap(dummyBitmap, 0)
            faceDetector?.process(dummyImage)
        } catch (e: Exception) {
            Log.d(TAG, "MLKit warmup: ${e.message}")
        }
    }

    private fun getImageOrientation(): Int {
        return if (cameraFacing == Position.FRONT) 270 else 90
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
        try {
            val rotation = getImageOrientation()
            val image = InputImage.fromMediaImage(mediaImage, rotation)
            val isPortrait = rotation == 270 || rotation == 90
            val width = if (isPortrait) image.height.toDouble() else image.width.toDouble()
            val height = if (isPortrait) image.width.toDouble() else image.height.toDouble()

            val detector = faceDetector ?: return emptyList<Any>()
            val faces = com.google.android.gms.tasks.Tasks.await(detector.process(image))
            if (faces.isNullOrEmpty()) {
                livenessDetector.reset()
                return emptyList<Any>()
            }

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

            val shouldCrop = params?.get("shouldCrop")?.toString() != "false"

            resultList.forEachIndexed { index, faceData ->
                val livenessResult =
                        livenessDetector.analyzeLiveness(faceData.toMutableMap())
                
                val rawFace = faces.getOrNull(index)
                val blurScore = if (rawFace != null) calculateYBufferBlurScore(mediaImage, rawFace.boundingBox) else 0.0

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
                            put("blurScore", blurScore)
                            put("isBlurry", blurScore < 25.0)

                            if (shouldCrop && rawFace != null) {
                                val croppedBase64 = cropFaceBase64(mediaImage, rawFace.boundingBox, getImageOrientation())
                                if (croppedBase64 != null) {
                                    put("croppedBase64", croppedBase64)
                                }
                            }
                        }

                resultList[index] = updatedFaceData
            }

            return resultList
        } catch (e: Exception) {
            Log.e(TAG, "Error processing frame: ", e)
            return emptyList<Any>()
        } finally {
            mediaImage.close()
        }
    }

    private fun yuv420ThreePlanesToNV21(planes: Array<android.media.Image.Plane>, width: Int, height: Int): ByteArray {
        val imageSize = width * height
        val out = ByteArray(imageSize + 2 * (imageSize / 4))

        val yBuffer = planes[0].buffer
        val uBuffer = planes[1].buffer
        val vBuffer = planes[2].buffer

        val rowStrideY = planes[0].rowStride
        val pixelStrideY = planes[0].pixelStride
        val rowStrideU = planes[1].rowStride
        val pixelStrideU = planes[1].pixelStride
        val rowStrideV = planes[2].rowStride
        val pixelStrideV = planes[2].pixelStride

        var outputOffset = 0
        if (rowStrideY == width && pixelStrideY == 1) {
            yBuffer.get(out, 0, imageSize)
            outputOffset = imageSize
        } else {
            for (row in 0 until height) {
                yBuffer.position(row * rowStrideY)
                yBuffer.get(out, outputOffset, width)
                outputOffset += width
            }
        }

        val uvHeight = height / 2
        val uvWidth = width / 2
        for (row in 0 until uvHeight) {
            for (col in 0 until uvWidth) {
                val vIndex = row * rowStrideV + col * pixelStrideV
                val uIndex = row * rowStrideU + col * pixelStrideU
                out[outputOffset++] = vBuffer.get(vIndex)
                out[outputOffset++] = uBuffer.get(uIndex)
            }
        }
        return out
    }

    private fun mediaImageToUprightBitmap(mediaImage: android.media.Image, rotationDegrees: Int): android.graphics.Bitmap? {
        return try {
            val width = mediaImage.width
            val height = mediaImage.height
            val planes = mediaImage.planes
            val nv21Buffer = yuv420ThreePlanesToNV21(planes, width, height)

            val yuvImage = android.graphics.YuvImage(nv21Buffer, android.graphics.ImageFormat.NV21, width, height, null)
            val out = java.io.ByteArrayOutputStream()
            yuvImage.compressToJpeg(android.graphics.Rect(0, 0, width, height), 100, out)
            val imageBytes = out.toByteArray()
            val rawBitmap = android.graphics.BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size) ?: return null

            val matrix = android.graphics.Matrix()
            if (rotationDegrees != 0) {
                matrix.postRotate(rotationDegrees.toFloat())
            }

            val uprightBitmap = android.graphics.Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.width, rawBitmap.height, matrix, true)
            if (uprightBitmap != rawBitmap) {
                rawBitmap.recycle()
            }
            uprightBitmap
        } catch (e: Exception) {
            Log.e(TAG, "Error converting mediaImage to upright bitmap", e)
            null
        }
    }

    private fun cropFaceBase64(mediaImage: android.media.Image, boundingBox: android.graphics.Rect, rotationDegrees: Int): String? {
        try {
            val imgW = mediaImage.width
            val imgH = mediaImage.height

            val padW = (boundingBox.width() * 0.05).toInt()
            val padH = (boundingBox.height() * 0.05).toInt()

            // Map 270-rotated boundingBox back to raw landscape YUV space
            val rawLeft = (imgW - (boundingBox.bottom + padH)).coerceIn(0, imgW - 1)
            val rawTop = (boundingBox.left - padW).coerceIn(0, imgH - 1)
            val rawRight = (imgW - (boundingBox.top - padH)).coerceIn(rawLeft + 2, imgW)
            val rawBottom = (boundingBox.right + padW).coerceIn(rawTop + 2, imgH)

            val rawCropRect = android.graphics.Rect(rawLeft, rawTop, rawRight, rawBottom)
            if (rawCropRect.width() <= 10 || rawCropRect.height() <= 10) return null

            val planes = mediaImage.planes
            val nv21Buffer = yuv420ThreePlanesToNV21(planes, imgW, imgH)
            val yuvImage = android.graphics.YuvImage(nv21Buffer, android.graphics.ImageFormat.NV21, imgW, imgH, null)

            val cropOutputStream = java.io.ByteArrayOutputStream()
            yuvImage.compressToJpeg(rawCropRect, 90, cropOutputStream)
            val cropBytes = cropOutputStream.toByteArray()
            val rawCropBitmap = android.graphics.BitmapFactory.decodeByteArray(cropBytes, 0, cropBytes.size) ?: return null

            val matrix = android.graphics.Matrix()
            if (rotationDegrees != 0) {
                matrix.postRotate(rotationDegrees.toFloat())
            }

            val uprightCropBitmap = android.graphics.Bitmap.createBitmap(rawCropBitmap, 0, 0, rawCropBitmap.width, rawCropBitmap.height, matrix, true)
            if (uprightCropBitmap != rawCropBitmap) {
                rawCropBitmap.recycle()
            }

            val targetSize = 160
            val resizedBitmap = android.graphics.Bitmap.createScaledBitmap(uprightCropBitmap, targetSize, targetSize, true)
            if (resizedBitmap != uprightCropBitmap) {
                uprightCropBitmap.recycle()
            }

            val finalOutputStream = java.io.ByteArrayOutputStream()
            resizedBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 75, finalOutputStream)
            val byteArray = finalOutputStream.toByteArray()
            return android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.e(TAG, "Error cropping face bitmap", e)
            return null
        }
    }

    private fun calculateYBufferBlurScore(mediaImage: android.media.Image, boundingBox: android.graphics.Rect): Double {
        try {
            val planes = mediaImage.planes
            if (planes.isEmpty()) return 0.0
            val yBuffer = planes[0].buffer
            val rowStride = planes[0].rowStride
            val pixelStride = planes[0].pixelStride
            val imgWidth = mediaImage.width
            val imgHeight = mediaImage.height
            val rotation = getImageOrientation()
            val (mappedLeft, mappedTop, mappedRight, mappedBottom) = when (rotation) {
                270 -> listOf(
                    imgWidth - boundingBox.bottom,
                    boundingBox.left,
                    imgWidth - boundingBox.top,
                    boundingBox.right
                )
                90 -> listOf(
                    boundingBox.top,
                    imgHeight - boundingBox.right,
                    boundingBox.bottom,
                    imgHeight - boundingBox.left
                )
                else -> listOf(boundingBox.left, boundingBox.top, boundingBox.right, boundingBox.bottom)
            }

            val cropLeft = mappedLeft.coerceIn(1, imgWidth - 2)
            val cropTop = mappedTop.coerceIn(1, imgHeight - 2)
            val cropRight = mappedRight.coerceIn(cropLeft + 2, imgWidth - 1)
            val cropBottom = mappedBottom.coerceIn(cropTop + 2, imgHeight - 1)

            val cropWidth = cropRight - cropLeft
            val cropHeight = cropBottom - cropTop
            if (cropWidth <= 4 || cropHeight <= 4) return 0.0

            var sumGrad = 0.0
            var count = 0.0

            for (y in cropTop until cropBottom - 1 step 3) {
                val r0 = (y - 1) * rowStride
                val r1 = y * rowStride
                val r2 = (y + 1) * rowStride
                for (x in cropLeft until cropRight - 1 step 3) {
                    val p00 = (yBuffer.get(r0 + (x - 1) * pixelStride).toInt() and 0xFF)
                    val p02 = (yBuffer.get(r0 + (x + 1) * pixelStride).toInt() and 0xFF)
                    val p10 = (yBuffer.get(r1 + (x - 1) * pixelStride).toInt() and 0xFF)
                    val p12 = (yBuffer.get(r1 + (x + 1) * pixelStride).toInt() and 0xFF)
                    val p20 = (yBuffer.get(r2 + (x - 1) * pixelStride).toInt() and 0xFF)
                    val p22 = (yBuffer.get(r2 + (x + 1) * pixelStride).toInt() and 0xFF)
                    val p01 = (yBuffer.get(r0 + x * pixelStride).toInt() and 0xFF)
                    val p21 = (yBuffer.get(r2 + x * pixelStride).toInt() and 0xFF)

                    val gx = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20)
                    val gy = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02)

                    sumGrad += (gx * gx + gy * gy).toDouble()
                    count += 1.0
                }
            }

            if (count <= 0) return 0.0
            return sumGrad / count
        } catch (e: Exception) {
            return 0.0
        }
    }
}
