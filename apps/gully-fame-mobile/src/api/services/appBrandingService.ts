import { apiGet, toResult, ApiResult } from "../client";

/**
 * Public branding.
 * GET /public/logo   -> data: logo URL (string)
 * GET /public/splash -> data: splash image URLs (string[])
 */

export interface LogoResponse {
  logoUrl: string;
}

export interface SplashResponse {
  images: string[];
}

export const getLogo = (): Promise<ApiResult<LogoResponse>> =>
  toResult(async () => ({ logoUrl: (await apiGet<string>("public/logo", { skipAuth: true })) || "" }));

export const getSplash = (): Promise<ApiResult<SplashResponse>> =>
  toResult(async () => {
    const data = await apiGet<string[] | string>("public/splash", { skipAuth: true });
    return { images: Array.isArray(data) ? data.filter(Boolean) : data ? [data] : [] };
  });

export const appBrandingService = { getLogo, getSplash };

export default appBrandingService;
