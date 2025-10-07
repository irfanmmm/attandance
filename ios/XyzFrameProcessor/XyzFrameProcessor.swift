import VisionCamera
// add this only if you installed MLKit pods
import MLKitFaceDetection
import MLKitVision

@objc(XyzFrameProcessorPlugin)
public class XyzFrameProcessorPlugin: FrameProcessorPlugin {
  private var detector: FaceDetector
    private var lastFaceCount = 0
    private var frameSkipCounter = 0
    private var isProcessing = false
  
  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]? = nil) {
    // here `options` is the JS dictionary, ignore or read values from it
    let detectorOptions = FaceDetectorOptions()
    detectorOptions.performanceMode = .accurate
    detectorOptions.landmarkMode = .none
    detectorOptions.classificationMode = .none

    self.detector = FaceDetector.faceDetector(options: detectorOptions)

    super.init(proxy: proxy, options: options)
  }
  

  public override func callback(_ frame: Frame!, withArguments arguments: [AnyHashable : Any]!) -> Any! {
    // ✅ Directly access buffer (CMSampleBuffer is non-optional)
    let buffer = frame.buffer

    let visionImage = VisionImage(buffer: buffer)
    visionImage.orientation = .up // adjust if needed

    detector.process(visionImage) { faces, error in
      if let error = error {
        self.lastFaceCount = 0
        print("Face detection failed: \(error)")
        return
      }

      self.lastFaceCount = faces?.count ?? 0
      print("Detected \(self.lastFaceCount) faces")
    }

    return ["faces": lastFaceCount, "status": "processing"]
  }
  

}
