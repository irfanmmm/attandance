import VisionCamera
import MLKitFaceDetection
import MLKitVision
import CoreMedia
import UIKit

@objc(XyzFrameProcessorPlugin)
public class XyzFrameProcessorPlugin: FrameProcessorPlugin {
  private var detector: FaceDetector
  private let ciContext = CIContext(options: nil) // Reused once across frames
  private var isProcessing = false
  private var lastProcessedResult: Any? = ["faces": 0]

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]? = nil) {
    let detectorOptions = FaceDetectorOptions()
    detectorOptions.performanceMode = .fast
    detectorOptions.landmarkMode = .all
    detectorOptions.contourMode = .all
    detectorOptions.classificationMode = .all

    self.detector = FaceDetector.faceDetector(options: detectorOptions)
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame!, withArguments arguments: [AnyHashable : Any]!) -> Any! {
    guard let frame = frame else { return [] }
    let buffer = frame.buffer
    guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else { return [] }

    // 1. Map VisionCamera's frame.orientation -> CGImagePropertyOrientation
    let cgOrientation: CGImagePropertyOrientation
    switch String(describing: frame.orientation) {
    case "portrait":
      cgOrientation = .leftMirrored
    case "portraitUpsideDown", "portrait-upside-down":
      cgOrientation = .rightMirrored
    case "landscapeLeft", "landscape-left":
      cgOrientation = .downMirrored
    case "landscapeRight", "landscape-right":
      cgOrientation = .upMirrored
    default:
      cgOrientation = .leftMirrored
    }

    // 2. Physically rotate pixel buffer to upright ONCE before detection
    let rawCIImage = CIImage(cvPixelBuffer: imageBuffer).oriented(cgOrientation)
    guard let uprightCGImage = ciContext.createCGImage(rawCIImage, from: rawCIImage.extent) else {
      return []
    }
    let uprightUIImage = UIImage(cgImage: uprightCGImage)
    let portraitWidth = Double(uprightUIImage.size.width)
    let portraitHeight = Double(uprightUIImage.size.height)

    // 3. Detect on ALREADY-UPRIGHT image with orientation = .up
    let visionImage = VisionImage(image: uprightUIImage)
    visionImage.orientation = .up

    let shouldCrop = (arguments?["shouldCrop"] as? Bool) ?? true

    do {
      let faces = try detector.results(in: visionImage)
      guard !faces.isEmpty else { return [] }

      var facesData: [[String: Any]] = []

      for face in faces {
        var faceMap: [String: Any] = [:]
        let bounds = face.frame // Now in the SAME coordinate space as uprightUIImage

        let normalizedRect = CGRect(
          x: bounds.origin.x / portraitWidth,
          y: bounds.origin.y / portraitHeight,
          width: bounds.size.width / portraitWidth,
          height: bounds.size.height / portraitHeight
        )

        faceMap["bounds"] = [
          "x": Double(bounds.origin.x),
          "y": Double(bounds.origin.y),
          "width": Double(bounds.size.width),
          "height": Double(bounds.size.height),
          "left": Double(bounds.origin.x),
          "top": Double(bounds.origin.y),
          "right": Double(bounds.origin.x + bounds.size.width),
          "bottom": Double(bounds.origin.y + bounds.size.height),
          "normX": Double(normalizedRect.origin.x),
          "normY": Double(normalizedRect.origin.y),
          "normWidth": Double(normalizedRect.size.width),
          "normHeight": Double(normalizedRect.size.height)
        ]

        // 4. Crop directly from uprightUIImage with tight 5% padding margin
        if shouldCrop {
          let padW = bounds.width * 0.05
          let padH = bounds.height * 0.05

          let cropX = max(0, bounds.origin.x - padW)
          let cropY = max(0, bounds.origin.y - padH)
          let cropW = min(portraitWidth - cropX, bounds.width + padW * 2)
          let cropH = min(portraitHeight - cropY, bounds.height + padH * 2)

          if cropW > 10, cropH > 10 {
            let cropRect = CGRect(x: cropX, y: cropY, width: cropW, height: cropH)
            UIGraphicsBeginImageContextWithOptions(cropRect.size, false, 1.0)
            uprightUIImage.draw(at: CGPoint(x: -cropRect.origin.x, y: -cropRect.origin.y))
            let croppedUIImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()

            if let croppedUIImage = croppedUIImage {
              let targetSize: CGFloat = 160.0
              let renderer = UIGraphicsImageRenderer(size: CGSize(width: targetSize, height: targetSize))
              let resizedImage = renderer.image { _ in
                croppedUIImage.draw(in: CGRect(x: 0, y: 0, width: targetSize, height: targetSize))
              }

              if let jpegData = resizedImage.jpegData(compressionQuality: 0.75) {
                faceMap["croppedBase64"] = jpegData.base64EncodedString()
              }

              if let croppedCG = resizedImage.cgImage {
                let blurScore = self.calculateBlurScore(cgImage: croppedCG)
                faceMap["blurScore"] = blurScore
                faceMap["isBlurry"] = blurScore < 25.0
              } else {
                faceMap["blurScore"] = 0.0
                faceMap["isBlurry"] = true
              }
            }
          }
        }

        // Head Pose Angles
        faceMap["rollAngle"] = Double(face.headEulerAngleZ)
        faceMap["yawAngle"] = Double(face.headEulerAngleY)
        faceMap["pitchAngle"] = Double(face.headEulerAngleX)

        // Eye & Smile Probabilities
        let leftProb = Double(face.leftEyeOpenProbability)
        if !leftProb.isNaN { faceMap["leftEyeOpenProbability"] = leftProb }
        let rightProb = Double(face.rightEyeOpenProbability)
        if !rightProb.isNaN { faceMap["rightEyeOpenProbability"] = rightProb }
        let smileProb = Double(face.smilingProbability)
        if !smileProb.isNaN { faceMap["smilingProbability"] = smileProb }

        // Extract Normalized Landmarks
        var landmarksMap: [String: [String: Double]] = [:]

        if let leftEye = face.landmark(ofType: .leftEye) {
          landmarksMap["LEFT_EYE"] = [
            "x": Double(leftEye.position.x),
            "y": Double(leftEye.position.y),
            "normX": Double(leftEye.position.x) / portraitWidth,
            "normY": Double(leftEye.position.y) / portraitHeight
          ]
        }
        if let rightEye = face.landmark(ofType: .rightEye) {
          landmarksMap["RIGHT_EYE"] = [
            "x": Double(rightEye.position.x),
            "y": Double(rightEye.position.y),
            "normX": Double(rightEye.position.x) / portraitWidth,
            "normY": Double(rightEye.position.y) / portraitHeight
          ]
        }
        if let nose = face.landmark(ofType: .noseBase) {
          landmarksMap["NOSE_BASE"] = [
            "x": Double(nose.position.x),
            "y": Double(nose.position.y),
            "normX": Double(nose.position.x) / portraitWidth,
            "normY": Double(nose.position.y) / portraitHeight
          ]
        }
        if let leftMouth = face.landmark(ofType: .mouthLeft) {
          landmarksMap["MOUTH_LEFT"] = [
            "x": Double(leftMouth.position.x),
            "y": Double(leftMouth.position.y),
            "normX": Double(leftMouth.position.x) / portraitWidth,
            "normY": Double(leftMouth.position.y) / portraitHeight
          ]
        }
        if let rightMouth = face.landmark(ofType: .mouthRight) {
          landmarksMap["MOUTH_RIGHT"] = [
            "x": Double(rightMouth.position.x),
            "y": Double(rightMouth.position.y),
            "normX": Double(rightMouth.position.x) / portraitWidth,
            "normY": Double(rightMouth.position.y) / portraitHeight
          ]
        }

        faceMap["landmarks"] = landmarksMap
        facesData.append(faceMap)
      }

      return facesData
    } catch {
      return []
    }
  }

  private func calculateBlurScore(cgImage: CGImage) -> Double {
    let width = cgImage.width
    let height = cgImage.height
    guard width > 4, height > 4 else { return 0.0 }

    var pixelData = [UInt8](repeating: 0, count: width * height)
    let colorSpace = CGColorSpaceCreateDeviceGray()
    guard let context = CGContext(
      data: &pixelData,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: width,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.none.rawValue
    ) else {
      return 0.0
    }

    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

    var sumGrad: Double = 0.0
    let step = 2
    var count: Double = 0.0

    for y in stride(from: 1, to: height - 1, by: step) {
      let r0 = (y - 1) * width
      let r1 = y * width
      let r2 = (y + 1) * width
      for x in stride(from: 1, to: width - 1, by: step) {
        let p00 = Int(pixelData[r0 + x - 1])
        let p02 = Int(pixelData[r0 + x + 1])
        let p10 = Int(pixelData[r1 + x - 1])
        let p12 = Int(pixelData[r1 + x + 1])
        let p20 = Int(pixelData[r2 + x - 1])
        let p22 = Int(pixelData[r2 + x + 1])
        let p01 = Int(pixelData[r0 + x])
        let p21 = Int(pixelData[r2 + x])

        let gx = Double((p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20))
        let gy = Double((p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02))

        sumGrad += (gx * gx + gy * gy)
        count += 1.0
      }
    }

    guard count > 0 else { return 0.0 }
    return sumGrad / count
  }
}
