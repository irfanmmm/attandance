package com.officekitlence.xyzframeprocessor

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

class XyzFrameProcessorPluginPackage : ReactPackage {
  companion object {
    private var orientationManager: VisionCameraFaceDetectorOrientation? = null
    init {
      FrameProcessorPluginRegistry.addFrameProcessorPlugin("xyz") { proxy, options ->
        if (orientationManager == null) {
          orientationManager = VisionCameraFaceDetectorOrientation(proxy.context)
        }
        XyzFrameProcessorPlugin(options, orientationManager!!)
      }
    }
  }

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return emptyList()
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
