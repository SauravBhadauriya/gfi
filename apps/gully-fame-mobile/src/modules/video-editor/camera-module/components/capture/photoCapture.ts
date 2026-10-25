import { loadImage, type Image as NitroImage } from "react-native-nitro-image";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";
import type { CameraRef } from "react-native-vision-camera";

import { FULL_FRAME, type Lens, type LensAsset } from "./lenses";

// NitroImage can only load local files here (no web loader installed), and in dev
// bundled assets are served over http, so both kinds are resolved to a file first.
async function loadLensImage(asset: LensAsset): Promise<NitroImage> {
  if (typeof asset === "number") {
    const [resolved] = await Asset.loadAsync(asset);
    if (!resolved?.localUri) throw new Error("Lens image could not be loaded");
    return await loadImage({ filePath: resolved.localUri.replace("file://", "") });
  }
  const target = `${FileSystem.cacheDirectory}lens-${encodeURIComponent(asset).slice(-80)}`;
  const info = await FileSystem.getInfoAsync(target);
  if (!info.exists) await FileSystem.downloadAsync(asset, target);
  return await loadImage({ filePath: target.replace("file://", "") });
}

/**
 * Captures the current preview frame and burns the lens overlay into it,
 * using the same placement LensOverlay uses on screen.
 * Uses the preview snapshot so the camera's outputs/binding stay untouched.
 */
export async function capturePhotoWithLens(camera: CameraRef, lens: Lens | null): Promise<string> {
  let photo: NitroImage = await camera.takeSnapshot();

  if (lens) {
    const overlay = await loadLensImage(lens.overlayUrl);
    const rect = lens.overlayRect ?? FULL_FRAME;
    let x = rect.x * photo.width;
    let y = rect.y * photo.height;
    let w = rect.width * photo.width;
    let h = rect.height * photo.height;

    // Stickers use contentFit="contain" on screen; full frames use "fill".
    if (lens.overlayRect) {
      const aspect = overlay.width / overlay.height;
      if (w / h > aspect) {
        const fitted = h * aspect;
        x += (w - fitted) / 2;
        w = fitted;
      } else {
        const fitted = w / aspect;
        y += (h - fitted) / 2;
        h = fitted;
      }
    }
    photo = await photo.renderIntoAsync(overlay, x, y, w, h);
  }

  const path = await photo.saveToTemporaryFileAsync("jpg", 92);
  return path.startsWith("file://") ? path : `file://${path}`;
}
