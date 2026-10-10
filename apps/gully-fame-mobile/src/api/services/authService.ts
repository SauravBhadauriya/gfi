import apiClient from "../axios";
import { ApiResponse } from "../types";
import { setAuthToken } from "../axios";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  password: string;
  role: "participants" | "fan";
  referralCode?: string;
}

export interface RegisterResponse {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: string;
  };
  message?: string;
  token?: string;
  txnId?: string;
}

export interface VerifyOtpRequest {
  txnId?: string;
  mobile?: string;
  otp: number | string;
}

export interface VerifyOtpResponse {
  message?: string;
  token?: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: string;
  };
}

export interface GetUserProfileResponse {
  id?: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: string;
  profileImage?: string;
  gender?: string;
  dob?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  notificationAllowed?: boolean;
  googleId?: string;
  appleId?: string;
  device_token?: string;
  device_type?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  bio?: string;
  profileImage?: string;
  gender?: string;
  dob?: string;
  role?: string;
}

export interface UpdateProfileResponse {
  message?: string;
  data?: GetUserProfileResponse;
}

export interface LoginRequest {
  userId: string;
  viaPassword: boolean;
  password?: string;
}

export interface LoginResponse {
  message?: string;
  token?: string;
  txnId?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: string;
  };
}

export interface SocialLoginRequest {
  googleId?: string;
  appleId?: string;
  email: string;
  firstName: string;
  lastName: string;
  device_token: string;
  device_type: "android" | "ios" | "web" | "";
}

export interface SocialLoginResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    role: string;
  };
}

export interface ApiResponseWithTxnId<T> {
  success: boolean;
  message?: string;
  data?: T;
  txnId?: string;
}

