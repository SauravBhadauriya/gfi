import type { FilterPreset } from "../types/filters";
import type { AdjustSettings } from "../types/voiceOverlay.types";

// Conditional import for FFmpeg - only available in development builds
let FFmpegKit: any = null;
let ReturnCode: any = null;
let isFFmpegAvailable = false;

try {
  const ffmpeg = require("ffmpeg-kit-react-native-community");
  FFmpegKit = ffmpeg.FFmpegKit;
  ReturnCode = ffmpeg.ReturnCode;
  isFFmpegAvailable = true;
} catch (e) {
  console.warn("FFmpeg not available in ffmpegFilters - filters will fail gracefully in Expo Go");
  isFFmpegAvailable = false;
}

// ... (Tumhara existing buildFFmpegFilterChain same rahega)
function buildFFmpegFilterChain(preset: FilterPreset): string {
  const filters: string[] = [];
  const eqParams: string[] = [];

  if (preset.brightness !== undefined && preset.brightness !== 0) {
    const brightnessValue = Math.max(-1.0, Math.min(1.0, preset.brightness));
    eqParams.push(`brightness=${brightnessValue}`);
  }
  if (preset.contrast !== undefined && preset.contrast !== 1.0) {
    const contrastValue = Math.max(0.0, Math.min(3.0, preset.contrast));
    eqParams.push(`contrast=${contrastValue}`);
  }
  if (preset.saturation !== undefined && preset.saturation !== 1.0) {
    const satValue = Math.max(0.0, Math.min(3.0, preset.saturation));
    eqParams.push(`saturation=${satValue}`);
  }
  if (preset.gamma !== undefined && preset.gamma !== 1.0) {
    const gammaValue = Math.max(0.1, Math.min(10.0, preset.gamma));
    eqParams.push(`gamma=${gammaValue}`);
  }
  if (eqParams.length > 0) {
    filters.push(`eq=${eqParams.join(":")}`);
  }

  if (preset.temperature !== undefined || preset.tint !== undefined) {
    const balanceParams: string[] = [];
    if (preset.temperature !== undefined && preset.temperature !== 0) {
      const tempValue = Math.max(-1.0, Math.min(1.0, preset.temperature));
      if (tempValue > 0) {
        balanceParams.push(`rs=${tempValue}`);
        balanceParams.push(`bs=-${tempValue}`);
      } else {
        balanceParams.push(`rs=${tempValue}`);
        balanceParams.push(`bs=${Math.abs(tempValue)}`);
      }
    }
    if (preset.tint !== undefined && preset.tint !== 0) {
      const tintValue = Math.max(-1.0, Math.min(1.0, preset.tint));
      if (tintValue > 0) {
        balanceParams.push(`rs=${tintValue * 0.5}`);
        balanceParams.push(`bs=${tintValue * 0.5}`);
        balanceParams.push(`gs=-${tintValue}`);
      } else {
        balanceParams.push(`rs=${tintValue * 0.5}`);
        balanceParams.push(`bs=${tintValue * 0.5}`);
        balanceParams.push(`gs=${Math.abs(tintValue)}`);
      }
    }
    if (balanceParams.length > 0) {
      filters.push(`colorbalance=${balanceParams.join(":")}`);
    }
  }

  if (preset.vignette) {
    const { angle, x0, y0 } = preset.vignette;
    const angleRad = (angle * Math.PI) / 180;
    const centerX = Math.max(0.0, Math.min(1.0, x0));
    const centerY = Math.max(0.0, Math.min(1.0, y0));
    filters.push(`vignette=angle=${angleRad}:x0=${centerX}:y0=${centerY}`);
  }

  if (preset.grain && preset.grain.strength > 0) {
    const strength = Math.max(0.0, Math.min(1.0, preset.grain.strength));
    const noiseStrength = strength * 20;
    filters.push(`noise=alls=${noiseStrength}:allf=t+u`);
  }

  return filters.length > 0 ? filters.join(",") : "";
}

/**
 * 🎨 Generate FFmpeg filter chain from AdjustSettings
 * Converts user-friendly adjustment values to FFmpeg parameters
 */
