import android.util.Log
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.abs

private const val TAG = "LivenessDetection"

class LivenessDetector {
    
    // Track movement over time
    private var previousYaw = 0f
    private var previousPitch = 0f
    private var previousRoll = 0f
    private var previousEyeState = EyeState.CLOSED
    private var blinkCount = AtomicInteger(0)
    private var headMovementCount = AtomicInteger(0)
    private var frameCount = AtomicInteger(0)
    
    // Thresholds
    private val YAW_THRESHOLD = 15f      // Head left/right movement
    private val PITCH_THRESHOLD = 15f    // Head up/down movement
    private val ROLL_THRESHOLD = 15f     // Head tilt movement
    private val BLINK_THRESHOLD = 0.3f   // Eye probability threshold
    private val REQUIRED_BLINKS = 2      // Minimum blinks for liveness
    private val REQUIRED_HEAD_MOVES = 3  // Minimum head movements
    
    data class LivenessResult(
        val isLive: Boolean,
        val confidence: Double,
        val blinkDetected: Boolean,
        val headMovementDetected: Boolean,
        val blinkCount: Int,
        val headMovementCount: Int,
        val details: String
    )
    
    enum class EyeState {
        OPEN, CLOSED
    }
    
    fun analyzeLiveness(faceData: MutableMap<String, Any>): LivenessResult {
        frameCount.incrementAndGet()
        
        val yawAngle = (faceData["yawAngle"] as? Double)?.toFloat() ?: 0f
        val pitchAngle = (faceData["pitchAngle"] as? Double)?.toFloat() ?: 0f
        val rollAngle = (faceData["rollAngle"] as? Double)?.toFloat() ?: 0f
        val leftEyeOpen = (faceData["leftEyeOpenProbability"] as? Double) ?: 0.0
        val rightEyeOpen = (faceData["rightEyeOpenProbability"] as? Double) ?: 0.0
        val smilingProbability = (faceData["smilingProbability"] as? Double) ?: -1.0
        
        val avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2
        
        // Debug: Log eye values every 10 frames
        if (frameCount.get() % 10 == 0) {
            Log.d(TAG, "DEBUG - LeftEye: $leftEyeOpen, RightEye: $rightEyeOpen, Avg: $avgEyeOpen, Threshold: $BLINK_THRESHOLD")
        }
        
        // Detect blinks - check for significant DROP in eye probability
        val currentEyeState = if (avgEyeOpen > BLINK_THRESHOLD) {
            EyeState.OPEN
        } else {
            EyeState.CLOSED
        }
        
        // Blink: transition from OPEN to CLOSED
        if (previousEyeState == EyeState.OPEN && currentEyeState == EyeState.CLOSED) {
            blinkCount.incrementAndGet()
            Log.d(TAG, "✅ BLINK DETECTED! Total: ${blinkCount.get()}, Avg Eye: $avgEyeOpen")
        }
        previousEyeState = currentEyeState
        
        // Detect head movement
        val yawDiff = abs(yawAngle - previousYaw)
        val pitchDiff = abs(pitchAngle - previousPitch)
        val rollDiff = abs(rollAngle - previousRoll)
        
        if (yawDiff > YAW_THRESHOLD || pitchDiff > PITCH_THRESHOLD || rollDiff > ROLL_THRESHOLD) {
            headMovementCount.incrementAndGet()
            Log.d(TAG, "✅ Head movement detected! Yaw: $yawDiff°, Pitch: $pitchDiff°, Roll: $rollDiff°")
        }
        
        previousYaw = yawAngle
        previousPitch = pitchAngle
        previousRoll = rollAngle
        
        // Calculate liveness score
        val blinkScore = (blinkCount.get().toFloat() / REQUIRED_BLINKS.toFloat()).coerceIn(0f, 1f)
        val movementScore = (headMovementCount.get().toFloat() / REQUIRED_HEAD_MOVES.toFloat()).coerceIn(0f, 1f)
        val confidence = (blinkScore + movementScore) / 2f
        
        val isLive = blinkCount.get() >= REQUIRED_BLINKS && headMovementCount.get() >= REQUIRED_HEAD_MOVES
        
        val details = """
            Frame: ${frameCount.get()}, Blinks: ${blinkCount.get()}/$REQUIRED_BLINKS, 
            HeadMoves: ${headMovementCount.get()}/$REQUIRED_HEAD_MOVES, 
            EyeOpen: ${String.format("%.2f", (leftEyeOpen + rightEyeOpen) / 2)},
            Smile: ${String.format("%.2f", smilingProbability)},
            Confidence: ${String.format("%.2f", confidence)}
        """.trimIndent()
        
        Log.d(TAG, details)
        
        return LivenessResult(
            isLive = isLive,
            confidence = confidence.toDouble(),
            blinkDetected = blinkCount.get() > 0,
            headMovementDetected = headMovementCount.get() > 0,
            blinkCount = blinkCount.get(),
            headMovementCount = headMovementCount.get(),
            details = details
        )
    }
    
    fun reset() {
        blinkCount.set(0)
        headMovementCount.set(0)
        frameCount.set(0)
        previousYaw = 0f
        previousPitch = 0f
        previousRoll = 0f
        previousEyeState = EyeState.CLOSED
        Log.d(TAG, "🔄 Liveness detection reset")
    }
    
    fun getStatus(): String {
        return "Blinks: ${blinkCount.get()}, HeadMoves: ${headMovementCount.get()}, Frames: ${frameCount.get()}"
    }
}

// Alternative: Quick liveness check (per frame)
fun quickLivenessCheck(faceData: Map<String, Any>): Map<String, Any> {
    val leftEyeOpen = (faceData["leftEyeOpenProbability"] as? Double) ?: -1.0
    val rightEyeOpen = (faceData["rightEyeOpenProbability"] as? Double) ?: -1.0
    val smilingProbability = (faceData["smilingProbability"] as? Double) ?: -1.0
    val yawAngle = (faceData["yawAngle"] as? Double) ?: 0.0
    val pitchAngle = (faceData["pitchAngle"] as? Double) ?: 0.0
    val rollAngle = (faceData["rollAngle"] as? Double) ?: 0.0
    
    val avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2
    val isEyeOpen = avgEyeOpen > 0.5
    val isSmiling = smilingProbability > 0.5
    val hasHeadVariation = abs(yawAngle) > 10 || abs(pitchAngle) > 10 || abs(rollAngle) > 10
    
    return mapOf(
        "isLive" to (isEyeOpen && hasHeadVariation),
        "eyeOpen" to isEyeOpen,
        "smiling" to isSmiling,
        "hasHeadVariation" to hasHeadVariation,
        "eyeOpenScore" to avgEyeOpen,
        "smilingScore" to smilingProbability
    )
}