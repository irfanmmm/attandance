#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#if __has_include("OfficeKitLence/OfficeKitLence-Swift.h")
#import "OfficeKitLence/OfficeKitLence-Swift.h"
#else
#import "FaceKit-Swift.h"
#endif

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(XyzFrameProcessorPlugin, xyz)