export function buildAdjustmentFilterChain(settings: AdjustSettings): string {
  const filters: string[] = [];
  
  // Collect eq parameters (brightness, contrast, saturation)
  const eqParams: string[] = [];
  
  if (settings.brightness !== 0) {
    // Brightness: -100 to +100 → -1.0 to +1.0
    const brightness = (settings.brightness / 100);
    eqParams.push(`brightness=${brightness.toFixed(2)}`);
  }
  
  if (settings.contrast !== 0) {
    // Contrast: -100 to +100 → 0.5 to 1.5 (1.0 is neutral)
    const contrast = 1.0 + (settings.contrast / 100);
    eqParams.push(`contrast=${contrast.toFixed(2)}`);
  }
  
  if (settings.saturation !== 0) {
    // Saturation: -100 to +100 → 0.0 to 2.0 (1.0 is neutral)
    const saturation = 1.0 + (settings.saturation / 100);
    eqParams.push(`saturation=${Math.max(0, saturation).toFixed(2)}`);
  }
  
  if (eqParams.length > 0) {
    filters.push(`eq=${eqParams.join(":")}`);
  }
  
  // Hue: -180 to +180 degrees
  if (settings.hue !== 0) {
    filters.push(`hue=h=${settings.hue}`);
  }
  
  // Temperature + Tint: use colorbalance filter
  const balanceParams: string[] = [];
  
  if (settings.temperature !== 0) {
    // Temperature: -50 to +50 → affects red/blue balance
    // Positive = warmer (more red), Negative = cooler (more blue)
    const tempScale = settings.temperature / 50; // -1 to +1
    if (tempScale > 0) {
      // Warmer: increase red, decrease blue
      balanceParams.push(`rs=${(tempScale * 30).toFixed(1)}`);
      balanceParams.push(`bs=${(-tempScale * 30).toFixed(1)}`);
    } else {
      // Cooler: decrease red, increase blue
      balanceParams.push(`rs=${(tempScale * 30).toFixed(1)}`);
      balanceParams.push(`bs=${(-tempScale * 30).toFixed(1)}`);
    }
  }
  
  if (settings.tint !== 0) {
    // Tint: -50 to +50 → affects green/magenta balance
    const tintScale = settings.tint / 50; // -1 to +1
    if (tintScale > 0) {
      // More magenta: decrease green
      balanceParams.push(`gs=${(-tintScale * 30).toFixed(1)}`);
    } else {
      // More green: increase green
      balanceParams.push(`gs=${(-tintScale * 30).toFixed(1)}`);
    }
  }
  
  if (balanceParams.length > 0) {
    filters.push(`colorbalance=${balanceParams.join(":")}`);
  }
  
  // Sharpness: -100 to +100
  if (settings.sharpness !== 0) {
    // Positive = sharpen, Negative = soften
    const sharpAmount = 1.0 + (settings.sharpness / 100);
    if (sharpAmount > 1.0) {
      // Sharpen using unsharp filter
      filters.push(`unsharp=m=1.5:a=${(sharpAmount * 0.5).toFixed(2)}`);
    } else if (sharpAmount < 1.0) {
      // Soften using blur
      const blurAmount = (1.0 - sharpAmount) * 5;
      filters.push(`boxblur=${blurAmount.toFixed(1)}`);
    }
  }
  
  // Blur: 0 to +100
  if (settings.blur > 0) {
    const blurAmount = Math.max(0, Math.min(10, settings.blur / 10));
    filters.push(`boxblur=${blurAmount.toFixed(1)}`);
  }
  
  return filters.length > 0 ? filters.join(",") : "";
}

/**
 * 🎬 Generate FFmpeg filter chain from overlay effects array
 * Applies blur, vignette, watermark, and gradient effects to video
 */
export function buildOverlayEffectFilterChain(effects: any[]): string {
  if (!effects || effects.length === 0) return "";
  
  const filters: string[] = [];
  
  // Process each overlay effect
  effects.forEach((effect) => {
    switch (effect.type) {
      case 'blur':
        // Blur: intensity 0-1 → blur radius 0-20
        const blurRadius = effect.intensity * 20;
        if (blurRadius > 0) {
          filters.push(`boxblur=${blurRadius.toFixed(1)}`);
        }
        break;
        
      case 'vignette':
        // Vignette: intensity 0-1 → angle and darkness
        // Default centered vignette with adjustable intensity
        const vignetteAngle = 45 * effect.intensity; // 0 to 45 degrees
        filters.push(`vignette=angle=${vignetteAngle}:x0=0.5:y0=0.5:r=${(0.5 + effect.intensity * 0.3).toFixed(2)}`);
        break;
        
      case 'watermark':
        // Watermark: typically a text or logo overlay
        // For simplicity, we'll use a semi-transparent rectangle in corner
        // In production, this would overlay an actual image file
        const watermarkOpacity = effect.opacity;
        // Drawtext filter for watermark text - "© Gully Fame"
        filters.push(`drawtext=text='© Gully Fame':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=20:fontcolor=white@${watermarkOpacity}:box=1:boxcolor=black@${(watermarkOpacity * 0.5).toFixed(2)}:x=10:y=h-30`);
        break;
        
      case 'gradient':
        // Gradient: overlay a color gradient on the video
        // Using drawgradient or lutrgb filter
        const gradientIntensity = effect.intensity;
        // Create a subtle orange gradient overlay
        filters.push(`colorchannelmixer=rr=1:gg=${(1 - gradientIntensity * 0.2).toFixed(2)}:bb=${(1 - gradientIntensity * 0.3).toFixed(2)}`);
        break;
    }
  });
  
  return filters.length > 0 ? filters.join(",") : "";
}

