import { getAuthHeaders } from "./authApi";
import type { ApiResponse } from "./apiTypes";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend.gullyfame.com/v1/api/";

export interface LogoResponse {
  logoUrl: string;
}

export interface SplashResponse {
  images: string[];
}

export async function uploadLogo(file: File): Promise<ApiResponse<LogoResponse>> {
  const endpoint = `${BASE_URL}public/logo`;

  console.log("[Branding API] POST Upload Logo - Endpoint:", endpoint);
  console.log("[Branding API] POST Upload Logo - File name:", file.name);
  console.log("[Branding API] POST Upload Logo - File size:", file.size, "bytes");
  console.log("[Branding API] POST Upload Logo - File type:", file.type);

  const formData = new FormData();
  formData.append("logo", file);
  formData.append("splash", "");
  console.log("[Branding API] POST Upload Logo - FormData keys:", Array.from(formData.keys()));
  console.log(
    "[Branding API] POST Upload Logo - FormData entries count:",
    Array.from(formData.entries()).length
  );

  const headers = getAuthHeaders();
  delete (headers as any)["Content-Type"];

  try {
    const httpResponse = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    const responseText = await httpResponse.text();
    console.log("[Branding API] POST Upload Logo - Response received:", responseText);
    console.log(
      "[Branding API] POST Upload Logo - Status:",
      httpResponse.status,
      httpResponse.statusText
    );

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log("[Branding API] POST Upload Logo - Parsed JSON:", responseData);
    } catch (parseError) {
      console.error("[Branding API] POST Upload Logo - Parse error:", parseError);

      if (!httpResponse.ok) {
        console.error(
          "[Branding API] POST Upload Logo - Error:",
          httpResponse.status,
          httpResponse.statusText
        );
        return {
          success: false,
          message: `Upload failed: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
          data: undefined,
        };
      }

      return {
        success: false,
        message: "Invalid response format from server",
        error: "INVALID_JSON",
        data: undefined,
      };
    }

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error("[Branding API] POST Upload Logo - API Error:", responseData);
      return {
        success: false,
        message: responseData.message || `Upload failed with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: undefined,
      };
    }

    console.log("[Branding API] POST Upload Logo - Success:", responseData);

    return {
      success: true,
      message: responseData.message || "Logo uploaded successfully",
      data: { logoUrl: responseData.data?.logoUrl || "" },
    };
  } catch (error: any) {
    console.error("[Branding API] POST Upload Logo - Network error:", error);

    return {
      success: false,
      message: error.message || "Network error occurred",
      error: error.message || "NETWORK_ERROR",
      data: undefined,
    };
  }
}

export async function uploadSplash(files: File[]): Promise<ApiResponse<SplashResponse>> {
  const endpoint = `${BASE_URL}public/splash`;

  console.log("[Branding API] POST Upload Splash - Endpoint:", endpoint);
  console.log("[Branding API] POST Upload Splash - Number of files:", files.length);
  files.forEach((file, index) => {
    console.log(
      `[Branding API] POST Upload Splash - File ${index + 1}:`,
      file.name,
      `(${file.size} bytes, ${file.type})`
    );
  });

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("splash", file);
  });
  console.log("[Branding API] POST Upload Splash - FormData keys:", Array.from(formData.keys()));
  console.log(
    "[Branding API] POST Upload Splash - FormData entries count:",
    Array.from(formData.entries()).length
  );

  const headers = getAuthHeaders();
  delete (headers as any)["Content-Type"];

  try {
    const httpResponse = await fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    const responseText = await httpResponse.text();
    console.log("[Branding API] POST Upload Splash - Response received:", responseText);
    console.log(
      "[Branding API] POST Upload Splash - Status:",
      httpResponse.status,
      httpResponse.statusText
    );

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log("[Branding API] POST Upload Splash - Parsed JSON:", responseData);
    } catch (parseError) {
      console.error("[Branding API] POST Upload Splash - Parse error:", parseError);

      if (!httpResponse.ok) {
        console.error(
          "[Branding API] POST Upload Splash - Error:",
          httpResponse.status,
          httpResponse.statusText
        );
        return {
          success: false,
          message: `Upload failed: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
          data: undefined,
        };
      }

      return {
        success: false,
        message: "Invalid response format from server",
        error: "INVALID_JSON",
        data: undefined,
      };
    }

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error("[Branding API] POST Upload Splash - API Error:", responseData);
      return {
        success: false,
        message: responseData.message || `Upload failed with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: undefined,
      };
    }

    console.log("[Branding API] POST Upload Splash - Success:", responseData);

    return {
      success: true,
      message: responseData.message || "Splash images uploaded successfully",
      data: { images: responseData.data?.images || [] },
    };
  } catch (error: any) {
    console.error("[Branding API] POST Upload Splash - Network error:", error);

    return {
      success: false,
      message: error.message || "Network error occurred",
      error: error.message || "NETWORK_ERROR",
      data: undefined,
    };
  }
}

