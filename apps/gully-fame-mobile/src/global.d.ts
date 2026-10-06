declare const global: typeof globalThis;

declare module 'react-native-vision-camera' {
  export const Camera: React.ComponentType<any>;
  export const useCameraDevice: (facing: 'front' | 'back') => any;
  export const usePhotoOutput: () => any;
  export const useVideoOutput: (options: any) => any;
  export type CameraRef = any;
}

declare module 'react-native-razorpay' {
  const RazorpayCheckout: {
    open: (options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  export default RazorpayCheckout;
}