export async function applyPresetToImage(
  inputPath: string,
  outputPath: string,
  preset: FilterPreset
): Promise<string> {
  if (!isFFmpegAvailable) {
    throw new Error("FFmpeg not available in Expo Go. Create a development build for filter support.");
  }

  const filterChain = buildFFmpegFilterChain(preset);
  if (preset.name === "Original" || !filterChain) {
    const command = `-i "${inputPath}" -c copy -y "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();
    if (ReturnCode.isSuccess(returnCode)) return outputPath;
    throw new Error(`FFmpeg failed: ${(await session.getFailStackTrace()) || "Unknown error"}`);
  }

  const command = `-i "${inputPath}" -vf "${filterChain}" -y "${outputPath}"`;
  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (ReturnCode.isSuccess(returnCode)) return outputPath;
  throw new Error(`FFmpeg failed: ${(await session.getFailStackTrace()) || "Unknown error"}`);
}

export async function applyPresetToVideo(
  inputPath: string,
  outputPath: string,
  preset: FilterPreset
): Promise<string> {
  if (!isFFmpegAvailable) {
    throw new Error("FFmpeg not available in Expo Go. Create a development build for filter support.");
  }

  const filterChain = buildFFmpegFilterChain(preset);
  if (preset.name === "Original" || !filterChain) {
    const command = `-i "${inputPath}" -c copy -y "${outputPath}"`;
    const session = await FFmpegKit.execute(command);
    const returnCode = await session.getReturnCode();
    if (ReturnCode.isSuccess(returnCode)) return outputPath;
    throw new Error(`FFmpeg failed: ${(await session.getFailStackTrace()) || "Unknown error"}`);
  }

  const command = `-i "${inputPath}" -vf "${filterChain}" -c:v libx264 -c:a copy -preset medium -crf 23 -y "${outputPath}"`;
  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();
  if (ReturnCode.isSuccess(returnCode)) return outputPath;
  throw new Error(`FFmpeg failed: ${(await session.getFailStackTrace()) || "Unknown error"}`);
}

// 🔥 NAYA FEATURE: STICKERS KO VIDEO PAR BAKE KARNA 🔥
export async function applyOverlaysToVideo(
  inputVideoPath: string,
  outputPath: string,
  overlays: any[]
): Promise<string> {
  if (!isFFmpegAvailable) {
    throw new Error("FFmpeg not available in Expo Go. Create a development build for overlay support.");
  }

  // Agar koi overlays nahi hain, toh purani video hi return kar do
  if (!overlays || overlays.length === 0) return inputVideoPath;

  // Sirf 'image' type stickers nikal rahe hain
  const imageStickers = overlays.filter((o) => o.type === "image");
  if (imageStickers.length === 0) return inputVideoPath;

  // 1. Inputs create karo (Pehla input video hai, baaki stickers)
  let command = `-i "${inputVideoPath}" `;
  imageStickers.forEach((sticker) => {
    command += `-i "${sticker.content}" `;
  });

  // 2. Filter Complex build karo (Layers ko ek ke upar ek rakhna)
  let filterComplex = ``;
  let lastOutput = `0:v`;

  imageStickers.forEach((sticker, index) => {
    const currentInput = `${index + 1}:v`;
    const nextOutput = `v${index + 1}`;
    // By default hum stickers ko center mein chipka rahe hain (W-w)/2
    // Aage jaake hum yahan x, y, scale values inject karenge!
    filterComplex += `[${lastOutput}][${currentInput}]overlay=(W-w)/2:(H-h)/2`;

    if (index < imageStickers.length - 1) {
      filterComplex += `[${nextOutput}];`;
      lastOutput = nextOutput;
    }
  });

  // 3. Final command execution
  command += ` -filter_complex "${filterComplex}" -c:v libx264 -preset fast -c:a copy -y "${outputPath}"`;

  const session = await FFmpegKit.execute(command);
  const returnCode = await session.getReturnCode();

  if (ReturnCode.isSuccess(returnCode)) {
    return outputPath;
  } else {
    const failureStackTrace = (await session.getFailStackTrace()) || "Unknown overlay error";
    throw new Error(`FFmpeg Overlay failed: ${failureStackTrace}`);
  }
}
