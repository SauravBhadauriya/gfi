import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Camera,
  useCameraDevice,
  usePhotoOutput,
  useVideoOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { CameraModeEnum, FlashModeEnum } from '../utils/mediaTypes';

export interface CameraCaptureHandle {
  takePictureAsync: () => Promise<{ uri: string }>;
  recordAsync: () => Promise<{ uri: string; duration: number }>;
  stopRecording: () => Promise<void>;
}

interface VisionCameraSurfaceProps {
  style: StyleProp<ViewStyle>;
  facing: 'front' | 'back';
  mode: CameraModeEnum;
  flash: FlashModeEnum;
  zoom: number;
  isActive: boolean;
  onReady: () => void;
  onError: (error: { message?: string }) => void;
}

const VisionCameraSurface = forwardRef<CameraCaptureHandle, VisionCameraSurfaceProps>(function VisionCameraSurface(
  { style, facing, mode, flash, zoom, isActive, onReady, onError },
  forwardedRef,
) {
  const cameraRef = useRef<CameraRef>(null);
  const recorderRef = useRef<any>(null);
  const device = useCameraDevice(facing);
  const photoOutput = usePhotoOutput();
  const videoOutput = useVideoOutput({ enableAudio: true });

  useImperativeHandle(forwardedRef, () => ({
    takePictureAsync: async () => {
      const { filePath } = await photoOutput.capturePhotoToFile(
        { flashMode: flash === FlashModeEnum.On && device?.hasFlash ? 'on' : 'off' },
        {},
      );
      return { uri: filePath.startsWith('file://') ? filePath : `file://${filePath}` };
    },
    recordAsync: () => new Promise((resolve, reject) => {
      void (async () => {
        try {
          const recorder = await videoOutput.createRecorder({});
          recorderRef.current = recorder;
          await recorder.startRecording(
            (filePath: string) => {
              recorderRef.current = null;
              resolve({ uri: filePath.startsWith('file://') ? filePath : `file://${filePath}`, duration: 0 });
            },
            (error: Error) => {
              recorderRef.current = null;
              reject(error);
            },
          );
        } catch (error) {
          recorderRef.current = null;
          reject(error);
        }
      })();
    }),
    stopRecording: async () => {
      await recorderRef.current?.stopRecording();
    },
  }), [device?.hasFlash, flash, photoOutput, videoOutput]);

  return (
    <View style={[StyleSheet.absoluteFill, style]} collapsable={false}>
      {device && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          outputs={mode === CameraModeEnum.Photo ? [photoOutput] : [videoOutput]}
          isActive={isActive}
          torchMode={mode === CameraModeEnum.Video && flash === FlashModeEnum.On && device.hasTorch ? 'on' : 'off'}
          zoom={Math.min(Math.max(zoom, device.minZoom), device.maxZoom)}
          implementationMode="compatible"
          onPreviewStarted={onReady}
          onError={(error: { message?: string }) => onError({ message: error.message })}
        />
      )}
    </View>
  );
});

export default VisionCameraSurface;