export const authService = {
  registerUser: async (data: RegisterRequest) => {
    try {
      console.log("[authService] POST /auth/register");
      const response = await apiClient.post<ApiResponse<RegisterResponse>>("/auth/register", data, {
        skipAuth: true,
      });

      return {
        success: true,
        data: response.data.data || response.data,
        fullResponse: response.data,
        message: response.data.message || "Registration successful",
      };
    } catch (error: any) {
      console.error("[authService] registerUser error:", error.message);
      return {
        success: false,
        error: error.message || "Registration failed",
        status: error.status,
        data: error.data,
      };
    }
  },

  verifyOtp: async (data: VerifyOtpRequest) => {
    try {
      if (!data.txnId || typeof data.txnId !== "string" || data.txnId.trim() === "") {
        throw new Error("Transaction ID is required for OTP verification");
      }

      console.log("[authService] POST /auth/verifyOtp");
      const requestBody: any = {
        txnId: data.txnId.trim(),
        otp: typeof data.otp === "string" ? parseInt(data.otp, 10) : data.otp,
      };

      const response = await apiClient.post<ApiResponse<VerifyOtpResponse>>(
        "/auth/verifyOtp",
        requestBody,
        { skipAuth: true }
      );


      const responseAny = response.data as any;
      const responseData = responseAny.data || responseAny;


      console.log("[authService] verifyOtp response:", {
        hasData: !!responseData,
        hasToken: !!responseData?.token,
        hasUserId: !!responseData?.userId,
        hasUser: !!responseData?.user,
        responseKeys: responseData ? Object.keys(responseData) : [],
      });

      
      let finalData = responseData || {};

      if (responseData && responseData.token && responseData.userId && !responseData.user) {
        try {
          await setAuthToken(responseData.token);
          console.log("[authService] Token stored, fetching user profile...");

          const userProfileResult = await authService.getUserProfile(responseData.userId);
          if (userProfileResult.success && userProfileResult.data) {
            const fetchedUserData = userProfileResult.data;
            if (fetchedUserData.email || fetchedUserData.firstName || fetchedUserData.mobile) {
              finalData = {
                ...responseData,
                user: fetchedUserData,
              };
              console.log("[authService] User profile fetched and merged");
            }
          }
        } catch (error) {
          console.error("[authService] Error fetching user profile:", error);

          console.log("[authService] Continuing with token-only response");
        }
      } else if (responseData && responseData.token) {

        try {
          await setAuthToken(responseData.token);
          console.log("[authService] Token stored (no userId available)");
        } catch (error) {
          console.error("[authService] Error storing token:", error);
        }
      }

      return {
        success: true,
        data: finalData,
        message: response.data.message || "OTP verified successfully",
      };
    } catch (error: any) {
      console.error("[authService] verifyOtp error:", error.message);
      return {
        success: false,
        error: error.message || "OTP verification failed",
        status: error.status,
        data: error.data,
      };
    }
  },

  login: async (data: LoginRequest) => {
    try {
      console.log("[authService] POST /auth/login");
      const requestBody: any = {
        userId: data.userId.trim(),
        viaPassword: data.viaPassword,
      };

      if (data.viaPassword && data.password) {
        requestBody.password = data.password;
      }

      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        requestBody,
        { skipAuth: true }
      );

      const responseAny = response.data as any;
      const responseData = responseAny.data || responseAny;

      return {
        success: true,
        data: responseData,
        fullResponse: response.data,
        message: response.data.message || "Login successful",
      };
    } catch (error: any) {
      console.error("[authService] login error:", error.message);
      let errorMessage = error.message || "Login failed";
      if (error.isNetworkError) {
        errorMessage =
          error.message ||
          "Network error: Unable to connect to server. Please check your internet connection.";
      }

      return {
        success: false,
        error: errorMessage,
        status: error.status,
        data: error.data,
        isNetworkError: error.isNetworkError || false,
      };
    }
  },

  socialLogin: async (data: SocialLoginRequest) => {
    try {
      console.log("[authService] POST /auth/login/social");
      const response = await apiClient.post<ApiResponse<SocialLoginResponse>>(
        "/auth/login/social",
        data,
        { skipAuth: true }
      );

      return {
        success: true,
        data: response.data.data,
        fullResponse: response.data,
        message: response.data.message || "Social login successful",
      };
    } catch (error: any) {
      console.error("[authService] socialLogin error:", error.message);
      return {
        success: false,
        error: error.message || "Social login failed",
        status: error.status,
        data: error.data,
      };
    }
  },

  getUserProfile: async (userId?: string) => {
    const endpointsToTry = [
      "/user/profile",
      "/users/profile",
      "/auth/user/profile",
      "/auth/user",
      "/user",
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`[authService] GET ${endpoint}`);
        const response = await apiClient.get<ApiResponse<GetUserProfileResponse>>(endpoint, {
          skipAuth: false,
        });

        const responseAny = response.data as any;

        if (typeof responseAny === "string") {
          continue;
        }

        const userData = responseAny.data || responseAny;

        if (userData && (userData._id || userData.id || userData.email || userData.firstName)) {
          return {
            success: true,
            data: {
              id: userData._id || userData.id || userId || "",
              email: userData.email || "",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              mobile: userData.mobile || "",
              role: userData.role || "participant",
              profileImage: userData.profileImage || "",
              gender: userData.gender || "",
              dob: userData.dob || "",
              bio: userData.bio || "",
            },
            message: "User profile fetched successfully",
          };
        } else {
          continue;
        }
      } catch (error: any) {
        continue;
      }
    }

    console.error("[authService] All profile endpoints failed");
    return {
      success: false,
      error: "All profile endpoints failed or returned invalid data",
      status: null,
      data: null,
    };
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    try {
      console.log("[authService] PUT /user/profile");

      // Ensure token is fresh before making the authenticated request
      try {
        const { ensureTokenFresh } = await import("../tokenUtils");
        await ensureTokenFresh();
        if (__DEV__) console.log("[authService] Token is fresh, proceeding with profile update");
      } catch (refreshError: any) {
        if (__DEV__) console.error("[authService] Token refresh failed:", refreshError.message);
        return {
          success: false,
          error: "Session expired. Please log in again.",
          status: 401,
          data: null,
        };
      }

      const response = await apiClient.put<ApiResponse<UpdateProfileResponse>>(
        "/user/profile",
        data,
        { skipAuth: false }
      );

      const responseAny = response.data as any;
      const userData = responseAny.data || responseAny;

     
      try {
        const { autoVerifyKycIfComplete } = await import("../../utils/kycValidation");
        await autoVerifyKycIfComplete();
      } catch (kycError) {

        if (__DEV__) {
          console.log("[authService] Could not auto-verify KYC:", kycError);
        }
      }

      return {
        success: true,
        data: userData,
        message: response.data.message || "Profile updated successfully",
      };
    } catch (error: any) {
      console.error("[authService] updateProfile error:", error.message);
      return {
        success: false,
        error: error.message || "Failed to update profile",
        status: error.status,
        data: error.data,
      };
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const endpointsToTry = [
      "/user/change-password",
      "/auth/change-password",
      "/user/password",
      "/auth/password",
    ];

    for (const endpoint of endpointsToTry) {
      try {
        console.log(`[authService] PUT ${endpoint}`);
        const response = await apiClient.put<ApiResponse<any>>(
          endpoint,
          {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
          { skipAuth: false }
        );

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message || "Password changed successfully",
        };
      } catch (error: any) {
        if (endpointsToTry.indexOf(endpoint) === endpointsToTry.length - 1) {
          console.error("[authService] changePassword error:", error.message);
          const errorMsg = error.data?.message || error.message || "Failed to change password";
          return {
            success: false,
            error: errorMsg,
            status: error.status,
            data: error.data,
          };
        }
        continue;
      }
    }

    return {
      success: false,
      error: "Failed to change password. Please try again.",
      status: null,
      data: null,
    };
  },

  forgotPassword: async (userId: string) => {
    try {
      console.log("[authService] POST /auth/forgot-password");
      const response = await apiClient.post<ApiResponse<any>>(
        "/auth/forgot-password",
        { userId: userId.trim() },
        { skipAuth: true }
      );

      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || "Password reset link sent successfully",
      };
    } catch (error: any) {
      console.error("[authService] forgotPassword error:", error.message);
      return {
        success: false,
        error: error.data?.message || error.message || "Failed to send password reset link",
        status: error.status,
        data: error.data,
      };
    }
  },

  resetPassword: async (password: string) => {
    try {
      console.log("[authService] PUT /auth/reset-password");
      const response = await apiClient.put<ApiResponse<any>>(
        "/auth/reset-password",
        { password: password },
        { skipAuth: false }
      );

      return {
        success: true,
        data: response.data.data || response.data,
        message:
          response.data.message || "Password updated successfully. Please login with new password!",
      };
    } catch (error: any) {
      console.error("[authService] resetPassword error:", error.message);
      return {
        success: false,
        error: error.data?.message || error.message || "Failed to reset password",
        status: error.status,
        data: error.data,
      };
    }
  },

  resendOtp: async (userId: string) => {
    try {
      console.log("[authService] POST /auth/resendOtp");
      const response = await apiClient.post<ApiResponse<{ txnId: string }>>(
        "/auth/resendOtp",
        { userId: userId.trim() },
        { skipAuth: true }
      );

      const responseAny = response.data as any;
      const txnId = responseAny.data?.txnId || responseAny.txnId;

      return {
        success: true,
        data: { txnId },
        message: response.data.message || "OTP resent successfully",
      };
    } catch (error: any) {
      console.error("[authService] resendOtp error:", error.message);
      return {
        success: false,
        error: error.data?.message || error.message || "Failed to resend OTP",
        status: error.status,
        data: error.data,
      };
    }
  },
};