export async function getLogo(): Promise<ApiResponse<LogoResponse>> {
  const endpoint = `${BASE_URL}public/logo`;

  console.log("[Branding API] GET Logo - Endpoint:", endpoint);

  try {
    const httpResponse = await fetch(endpoint, {
      method: "GET",
      headers: getAuthHeaders({
        Accept: "application/json",
      }),
      cache: "no-store",
    });

    const responseText = await httpResponse.text();
    console.log("[Branding API] GET Logo - Response received:", responseText);
    console.log("[Branding API] GET Logo - Status:", httpResponse.status, httpResponse.statusText);

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log("[Branding API] GET Logo - Parsed JSON:", responseData);
    } catch (parseError) {
      console.error("[Branding API] GET Logo - Parse error:", parseError);

      if (!httpResponse.ok) {
        console.error(
          "[Branding API] GET Logo - Error:",
          httpResponse.status,
          httpResponse.statusText
        );
        return {
          success: false,
          message: `Failed to fetch logo: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
          data: undefined,
        };
      }

      return {
        success: false,
        message: "Invalid response format from server",
        error: "INVALID_JSON",
        data: undefined,
      };
    }

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error("[Branding API] GET Logo - API Error:", responseData);
      return {
        success: false,
        message: responseData.message || `Failed to fetch logo with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: undefined,
      };
    }

    const logoUrl =
      typeof responseData.data === "string" ? responseData.data : responseData.data?.logoUrl || "";

    console.log("[Branding API] GET Logo - Success, Logo URL:", logoUrl);

    return {
      success: true,
      message: responseData.message || "Logo fetched successfully",
      data: { logoUrl },
    };
  } catch (error: any) {
    console.error("[Branding API] GET Logo - Network error:", error);

    return {
      success: false,
      message: error.message || "Network error occurred",
      error: error.message || "NETWORK_ERROR",
      data: undefined,
    };
  }
}

export async function getSplash(): Promise<ApiResponse<SplashResponse>> {
  const endpoint = `${BASE_URL}public/splash`;

  console.log("[Branding API] GET Splash - Endpoint:", endpoint);

  try {
    const httpResponse = await fetch(endpoint, {
      method: "GET",
      headers: getAuthHeaders({
        Accept: "application/json",
      }),
      cache: "no-store",
    });

    const responseText = await httpResponse.text();
    console.log("[Branding API] GET Splash - Response received:", responseText);
    console.log(
      "[Branding API] GET Splash - Status:",
      httpResponse.status,
      httpResponse.statusText
    );

    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
      console.log("[Branding API] GET Splash - Parsed JSON:", responseData);
    } catch (parseError) {
      console.error("[Branding API] GET Splash - Parse error:", parseError);

      if (!httpResponse.ok) {
        console.error(
          "[Branding API] GET Splash - Error:",
          httpResponse.status,
          httpResponse.statusText
        );
        return {
          success: false,
          message: `Failed to fetch splash images: ${httpResponse.statusText} (Status: ${httpResponse.status})`,
          error: `HTTP ${httpResponse.status}`,
          data: undefined,
        };
      }

      return {
        success: false,
        message: "Invalid response format from server",
        error: "INVALID_JSON",
        data: undefined,
      };
    }

    if (!httpResponse.ok || responseData.code !== 1) {
      console.error("[Branding API] GET Splash - API Error:", responseData);
      return {
        success: false,
        message:
          responseData.message ||
          `Failed to fetch splash images with status ${httpResponse.status}`,
        error: responseData.error || `HTTP ${httpResponse.status}`,
        data: undefined,
      };
    }

    const images = Array.isArray(responseData.data) ? responseData.data : [];

    console.log("[Branding API] GET Splash - Success, Images:", images);

    return {
      success: true,
      message: responseData.message || "Splash images fetched successfully",
      data: { images },
    };
  } catch (error: any) {
    console.error("[Branding API] GET Splash - Network error:", error);

    return {
      success: false,
      message: error.message || "Network error occurred",
      error: error.message || "NETWORK_ERROR",
      data: undefined,
    };
  }
}
